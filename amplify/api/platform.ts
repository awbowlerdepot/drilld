import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { sql } from 'kysely';
import { PLATFORM_ADMIN_GROUP } from '../auth/groups';
import type { TokenClaims } from './auth';
import type { Db, Tx } from './db/client';
import { HttpError } from './errors';

// Platform admins run Drilld itself, not a shop. Membership is the Cognito
// group PLATFORM_ADMIN_GROUP, never app or database data, and it only counts
// with TOTP MFA set up. It grants nothing in any company's data
// (docs/data-model.md).

/** NONE: not in the group. NEEDS_MFA: in the group, without TOTP. ACTIVE: a platform admin. */
export type PlatformAdminStatus = 'NONE' | 'NEEDS_MFA' | 'ACTIVE';

const cognito = new CognitoIdentityProviderClient({});

/**
 * When a user was last seen with TOTP, per Lambda container. Only a yes is
 * cached (for a few minutes), so finishing setup takes effect at once.
 */
const totpSeenAt = new Map<string, number>();
const TOTP_CACHE_MS = 5 * 60 * 1000;

const hasTotp = async (username: string): Promise<boolean> => {
    const seenAt = totpSeenAt.get(username);
    if (seenAt && Date.now() - seenAt < TOTP_CACHE_MS) return true;
    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) throw new Error('Missing environment variable USER_POOL_ID');
    const user = await cognito.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username }));
    const enabled = (user.UserMFASettingList ?? []).includes('SOFTWARE_TOKEN_MFA');
    if (enabled) totpSeenAt.set(username, Date.now());
    return enabled;
};

export const platformAdminStatus = async (claims: TokenClaims): Promise<PlatformAdminStatus> => {
    if (!claims.groups.includes(PLATFORM_ADMIN_GROUP)) return 'NONE';
    return (await hasTotp(claims.username ?? claims.sub)) ? 'ACTIVE' : 'NEEDS_MFA';
};

/** Throws 403 unless the signed-in user is an active platform admin. */
export const requirePlatformAdmin = async (claims: TokenClaims) => {
    const status = await platformAdminStatus(claims);
    if (status === 'NONE') throw new HttpError(403, 'Only platform admins can do this');
    if (status === 'NEEDS_MFA') throw new HttpError(403, 'Set up two-factor sign-in (an authenticator app) to use platform admin tools');
};

/**
 * Runs work in one transaction as a platform admin: app.platform_admin
 * unlocks platform tables such as lead, and app.company_id stays the admin's
 * own company (to read their name for notes). Call requirePlatformAdmin first.
 */
export const withPlatformAdmin = <T>(db: Db, companyId: string, work: (tx: Tx) => Promise<T>): Promise<T> =>
    db.transaction().execute(async tx => {
        await sql`select set_config('app.platform_admin', 'true', true)`.execute(tx);
        await sql`select set_config('app.company_id', ${companyId}, true)`.execute(tx);
        return work(tx);
    });
