import { useEffect, useState } from 'react'
import type { GripLineDto } from '../../shared/api/grips'
import { mockGripsApi } from '../data/mockGrips'
import { apiEnabled } from '../services/config'
import { gripsService, type GripsApi } from '../services/gripsService'

/** The grips API when signed in; otherwise (local development without auth) mock data. */
export const gripsApi: GripsApi = apiEnabled ? gripsService : mockGripsApi

// The catalog is shared platform data that rarely changes: load it once per page load.
let cached: Promise<GripLineDto[]> | null = null

/** The shared catalog of finger inserts, slugs and thumb hardware, by manufacturer line. */
export const useGripCatalog = () => {
    const [lines, setLines] = useState<GripLineDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        cached ??= gripsApi.catalog()
        cached
            .then(result => { if (!cancelled) setLines(result) })
            .catch((err: Error) => {
                cached = null
                if (!cancelled) setError(err.message)
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    return { lines, loading, error }
}
