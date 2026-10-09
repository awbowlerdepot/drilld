import { useCallback, useEffect, useState } from 'react'
import type { BallDto, BallRegister } from '../../shared/api/balls'
import { mockBallsApi } from '../data/mockBalls'
import { ballsService, type BallsApi } from '../services/ballsService'
import { apiEnabled } from '../services/config'

/** The balls API when signed in; otherwise (local development without auth) in memory. */
export const ballsApi: BallsApi = apiEnabled ? ballsService : mockBallsApi

/**
 * The company's balls, or one bowler's (the ones they own now). `replace`
 * puts back a ball changed elsewhere (its detail dialog).
 */
export const useCompanyBalls = (filter: { customerId?: string } = {}) => {
    const { customerId } = filter
    const [balls, setBalls] = useState<BallDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        ballsApi.list({ customerId })
            .then(list => { if (!cancelled) { setBalls(list); setError(null) } })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [customerId, reloadKey])

    const register = useCallback(async (input: BallRegister) => {
        const created = await ballsApi.register(input)
        setBalls(prev => [created, ...prev])
        return created
    }, [])

    const replace = useCallback((ball: BallDto) => setBalls(prev => {
        // A ball transferred away from this bowler leaves their list.
        if (customerId && ball.owner?.customerId !== customerId) return prev.filter(b => b.id !== ball.id)
        return prev.map(b => (b.id === ball.id ? ball : b))
    }), [customerId])

    const reload = useCallback(() => setReloadKey(key => key + 1), [])

    return { balls, loading, error, register, replace, reload }
}
