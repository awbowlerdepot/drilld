import { fetchAuthSession } from 'aws-amplify/auth'
import type { ApiErrorBody } from '../../shared/api/errors'
import { apiUrl } from './config'

/** An API error with the status and the server's message. */
export class ApiError extends Error {
    constructor(readonly status: number, readonly body: ApiErrorBody) {
        super(body.error)
    }
}

/**
 * Calls the REST API as the signed-in user. Sends the Cognito ID token, which
 * carries the verified email the API uses to link a first sign-in.
 */
export const apiRequest = async <T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> => {
    if (!apiUrl) throw new Error('The API is not configured (no custom.api.url in amplify_outputs.json)')

    const token = (await fetchAuthSession()).tokens?.idToken?.toString()
    if (!token) throw new ApiError(401, { error: 'Not signed in' })

    const response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body !== undefined && { 'Content-Type': 'application/json' })
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    })

    if (response.status === 204) return undefined as T
    const json = await response.json().catch(() => ({ error: response.statusText }))
    if (!response.ok) throw new ApiError(response.status, json as ApiErrorBody)
    return json as T
}
