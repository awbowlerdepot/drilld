import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import {
    BeginTransactionCommand,
    CommitTransactionCommand,
    ExecuteStatementCommand,
    RDSDataClient,
    RollbackTransactionCommand,
    SqlParameter
} from '@aws-sdk/client-rds-data';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { migrationSection, migrationVersion, splitSql } from './sql';

/**
 * Runs on every deploy as a CloudFormation custom resource:
 *   1. applies pending db/migrations (bundled next to this file) through the
 *      RDS Data API, one transaction per migration, tracked in dbmate's
 *      schema_migrations table
 *   2. creates or updates the login users for the API and the catalog sync job
 *      from their Secrets Manager secrets
 */

const rdsData = new RDSDataClient({});
const secrets = new SecretsManagerClient({});

const env = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable ${name}`);
    return value;
};

const CLUSTER_ARN = env('CLUSTER_ARN');
const ADMIN_SECRET_ARN = env('ADMIN_SECRET_ARN');
const DATABASE = env('DATABASE_NAME');
const LOGINS: { secretArn: string; groupRole: string }[] = [
    { secretArn: env('API_SECRET_ARN'), groupRole: 'drilld_app' },
    { secretArn: env('CATALOG_SYNC_SECRET_ARN'), groupRole: 'drilld_catalog_sync' }
];
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const execute = (sql: string, transactionId?: string, parameters?: SqlParameter[]) =>
    rdsData.send(new ExecuteStatementCommand({
        resourceArn: CLUSTER_ARN,
        secretArn: ADMIN_SECRET_ARN,
        database: DATABASE,
        sql,
        transactionId,
        parameters
    }));

const inTransaction = async (work: (transactionId: string) => Promise<void>) => {
    const { transactionId } = await rdsData.send(new BeginTransactionCommand({
        resourceArn: CLUSTER_ARN,
        secretArn: ADMIN_SECRET_ARN,
        database: DATABASE
    }));
    if (!transactionId) throw new Error('Data API did not return a transaction id');

    try {
        await work(transactionId);
        await rdsData.send(new CommitTransactionCommand({ resourceArn: CLUSTER_ARN, secretArn: ADMIN_SECRET_ARN, transactionId }));
    } catch (error) {
        await rdsData.send(new RollbackTransactionCommand({ resourceArn: CLUSTER_ARN, secretArn: ADMIN_SECRET_ARN, transactionId }))
            .catch(rollbackError => console.error('Rollback failed', rollbackError));
        throw error;
    }
};

/** A paused Aurora Serverless v2 cluster takes a few seconds to resume; retry until it answers. */
const waitForDatabase = async () => {
    const deadline = Date.now() + 5 * 60 * 1000;
    for (let attempt = 1; ; attempt++) {
        try {
            await execute('select 1');
            return;
        } catch (error) {
            const name = (error as Error).name;
            const retryable = name === 'DatabaseResumingException' || name === 'DatabaseUnavailableException'
                || name === 'StatementTimeoutException' || name === 'ServiceUnavailableError';
            if (!retryable || Date.now() > deadline) throw error;
            console.log(`Database not ready (${name}), retrying (attempt ${attempt})`);
            await new Promise(resolve => setTimeout(resolve, Math.min(2000 * attempt, 15000)));
        }
    }
};

const applyMigrations = async (): Promise<string[]> => {
    // Same table and column as dbmate, so either tool can manage the schema.
    await execute('create table if not exists schema_migrations (version varchar(128) primary key)');

    const result = await execute('select version from schema_migrations');
    const applied = new Set((result.records ?? []).map(record => record[0].stringValue));

    const files = readdirSync(MIGRATIONS_DIR).filter(file => file.endsWith('.sql')).sort();
    const newlyApplied: string[] = [];

    for (const file of files) {
        const version = migrationVersion(file);
        if (applied.has(version)) continue;

        const statements = splitSql(migrationSection(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'), 'up'));
        console.log(`Applying ${file} (${statements.length} statements)`);

        await inTransaction(async transactionId => {
            for (const [index, statement] of statements.entries()) {
                try {
                    await execute(statement, transactionId);
                } catch (error) {
                    throw new Error(`${file}, statement ${index + 1}: ${(error as Error).message}`);
                }
            }
            await execute('insert into schema_migrations (version) values (:version)', transactionId,
                [{ name: 'version', value: { stringValue: version } }]);
        });

        newlyApplied.push(file);
    }

    return newlyApplied;
};

const ensureLogins = async () => {
    await inTransaction(async transactionId => {
        // Session-only helper, so passwords are bound as parameters rather than
        // written into SQL text. It disappears when the transaction's session ends.
        await execute(`
            create function pg_temp.drilld_ensure_login(p_user text, p_password text, p_group text) returns void
            language plpgsql as $$
            begin
                if exists (select from pg_roles where rolname = p_user) then
                    execute format('alter role %I with login password %L', p_user, p_password);
                else
                    execute format('create role %I with login password %L', p_user, p_password);
                end if;
                execute format('grant %I to %I', p_group, p_user);
            end;
            $$`, transactionId);

        for (const { secretArn, groupRole } of LOGINS) {
            const secret = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn }));
            const { username, password } = JSON.parse(secret.SecretString ?? '{}') as { username?: string; password?: string };
            if (!username || !password) throw new Error(`Secret ${secretArn} has no username/password`);

            await execute('select pg_temp.drilld_ensure_login(:username, :password, :group)', transactionId, [
                { name: 'username', value: { stringValue: username } },
                { name: 'password', value: { stringValue: password } },
                { name: 'group', value: { stringValue: groupRole } }
            ]);
            console.log(`Login ${username} is a member of ${groupRole}`);
        }
    });
};

export const handler = async (event: CloudFormationCustomResourceEvent) => {
    const physicalResourceId = 'drilld-database-migrations';

    // Never undo migrations on stack deletion: production keeps its data, and
    // sandbox clusters are deleted along with the stack anyway.
    if (event.RequestType === 'Delete') {
        return { PhysicalResourceId: physicalResourceId };
    }

    await waitForDatabase();
    const applied = await applyMigrations();
    await ensureLogins();

    console.log(applied.length > 0 ? `Applied: ${applied.join(', ')}` : 'No pending migrations');
    return {
        PhysicalResourceId: physicalResourceId,
        Data: { applied: applied.join(',') }
    };
};
