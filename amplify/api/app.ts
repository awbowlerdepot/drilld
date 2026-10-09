import { Hono } from 'hono';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import { resolveCurrentUser, type CurrentUser, type TokenClaims } from './auth';
import type { Db } from './db/client';
import { HttpError, toErrorResponse } from './errors';
import { attachments, customerAttachments } from './routes/attachments';
import { customers } from './routes/customers';
import { customerDrillSheets, drillSheets } from './routes/drillSheets';
import { employees } from './routes/employees';
import { equipment, locationEquipment, maintenanceTasks } from './routes/equipment';
import { gripCatalog, locationGripStock } from './routes/grips';
import { leads, publicLeads } from './routes/leads';
import { locations } from './routes/locations';
import { me } from './routes/me';
import { paperImports } from './routes/paperImports';

export type ApiEnv = {
    Bindings: { event: LambdaEvent; lambdaContext: LambdaContext };
    Variables: { db: Db; user: CurrentUser; claims: TokenClaims };
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
        username: typeof claims['cognito:username'] === 'string' ? claims['cognito:username'] : undefined,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        emailVerified: claims.email_verified === true || claims.email_verified === 'true',
        groups: readGroups(claims['cognito:groups'])
    };
};

/** API Gateway passes a list claim as a string, e.g. "[platform-admin other]"; tolerate an array too. */
const readGroups = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((group): group is string => typeof group === 'string');
    if (typeof value !== 'string') return [];
    return value.replace(/^\[|\]$/g, '').split(/[\s,]+/).filter(Boolean);
};

/**
 * The REST API. Every route runs as the signed-in user, scoped to their
 * company, except /public/* (the drilld.io signup form), which API Gateway
 * serves without an authorizer.
 */
export const createApp = (db: Db) => {
    const app = new Hono<ApiEnv>();

    app.onError((error, c) => {
        const { status, body } = toErrorResponse(error);
        return c.json(body, status as 400);
    });
    app.notFound(c => c.json({ error: 'Not found' }, 404));

    app.use('*', async (c, next) => {
        c.set('db', db);
        if (c.req.path.startsWith('/public/')) return next();
        const claims = readClaims(c.env.event);
        if (!claims) throw new HttpError(401, 'Not signed in');
        c.set('claims', claims);
        c.set('user', await resolveCurrentUser(db, claims));
        await next();
    });

    app.route('/public/leads', publicLeads);

    app.route('/me', me);
    app.route('/customers', customers);
    app.route('/customers/:customerId/drill-sheets', customerDrillSheets);
    app.route('/customers/:customerId/attachments', customerAttachments);
    app.route('/attachments', attachments);
    app.route('/paper-imports', paperImports);
    app.route('/drill-sheets', drillSheets);
    app.route('/employees', employees);
    app.route('/grip-catalog', gripCatalog);
    app.route('/locations/:locationId/grip-stock', locationGripStock);
    app.route('/locations/:locationId/equipment', locationEquipment);
    app.route('/locations', locations);
    app.route('/equipment', equipment);
    app.route('/maintenance-tasks', maintenanceTasks);
    app.route('/leads', leads);

    return app;
};
