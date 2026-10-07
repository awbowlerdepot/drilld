import { fileURLToPath } from 'node:url';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { IUserPool, IUserPoolClient } from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import type { IDatabaseCluster } from 'aws-cdk-lib/aws-rds';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

/** Browser origins allowed to call the API. */
const ALLOWED_ORIGINS = [
    'https://app.drilld.io',
    'https://main.d1fijf3mjtco4q.amplifyapp.com',
    'http://localhost:3000'
];

interface ApiOptions {
    userPool: IUserPool;
    userPoolClient: IUserPoolClient;
    cluster: IDatabaseCluster;
    /** The drilld_api login (member of drilld_app). Never the admin secret. */
    apiSecret: ISecret;
    databaseName: string;
}

/**
 * REST API: an API Gateway HTTP API in front of one Lambda (amplify/api/handler.ts).
 *
 * - Every route requires a Cognito ID token (JWT authorizer); API Gateway
 *   rejects unauthenticated requests before the Lambda runs. CORS preflights
 *   are answered by API Gateway for the allowed origins.
 * - The Lambda reaches Postgres through the RDS Data API as drilld_api, so
 *   row-level security applies to every query. It can read only that secret.
 */
export const defineApi = (stack: Stack, options: ApiOptions) => {
    const logGroup = new logs.LogGroup(stack, 'ApiFunctionLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY
    });

    const fn = new NodejsFunction(stack, 'ApiFunction', {
        entry: fileURLToPath(new URL('./handler.ts', import.meta.url)),
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        // Covers a paused database resuming (~15s) on the first request.
        timeout: Duration.seconds(29),
        logGroup,
        environment: {
            CLUSTER_ARN: options.cluster.clusterArn,
            DB_SECRET_ARN: options.apiSecret.secretArn,
            DATABASE_NAME: options.databaseName
        },
        bundling: {
            // The AWS SDK is part of the Lambda runtime.
            externalModules: ['@aws-sdk/*']
        }
    });

    // Data API access with the drilld_api secret only (grantDataApiAccess
    // would also grant the cluster's admin secret, which bypasses row-level security).
    fn.addToRolePolicy(new iam.PolicyStatement({
        actions: [
            'rds-data:ExecuteStatement',
            'rds-data:BatchExecuteStatement',
            'rds-data:BeginTransaction',
            'rds-data:CommitTransaction',
            'rds-data:RollbackTransaction'
        ],
        resources: [options.cluster.clusterArn]
    }));
    options.apiSecret.grantRead(fn);

    const httpApi = new HttpApi(stack, 'HttpApi', {
        apiName: `drilld-api-${stack.stackName}`.slice(0, 128),
        corsPreflight: {
            allowOrigins: ALLOWED_ORIGINS,
            allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.PUT, CorsHttpMethod.PATCH, CorsHttpMethod.DELETE],
            allowHeaders: ['Authorization', 'Content-Type'],
            maxAge: Duration.hours(1)
        }
    });

    httpApi.addRoutes({
        path: '/{proxy+}',
        methods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE],
        integration: new HttpLambdaIntegration('ApiIntegration', fn),
        authorizer: new HttpUserPoolAuthorizer('CognitoAuthorizer', options.userPool, {
            userPoolClients: [options.userPoolClient]
        })
    });

    return { url: httpApi.apiEndpoint };
};
