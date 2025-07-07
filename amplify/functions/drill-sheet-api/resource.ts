
import { defineFunction } from '@aws-amplify/backend';

export const drillSheetApi = defineFunction({
  name: 'drill-sheet-api',
  entry: './handler.ts',
  environment: {
    // Use environment variables instead of hardcoded values
    // These should be set in your deployment pipeline or AWS console
    DB_HOST: process.env.RDS_ENDPOINT || 'localhost',
    DB_NAME: process.env.DB_NAME || 'drillsheet_db',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  },
  runtime: 18,
  timeoutSeconds: 30,
});

    // DB_NAME: 'drillsheet_db',
    // DB_USER: 'drillsheet_admin',
    // DB_PASSWORD: 'B!fTg@7i3g9Q',