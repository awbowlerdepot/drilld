import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { drillSheetApi } from './functions/drill-sheet-api/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  drillSheetApi,
});

// Configure REST API
const apiGateway = backend.drillSheetApi.resources.restApi;

// Add CORS configuration
apiGateway.addGatewayResponse('DEFAULT_4XX', {
  type: 'DEFAULT_4XX',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
  },
});

apiGateway.addGatewayResponse('DEFAULT_5XX', {
  type: 'DEFAULT_5XX',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
  },
});

// Add custom outputs
backend.addOutput({
  custom: {
    drillSheetApiUrl: backend.drillSheetApi.resources.restApi.url,
    drillSheetApiId: backend.drillSheetApi.resources.restApi.restApiId,
  },
});