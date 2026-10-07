import { useCallback, useEffect, useState } from 'react'
import type { DrillSheetCreate, DrillSheetDto } from '../../shared/api/drillSheets'
import { mockDrillSheetsApi } from '../data/mockDrillSheets'
import { apiEnabled } from '../services/config'
import { drillSheetsService, type DrillSheetsApi } from '../services/drillSheetsService'

/** The drill sheets API when signed in; otherwise (local development without auth) in-memory mock data. */
export const drillSheetsApi: DrillSheetsApi = apiEnabled ? drillSheetsService : mockDrillSheetsApi

/**
 * A customer's drill sheets (newest first). Archived sheets are included only
 * when asked for. Create and archive return promises and reject if refused.
 */
export const useCustomerDrillSheets = (customerId: string, options: { includeArchived?: boolean } = {}) => {
    const { includeArchived = false } = options
    const [sheets, setSheets] = useState<DrillSheetDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        drillSheetsApi.list(customerId, { archived: includeArchived })
            .then(result => { if (!cancelled) { setSheets(result); setError(null) } })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [customerId, includeArchived, reloadKey])

    const reload = useCallback(() => setReloadKey(key => key + 1), [])

    const createSheet = useCallback(async (sheet: DrillSheetCreate) => {
        const created = await drillSheetsApi.create(customerId, sheet)
        setSheets(prev => [created, ...prev])
        return created
    }, [customerId])

    const setArchived = useCallback(async (id: string, archived: boolean) => {
        const updated = await drillSheetsApi.update(id, { archived })
        setSheets(prev => (archived && !includeArchived
            ? prev.filter(sheet => sheet.id !== id)
            : prev.map(sheet => (sheet.id === id ? updated : sheet))))
    }, [includeArchived])

    return { sheets, loading, error, reload, createSheet, setArchived }
}
