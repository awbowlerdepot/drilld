import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { defineApi } from './api/resource';
import { defineDatabase } from './database/resource';

const backend = defineBackend({
    auth
});

// Staff accounts are created by invitation (Cognito AdminCreateUser), never by
// self sign-up: a company's owner or admin adds employees, and the platform
// creates companies.
// Override only this property: replacing the whole adminCreateUserConfig would
// drop the invitation email template defined in auth/resource.ts.
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.addPropertyOverride('AdminCreateUserConfig.AllowAdminCreateUserOnly', true);

// Postgres for this environment. Branch deployments (production) are
// protected; each sandbox gets its own disposable database.
const isSandbox = backend.stack.node.tryGetContext('amplify-backend-type') === 'sandbox';
const database = defineDatabase(backend.createStack('database'), { protect: !isSandbox });

// REST API (API Gateway + one Lambda), authorized by Cognito, reaching Postgres as drilld_api.
const api = defineApi(backend.createStack('api'), {
    userPool: backend.auth.resources.userPool,
    userPoolClient: backend.auth.resources.userPoolClient,
    cluster: database.cluster,
    apiSecret: database.apiSecret,
    databaseName: database.databaseName
});

// The frontend reads the API URL from amplify_outputs.json (custom.api.url).
backend.addOutput({ custom: { api: { url: api.url } } });
