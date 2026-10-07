import { Hono } from 'hono';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import { resolveCurrentUser, type CurrentUser, type TokenClaims } from './auth';
import type { Db } from './db/client';
import { HttpError, toErrorResponse } from './errors';
import { customers } from './routes/customers';
import { customerDrillSheets, drillSheets } from './routes/drillSheets';
import { gripCatalog, locationGripStock } from './routes/grips';
import { locations } from './routes/locations';
import { me } from './routes/me';

export type ApiEnv = {
    Bindings: { event: LambdaEvent; lambdaContext: LambdaContext };
    Variables: { db: Db; user: CurrentUser };
};

/**
 * Claims verified by the API Gateway JWT authorizer (Cognito ID token).
 * Requests never reach the Lambda without a valid token, but a missing
 * authorizer context is still treated as unauthenticated.
 */
const readClaims = (event: LambdaEvent): TokenClaims | null => {
    const context = (event as { requestContext?: { authorizer?: { jwt?: { claims?: Record<string, unknown> } } } }).requestContext;
    const claims = context?.authorizer?.jwt?.claims;
    if (!claims || typeof claims.sub !== 'string') return null;
    return {
        sub: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        emailVerified: claims.email_verified === true || claims.email_verified === 'true'
    };
};

/** The REST API. Every route runs as the signed-in user, scoped to their company. */
export const createApp = (db: Db) => {
    const app = new Hono<ApiEnv>();

    app.onError((error, c) => {
        const { status, body } = toErrorResponse(error);
        return c.json(body, status as 400);
    });
    app.notFound(c => c.json({ error: 'Not found' }, 404));

    app.use('*', async (c, next) => {
        const claims = readClaims(c.env.event);
        if (!claims) throw new HttpError(401, 'Not signed in');
        c.set('db', db);
        c.set('user', await resolveCurrentUser(db, claims));
        await next();
    });

    app.route('/me', me);
    app.route('/customers', customers);
    app.route('/customers/:customerId/drill-sheets', customerDrillSheets);
    app.route('/drill-sheets', drillSheets);
    app.route('/grip-catalog', gripCatalog);
    app.route('/locations/:locationId/grip-stock', locationGripStock);
    app.route('/locations', locations);

    return app;
};
