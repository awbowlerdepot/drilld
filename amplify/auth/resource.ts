import { defineAuth } from '@aws-amplify/backend';

/**
 * Cognito user pool for staff sign-in.
 *
 * Cognito only proves who someone is. Which company they belong to and what
 * they can do come from the database (app_user, location_membership), looked
 * up by the Cognito `sub` via resolve_app_user. No company or role data lives
 * in Cognito.
 *
 * Self sign-up is disabled in backend.ts: accounts are created by invitation.
 */
export const auth = defineAuth({
    loginWith: {
        email: {
            userInvitation: {
                emailSubject: 'Your Drilld account',
                emailBody: (username, code) =>
                    `You've been invited to Drilld. Sign in with ${username()} and the temporary password ${code()}. You'll be asked to choose a new password.`
            }
        }
    },
    multifactor: {
        mode: 'OPTIONAL',
        totp: true
    },
    accountRecovery: 'EMAIL_ONLY'
});
