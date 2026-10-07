import { useCallback, useEffect, useState } from 'react'
import type { MeDto } from '../../shared/api/me'
import { apiEnabled } from '../services/config'
import { meService } from '../services/meService'

/**
 * The signed-in user as the API sees them (GET /me), including whether
 * they're a platform admin. Null without the API (mock data has no platform
 * admins). `refresh` re-reads it, e.g. after setting up two-factor sign-in.
 */
export const useMe = () => {
    const [me, setMe] = useState<MeDto | null>(null)
    const [loading, setLoading] = useState(apiEnabled)

    const refresh = useCallback(async () => {
        if (!apiEnabled) return
        try {
            setMe(await meService.get())
        } catch (err) {
            console.error('Could not load /me', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void refresh() }, [refresh])

    return { me, loading, refresh }
}
