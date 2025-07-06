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

// Add custom resources
backend.addOutput({
  custom: {
    drillSheetApiUrl: backend.drillSheetApi.resources.restApi.url,
  },
});
