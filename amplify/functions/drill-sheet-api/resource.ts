import { defineFunction } from '@aws-amplify/backend';

export const drillSheetApi = defineFunction({
  name: 'drill-sheet-api',
  entry: './handler.ts',
  environment: {
    DB_HOST: 'your-rds-endpoint.region.rds.amazonaws.com',
    DB_NAME: 'drillsheet_db',
    DB_USER: 'drillsheet_admin',
    DB_PASSWORD: 'B!fTg@7i3g9Q',
  },
  runtime: 18,
  timeoutSeconds: 30,
});
