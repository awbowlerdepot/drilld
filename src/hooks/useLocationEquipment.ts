import { useCallback, useEffect, useState } from 'react'
import type { EquipmentCreate, EquipmentDto } from '../../shared/api/equipment'
import { mockEquipmentApi } from '../data/mockEquipment'
import { apiEnabled } from '../services/config'
import { equipmentService, type EquipmentApi } from '../services/equipmentService'

/** The equipment API when signed in; otherwise (local development without auth) in memory. */
export const equipmentApi: EquipmentApi = apiEnabled ? equipmentService : mockEquipmentApi

/** How many maintenance tasks are overdue or due today on these machines (retired ones don't count). */
export const dueCount = (equipment: EquipmentDto[]) => equipment
    .filter(e => e.status !== 'RETIRED')
    .reduce((count, e) => count + e.tasks.filter(t => t.due === 'OVERDUE' || t.due === 'DUE').length, 0)

/**
 * A location's machines with their maintenance tasks (each with whether it's
 * due). `reload` re-reads them, e.g. after a task is done elsewhere.
 */
export const useLocationEquipment = (locationId: string | undefined) => {
    const [equipment, setEquipment] = useState<EquipmentDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        if (!locationId) {
            setEquipment([])
            setLoading(false)
            return
        }
        equipmentApi.list(locationId)
            .then(list => { if (!cancelled) { setEquipment(list); setError(null) } })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [locationId, reloadKey])

    const reload = useCallback(() => setReloadKey(key => key + 1), [])

    const add = useCallback(async (input: EquipmentCreate) => {
        if (!locationId) throw new Error('No location')
        const created = await equipmentApi.create(locationId, input)
        setEquipment(prev => [...prev, created])
        return created
    }, [locationId])

    /** Replaces one machine with its latest (after a change made on its own page). */
    const replace = useCallback((machine: EquipmentDto) =>
        setEquipment(prev => prev.map(e => (e.id === machine.id ? machine : e))), [])

    return { equipment, loading, error, reload, add, replace, due: dueCount(equipment) }
}
