import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    username: true,
  },
  userAttributes: {
    givenName: {
      required: true,
    },
    familyName: {
      required: true,
    },
    email: {
      required: true,
    },
    'custom:proshop_id': {
      dataType: 'String',
      required: false,
    },
    'custom:role': {
      dataType: 'String',
      required: false,
    },
  },
  groups: ['ProShopManagers', 'DrillTechs', 'Apprentices'],
  // Note: access rules are defined in the data resource itself
  // This prevents circular import issues
});