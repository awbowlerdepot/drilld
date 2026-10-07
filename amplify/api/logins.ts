import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
    AdminGetUserCommand,
    CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

// Employee logins in Cognito. The database decides who someone is in Drilld;
// Cognito only holds the login, keyed by email (the user pool signs in with
// email, so the Admin* calls accept it as the username).

const cognito = new CognitoIdentityProviderClient({});

const userPoolId = () => {
    const id = process.env.USER_POOL_ID;
    if (!id) throw new Error('Missing environment variable USER_POOL_ID');
    return id;
};

const errorName = (error: unknown) => (error as { name?: string })?.name;

/**
 * Creates the login and emails the invitation with a temporary password.
 * The email is marked verified, which first sign-in needs to link the login to
 * the employee (link_app_user). Returns false when a login for that email
 * already exists: then no email is sent, and they sign in with their password.
 */
export const inviteLogin = async (email: string): Promise<boolean> => {
    try {
        await cognito.send(new AdminCreateUserCommand({
            UserPoolId: userPoolId(),
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' }
            ],
            DesiredDeliveryMediums: ['EMAIL']
        }));
        return true;
    } catch (error) {
        if (errorName(error) === 'UsernameExistsException') return false;
        throw error;
    }
};

/** Sends the invitation again with a new temporary password; creates the login if it's missing. */
export const resendInvite = async (email: string): Promise<void> => {
    try {
        await cognito.send(new AdminCreateUserCommand({
            UserPoolId: userPoolId(),
            Username: email,
            MessageAction: 'RESEND',
            DesiredDeliveryMediums: ['EMAIL']
        }));
    } catch (error) {
        if (errorName(error) !== 'UserNotFoundException') throw error;
        await inviteLogin(email);
    }
};

/** Blocks (or allows again) signing in. A missing login is fine: there's nothing to block. */
export const setLoginEnabled = async (email: string, enabled: boolean): Promise<void> => {
    const input = { UserPoolId: userPoolId(), Username: email };
    try {
        await cognito.send(enabled ? new AdminEnableUserCommand(input) : new AdminDisableUserCommand(input));
    } catch (error) {
        if (errorName(error) !== 'UserNotFoundException') throw error;
    }
};

/**
 * Removes a login that was never used (a cancelled invitation): only while it
 * still has its temporary password, so a login someone already uses is kept.
 */
export const deleteLogin = async (email: string): Promise<void> => {
    const input = { UserPoolId: userPoolId(), Username: email };
    try {
        const user = await cognito.send(new AdminGetUserCommand(input));
        if (user.UserStatus !== 'FORCE_CHANGE_PASSWORD') return;
        await cognito.send(new AdminDeleteUserCommand(input));
    } catch (error) {
        if (errorName(error) !== 'UserNotFoundException') throw error;
    }
};
