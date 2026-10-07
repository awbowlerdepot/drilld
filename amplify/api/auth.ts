import { sql } from 'kysely';
import type { Db } from './db/client';
import { HttpError } from './errors';

/** Claims from the Cognito ID token, already verified by the API Gateway authorizer. */
export interface TokenClaims {
    sub: string;
    /** The Cognito username, for admin lookups (e.g. whether TOTP is set up). */
    username?: string;
    email?: string;
    emailVerified: boolean;
    /** Cognito groups. Only `platform-admin` is used: it never carries company or role data. */
    groups: string[];
}

export interface CurrentUser {
    userId: string;
    companyId: string;
}

interface ResolvedRow {
    user_id: string;
    company_id: string;
    active: boolean;
}

/**
 * Finds the signed-in user's app_user. On first sign-in, links the Cognito
 * login to the app_user created for that email (by invitation or the seed
 * script), but only with a verified email.
 */
export const resolveCurrentUser = async (db: Db, claims: TokenClaims): Promise<CurrentUser> => {
    let row = (await sql<ResolvedRow>`select * from resolve_app_user(${claims.sub})`.execute(db)).rows[0];

    if (!row && claims.email && claims.emailVerified) {
        row = (await sql<ResolvedRow>`select * from link_app_user(${claims.sub}, ${claims.email})`.execute(db)).rows[0];
        if (row) console.log(`Linked Cognito user ${claims.sub} to app_user ${row.user_id}`);
    }

    if (!row) throw new HttpError(403, 'No Drilld account for this sign-in');
    if (!row.active) throw new HttpError(403, 'This account is deactivated');

    return { userId: row.user_id, companyId: row.company_id };
};
