import { useCallback, useEffect, useState } from 'react'
import { gripsApi } from './useGripCatalog'

/**
 * What a location carries: the grip catalog sizes it stocks. `selected` is the
 * working copy; `save` replaces the location's stock with it.
 */
export const useLocationGripStock = (locationId: string) => {
    const [saved, setSaved] = useState<Set<string>>(new Set())
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        gripsApi.stock(locationId)
            .then(stock => {
                if (cancelled) return
                const ids = new Set(stock.gripSizeIds)
                setSaved(ids)
                setSelected(new Set(ids))
            })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [locationId])

    /** Adds (on = true) or removes these sizes from the working copy. */
    const toggle = useCallback((sizeIds: string[], on: boolean) => {
        setSelected(prev => {
            const next = new Set(prev)
            for (const id of sizeIds) {
                if (on) next.add(id)
                else next.delete(id)
            }
            return next
        })
    }, [])

    const dirty = saved.size !== selected.size || [...selected].some(id => !saved.has(id))

    const save = useCallback(async () => {
        setSaving(true)
        try {
            const stock = await gripsApi.setStock(locationId, { gripSizeIds: [...selected] })
            const ids = new Set(stock.gripSizeIds)
            setSaved(ids)
            setSelected(new Set(ids))
            setError(null)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }, [locationId, selected])

    const discard = useCallback(() => setSelected(new Set(saved)), [saved])

    return { selected, dirty, loading, saving, error, toggle, save, discard }
}
