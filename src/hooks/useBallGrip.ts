import { useEffect, useMemo, useState } from 'react'
import type { DrilledSheetDto } from '../../shared/api/ballLayouts'
import type { DrillSheetDto } from '../../shared/api/drillSheets'
import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import { placeGrip } from '../../shared/layout/gripPlacement'
import type { Customer } from '../types'
import { gripFromSheet } from '../utils/GripFromSheet'
import { drillSheetsApi } from './useCustomerDrillSheets'

/** The choice of holes: the revision a drilling was drilled to, one of the bowler's sheets (its current revision), or none. */
export const DRILLED = 'DRILLED'
export const NO_SHEET = 'NONE'

export interface GripChoice {
    key: string
    label: string
}

const GRIP_LABELS: Record<DrillSheetDto['gripStyle'], string> = { CONVENTIONAL: 'conventional', FINGERTIP: 'fingertip', TWO_HANDED_NO_THUMB: 'no thumb' }

/**
 * The holes on a ball, from a drill sheet: the revision the drilling was
 * drilled to when there is one; otherwise one of the bowler's sheets (the
 * most recently updated, or `initial`); or a standard grip.
 */
export const useBallGrip = (owner: Customer | null, hand: 'RIGHT' | 'LEFT', drilled: DrilledSheetDto | null = null, initial?: string | null) => {
    const [sheets, setSheets] = useState<DrillSheetDto[]>([])
    const [picked, setPicked] = useState<string | null>(drilled ? DRILLED : initial ?? null)
    const [drilledSpec, setDrilledSpec] = useState<DrillSheetSpec | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!owner) return
        drillSheetsApi.list(owner.id, {}).then(list => {
            if (!cancelled) setSheets(list.filter(s => s.currentRevision).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
        }).catch(() => undefined)
        return () => { cancelled = true }
    }, [owner])

    useEffect(() => {
        let cancelled = false
        if (!drilled) return
        drillSheetsApi.revision(drilled.sheetId, drilled.version)
            .then(revision => { if (!cancelled) setDrilledSpec(revision.spec) })
            .catch(() => undefined)
        return () => { cancelled = true }
    }, [drilled])

    const selection = picked ?? sheets[0]?.id ?? NO_SHEET
    const sheet = sheets.find(s => s.id === selection) ?? null
    const choices: GripChoice[] = [
        ...(drilled ? [{ key: DRILLED, label: `As drilled: ${drilled.name}, revision ${drilled.version}` }] : []),
        ...sheets.map(s => ({ key: s.id, label: `${s.name} (${GRIP_LABELS[s.gripStyle]}), revision ${s.currentRevision!.version}` })),
        { key: NO_SHEET, label: 'None (a standard grip)' }
    ]
    const source = selection === DRILLED
        ? (drilled && drilledSpec ? { gripStyle: drilled.gripStyle, spec: drilledSpec } : null)
        : sheet?.currentRevision ? { gripStyle: sheet.gripStyle, spec: sheet.currentRevision.spec } : null
    const grip = useMemo(() => placeGrip(gripFromSheet(source, hand, owner?.usesThumb ?? true)), [source?.spec, source?.gripStyle, hand, owner])  // eslint-disable-line react-hooks/exhaustive-deps

    /** The revision a drilling saved now would name: the drilled one, or the chosen sheet's current one. */
    const revisionId = selection === DRILLED ? drilled?.revisionId ?? null : sheet?.currentRevision?.id ?? null
    return { choices, selection, setSelection: setPicked, sheet, revisionId, grip }
}
