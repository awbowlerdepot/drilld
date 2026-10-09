import { useEffect, useMemo, useState } from 'react'
import type { DrillSheetDto } from '../../shared/api/drillSheets'
import { placeGrip } from '../../shared/layout/gripPlacement'
import type { Customer } from '../types'
import { gripFromSheet } from '../utils/GripFromSheet'
import { drillSheetsApi } from './useCustomerDrillSheets'

export const NO_SHEET = 'NONE'

/**
 * The bowler's grip on the ball, from one of their drill sheets: the most
 * recently updated one with a revision to start with; any can be picked, or
 * none (a standard grip).
 */
export const useBallGrip = (owner: Customer | null, hand: 'RIGHT' | 'LEFT') => {
    const [sheets, setSheets] = useState<DrillSheetDto[]>([])
    const [sheetId, setSheetId] = useState<string>(NO_SHEET)

    useEffect(() => {
        let cancelled = false
        if (!owner) return
        drillSheetsApi.list(owner.id, {}).then(list => {
            if (cancelled) return
            const usable = list.filter(s => s.currentRevision).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            setSheets(usable)
            if (usable[0]) setSheetId(usable[0].id)
        }).catch(() => undefined)
        return () => { cancelled = true }
    }, [owner])

    const sheet = sheets.find(s => s.id === sheetId) ?? null
    const grip = useMemo(() => placeGrip(gripFromSheet(sheet?.currentRevision?.spec ?? null, hand, owner?.usesThumb ?? true)), [sheet, hand, owner])
    return { sheets, sheetId, setSheetId, sheet, grip }
}
