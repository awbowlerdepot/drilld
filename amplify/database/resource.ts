import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CfnOutput, CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Provider } from 'aws-cdk-lib/custom-resources';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations', import.meta.url));
const DATABASE_NAME = 'drilld';

interface DatabaseOptions {
    /**
     * Branch deployments (production) are protected: deletion protection on,
     * a snapshot is kept if the stack is ever removed, and longer backups.
     * Sandboxes are disposable.
     */
    protect: boolean;
}

/**
 * Aurora PostgreSQL Serverless v2 for one Amplify environment (the main branch
 * or a developer sandbox), plus a runner that applies db/migrations on deploy.
 *
 * - Its own VPC with isolated subnets only: no NAT gateway, no internet access,
 *   not publicly reachable.
 * - Scales to zero and pauses when idle; the first request after a pause waits
 *   about 15 seconds while it resumes.
 * - Reached through the RDS Data API (HTTPS + IAM + Secrets Manager), so
 *   Lambdas don't need to run inside the VPC.
 */
export const defineDatabase = (stack: Stack, { protect }: DatabaseOptions) => {
    const vpc = new ec2.Vpc(stack, 'Vpc', {
        maxAzs: 2,
        natGateways: 0,
        subnetConfiguration: [
            { name: 'database', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 }
        ]
    });

    const cluster = new rds.DatabaseCluster(stack, 'Cluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
            version: rds.AuroraPostgresEngineVersion.VER_16_8
        }),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        writer: rds.ClusterInstance.serverlessV2('writer'),
        serverlessV2MinCapacity: 0,
        serverlessV2MaxCapacity: protect ? 4 : 2,
        serverlessV2AutoPauseDuration: Duration.minutes(protect ? 30 : 10),
        // Owns the schema and runs migrations. Never used by the API.
        credentials: rds.Credentials.fromGeneratedSecret('drilld_admin'),
        defaultDatabaseName: DATABASE_NAME,
        enableDataApi: true,
        storageEncrypted: true,
        backup: { retention: Duration.days(protect ? 14 : 1) },
        deletionProtection: protect,
        removalPolicy: protect ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY
    });

    // Login users, created by the migration runner. Group roles and grants come from the migrations.
    const loginSecret = (id: string, username: string) => {
        const secret = new rds.DatabaseSecret(stack, id, { username, excludeCharacters: '"@/\\\' ' });
        secret.applyRemovalPolicy(protect ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY);
        return secret.attach(cluster);
    };
    const apiSecret = loginSecret('ApiUserSecret', 'drilld_api');
    const catalogSyncSecret = loginSecret('CatalogSyncUserSecret', 'drilld_catalog_sync_job');

    const logGroup = (id: string) => new logs.LogGroup(stack, id, {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY
    });

    const migrateFunction = new NodejsFunction(stack, 'MigrateFunction', {
        entry: fileURLToPath(new URL('./migrate-handler.ts', import.meta.url)),
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        timeout: Duration.minutes(10),
        memorySize: 256,
        logGroup: logGroup('MigrateFunctionLogs'),
        environment: {
            CLUSTER_ARN: cluster.clusterArn,
            ADMIN_SECRET_ARN: cluster.secret!.secretArn,
            DATABASE_NAME,
            API_SECRET_ARN: apiSecret.secretArn,
            CATALOG_SYNC_SECRET_ARN: catalogSyncSecret.secretArn
        },
        bundling: {
            // The AWS SDK is part of the Lambda runtime.
            externalModules: ['@aws-sdk/*'],
            commandHooks: {
                beforeBundling: () => [],
                beforeInstall: () => [],
                afterBundling: (_inputDir: string, outputDir: string) => [
                    `cp -R "${MIGRATIONS_DIR}" "${outputDir}/migrations"`
                ]
            }
        }
    });
    cluster.grantDataApiAccess(migrateFunction);
    apiSecret.grantRead(migrateFunction);
    catalogSyncSecret.grantRead(migrateFunction);

    const provider = new Provider(stack, 'MigrateProvider', {
        onEventHandler: migrateFunction,
        logGroup: logGroup('MigrateProviderLogs')
    });

    // Runs on create, and again whenever a migration file changes.
    const migrations = new CustomResource(stack, 'Migrations', {
        serviceToken: provider.serviceToken,
        properties: { migrationsHash: hashMigrations() }
    });
    migrations.node.addDependency(cluster);

    new CfnOutput(stack, 'DatabaseClusterArn', { value: cluster.clusterArn });
    new CfnOutput(stack, 'DatabaseAdminSecretArn', { value: cluster.secret!.secretArn });
    new CfnOutput(stack, 'DatabaseApiSecretArn', { value: apiSecret.secretArn });

    return { cluster, apiSecret, catalogSyncSecret, databaseName: DATABASE_NAME };
};

const hashMigrations = (): string => {
    const hash = createHash('sha256');
    for (const file of readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()) {
        hash.update(file).update(readFileSync(`${MIGRATIONS_DIR}/${file}`));
    }
    return hash.digest('hex');
};
