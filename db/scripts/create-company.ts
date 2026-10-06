/**
 * Creates a company with its first location and its owner (a platform admin
 * task; the API cannot create companies). The owner then signs in with that
 * email and is linked to this account on first sign-in (link_app_user).
 *
 *   npx tsx db/scripts/create-company.ts --stack <database stack name> \
 *     --company "Strike Zone Pro Shop" --location "Main Location" --timezone America/Denver \
 *     --owner-email owner@example.com --owner-first Pat --owner-last Owner
 *
 * The database stack is the one whose name contains "database", e.g.
 * amplify-d1fijf3mjtco4q-main-branch-…-database… (production) or
 * amplify-drilld-<you>-sandbox-…-database… (your sandbox).
 * Uses your AWS credentials and the cluster's admin secret.
 */
import { parseArgs } from 'node:util';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { RDSDataClient, BeginTransactionCommand, CommitTransactionCommand, ExecuteStatementCommand, RollbackTransactionCommand, SqlParameter } from '@aws-sdk/client-rds-data';

const { values: args } = parseArgs({
    options: {
        stack: { type: 'string' },
        region: { type: 'string', default: 'us-west-1' },
        company: { type: 'string' },
        location: { type: 'string' },
        timezone: { type: 'string' },
        'owner-email': { type: 'string' },
        'owner-first': { type: 'string' },
        'owner-last': { type: 'string' }
    }
});

const required = (name: keyof typeof args): string => {
    const value = args[name];
    if (typeof value !== 'string' || value.trim() === '') {
        console.error(`Missing --${name}`);
        process.exit(2);
    }
    return value.trim();
};

const text = (name: string, value: string): SqlParameter => ({ name, value: { stringValue: value } });
const id = (name: string, value: string): SqlParameter => ({ name, typeHint: 'UUID', value: { stringValue: value } });

const main = async () => {
    const stackName = required('stack');
    const region = args.region!;

    const stack = (await new CloudFormationClient({ region }).send(new DescribeStacksCommand({ StackName: stackName }))).Stacks?.[0];
    const output = (prefix: string) => {
        const value = stack?.Outputs?.find(o => o.OutputKey?.startsWith(prefix))?.OutputValue;
        if (!value) throw new Error(`Stack ${stackName} has no ${prefix} output. Is it the database stack?`);
        return value;
    };
    const resourceArn = output('DatabaseClusterArn');
    const secretArn = output('DatabaseAdminSecretArn');
    const database = 'drilld';

    const rds = new RDSDataClient({ region });

    // A paused database takes a few seconds to resume; retry until it answers.
    let transactionId: string | undefined;
    for (let attempt = 1; !transactionId; attempt++) {
        try {
            transactionId = (await rds.send(new BeginTransactionCommand({ resourceArn, secretArn, database }))).transactionId;
        } catch (error) {
            if ((error as Error).name !== 'DatabaseResumingException' || attempt > 10) throw error;
            console.log('Database is resuming, retrying…');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    const run = async (sql: string, parameters: SqlParameter[]) => {
        const result = await rds.send(new ExecuteStatementCommand({ resourceArn, secretArn, database, transactionId, sql, parameters }));
        return result.records?.[0]?.[0]?.stringValue;
    };

    try {
        const companyId = await run(
            `insert into company (name, plan_code) values (:name, 'STANDARD') returning id::text`,
            [text('name', required('company'))]);
        const locationId = await run(
            `insert into location (company_id, name, timezone) values (:company, :name, :timezone) returning id::text`,
            [id('company', companyId!), text('name', required('location')), text('timezone', required('timezone'))]);
        const ownerId = await run(
            `insert into app_user (company_id, email, first_name, last_name, company_role)
             values (:company, :email, :first, :last, 'OWNER') returning id::text`,
            [id('company', companyId!), text('email', required('owner-email')),
             text('first', required('owner-first')), text('last', required('owner-last'))]);
        await run(
            `insert into location_membership (company_id, user_id, location_id, role) values (:company, :user, :location, 'MANAGER')`,
            [id('company', companyId!), id('user', ownerId!), id('location', locationId!)]);

        await rds.send(new CommitTransactionCommand({ resourceArn, secretArn, transactionId }));
        console.log(`Created company ${companyId}, location ${locationId}, owner ${ownerId} (${args['owner-email']}).`);
        console.log('The owner is linked to their Cognito login on first sign-in with that email.');
    } catch (error) {
        await rds.send(new RollbackTransactionCommand({ resourceArn, secretArn, transactionId }));
        throw error;
    }
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
