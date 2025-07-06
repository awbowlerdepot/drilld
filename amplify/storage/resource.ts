import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'drillSheetFiles',
  access: (allow) => ({
    'work-order-photos/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'drill-sheet-templates/*': [
      allow.authenticated.to(['read', 'write']),
    ],
    'customer-documents/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
