import { useCallback, useEffect, useState } from 'react'
import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import type { DrillSheetDto } from '../../shared/api/drillSheets'
import { drillSheetsApi } from './useCustomerDrillSheets'

/**
 * Edits one drill sheet. Changes are kept locally (`spec`, `dirty`) until
 * `save`, which updates the draft in place, or starts a new draft revision
 * when the current one is approved or drilled. Saving sends the whole spec.
 */
// Mock locations (not from the API yet) have non-uuid ids; only real ones are recorded.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const useDrillSheetEditor = (sheetId: string, currentLocationID?: string) => {
    const locationID = currentLocationID && UUID.test(currentLocationID) ? currentLocationID : undefined
    const [sheet, setSheet] = useState<DrillSheetDto | null>(null)
    const [spec, setSpec] = useState<DrillSheetSpec | null>(null)
    const [dirty, setDirty] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const apply = useCallback((loaded: DrillSheetDto) => {
        setSheet(loaded)
        setSpec(loaded.currentRevision?.spec ?? null)
        setDirty(false)
    }, [])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        drillSheetsApi.get(sheetId)
            .then(loaded => { if (!cancelled) { apply(loaded); setError(null) } })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [sheetId, apply])

    /** Applies a change to the working copy of the spec. */
    const updateSpec = useCallback((change: (current: DrillSheetSpec) => DrillSheetSpec) => {
        setSpec(current => (current ? change(current) : current))
        setDirty(true)
    }, [])

    /** Edits a copy of the working spec in place: edit(spec => { spec.bridge.distance32 = 8 }). */
    const edit = useCallback((mutate: (draft: DrillSheetSpec) => void) => {
        updateSpec(current => {
            const next = structuredClone(current)
            mutate(next)
            return next
        })
    }, [updateSpec])

    const run = useCallback(async <T,>(work: () => Promise<T>): Promise<T | undefined> => {
        setSaving(true)
        try {
            const result = await work()
            setError(null)
            return result
        } catch (err) {
            setError((err as Error).message)
            return undefined
        } finally {
            setSaving(false)
        }
    }, [])

    const save = useCallback(() => run(async () => {
        if (!sheet || !spec) return
        apply(await drillSheetsApi.saveDraft(sheet.id, {
            spec,
            basedOnRevisionID: sheet.currentRevision?.id ?? null,
            locationID: locationID || null
        }))
    }), [run, apply, sheet, spec, locationID])

    /** Approves the current revision, saving pending changes first. */
    const approve = useCallback(() => run(async () => {
        if (!sheet || !spec) return
        let current = sheet
        if (dirty) {
            current = await drillSheetsApi.saveDraft(sheet.id, {
                spec,
                basedOnRevisionID: sheet.currentRevision?.id ?? null,
                locationID: locationID || null
            })
        }
        if (current.currentRevision) await drillSheetsApi.approve(current.id, current.currentRevision.version)
        apply(await drillSheetsApi.get(current.id))
    }), [run, apply, sheet, spec, dirty, locationID])

    const rename = useCallback((name: string) => run(async () => {
        if (!sheet) return
        const updated = await drillSheetsApi.update(sheet.id, { name })
        setSheet(prev => (prev ? { ...prev, name: updated.name } : prev))
    }), [run, sheet])

    /** Drops unsaved changes. */
    const discard = useCallback(() => {
        if (sheet) apply(sheet)
    }, [sheet, apply])

    return { sheet, spec, dirty, loading, saving, error, updateSpec, edit, save, approve, rename, discard }
}
