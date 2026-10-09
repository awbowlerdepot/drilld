import { ZodError } from 'zod';
import type { ApiErrorBody } from '../../shared/api/errors';

/** An error with an HTTP status and a message safe to show the client. */
export class HttpError extends Error {
    constructor(readonly status: 400 | 401 | 403 | 404 | 409, message: string) {
        super(message);
    }
}

/**
 * Turns any error into a status and client-safe body. Database errors from the
 * Data API carry the Postgres SQLSTATE in their message ("SQLState: 23505").
 */
export const toErrorResponse = (error: unknown): { status: number; body: ApiErrorBody } => {
    if (error instanceof HttpError) {
        return { status: error.status, body: { error: error.message } };
    }
    if (error instanceof ZodError) {
        return {
            status: 400,
            body: {
                error: 'Invalid request',
                issues: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }))
            }
        };
    }

    // A request body that isn't JSON (c.req.json() throws a SyntaxError).
    if (error instanceof SyntaxError) {
        return { status: 400, body: { error: 'The request body isn\'t valid JSON' } };
    }

    const sqlState = /SQLState: (\w{5})/.exec(error instanceof Error ? error.message : '')?.[1];
    switch (sqlState) {
        case '23505': return { status: 409, body: { error: 'That already exists' } };
        case '23503': return { status: 409, body: { error: 'Refers to, or is still used by, other records' } };
        case '23514': return { status: 400, body: { error: 'A value is out of range or not allowed' } };
        case '23001': return { status: 409, body: { error: 'This record is locked and cannot change' } };
        case '42501': return { status: 403, body: { error: 'Not allowed' } };
    }

    console.error('Unhandled error', error);
    return { status: 500, body: { error: 'Something went wrong' } };
};
