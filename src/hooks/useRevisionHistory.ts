import { useCallback, useEffect, useState } from 'react'
import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import type { DrillSheetRevisionSummaryDto } from '../../shared/api/drillSheets'
import { diffSpecs, type SpecChange } from '../utils/DrillSheetChanges'
import { drillSheetsApi } from './useCustomerDrillSheets'

/**
 * A drill sheet's revisions (newest first) and, on request, what changed in
 * one of them: compared with the revision it started from, the latest
 * approved or drilled one before it (discarded drafts are skipped).
 */
export const useRevisionHistory = (sheetId: string) => {
    const [revisions, setRevisions] = useState<DrillSheetRevisionSummaryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [specs, setSpecs] = useState<Map<number, DrillSheetSpec>>(new Map())

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        drillSheetsApi.revisions(sheetId)
            .then(result => { if (!cancelled) setRevisions(result) })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [sheetId])

    /** The revision a given one was compared against, if any. */
    const baseOf = useCallback((version: number) =>
        revisions
            .filter(r => r.version < version && (r.approvedAt || r.drilled))
            .sort((a, b) => b.version - a.version)[0]
        ?? revisions.find(r => r.version === version - 1), [revisions])

    const loadSpec = useCallback(async (version: number) => {
        const cached = specs.get(version)
        if (cached) return cached
        const revision = await drillSheetsApi.revision(sheetId, version)
        setSpecs(prev => new Map(prev).set(version, revision.spec))
        return revision.spec
    }, [sheetId, specs])

    /** What changed in a revision, compared with its base; null for the first revision. */
    const changesIn = useCallback(async (version: number): Promise<{ base: number; changes: SpecChange[] } | null> => {
        const base = baseOf(version)
        if (!base) return null
        const [before, after] = await Promise.all([loadSpec(base.version), loadSpec(version)])
        return { base: base.version, changes: diffSpecs(before, after) }
    }, [baseOf, loadSpec])

    return { revisions, loading, error, changesIn }
}
