import { useMemo, useState } from 'react'
import { drillSheetSpecSchema, type DrillSheetSpec, type DrillSheetSpecInput } from '../../shared/api/drillSheetSpec'
import { applyInsert, applyThumbHardware } from '../components/drillsheets/editor/insertEdits'
import { fingerInsertCandidates, thumbHardwareCandidates, type GripCandidates, type HardwareChoice, type InsertChoice } from '../utils/PaperGripMatch'
import type { ImportProposal } from '../utils/PaperSheetImport'
import { useGripCatalog } from './useGripCatalog'
import { useLocationGripStock } from './useLocationGripStock'

type Slot = 'middle' | 'ring' | 'thumb'

export interface GripSlot<T> {
    /** What the sheet says, for showing: "7.5 · Lift". */
    clue: string
    candidates: GripCandidates<T>
    selectedId: string | null
}

/**
 * The inserts and thumb hardware a paper sheet could mean, narrowed to what
 * the location carries, and which the reviewer picked. When exactly one fits,
 * it's picked. `apply` puts the picks into a spec (setting each hole's O.D.).
 */
export const usePaperImportGrips = (proposal: ImportProposal | null, locationID: string | null) => {
    const { lines } = useGripCatalog()
    const { selected: stock } = useLocationGripStock(locationID ?? undefined)
    // The reviewer's picks; undefined = not chosen yet (use the single fit, if any).
    const [picked, setPicked] = useState<Partial<Record<Slot, string | null>>>({})

    const slots = useMemo(() => {
        const result: { middle?: GripSlot<InsertChoice>; ring?: GripSlot<InsertChoice>; thumb?: GripSlot<HardwareChoice> } = {}
        if (!proposal || lines.length === 0) return result
        for (const finger of ['middle', 'ring'] as const) {
            const clue = proposal.grips[finger]
            if (!clue) continue
            const candidates = fingerInsertCandidates(clue, lines, stock)
            result[finger] = {
                clue: [clue.brand, clue.od64 ? `O.D. ${clue.od64}/64` : null, clue.sizeLabel, clue.style].filter(Boolean).join(' · '),
                candidates,
                selectedId: picked[finger] !== undefined ? picked[finger]! : candidates.options.length === 1 ? candidates.options[0].gripSizeId ?? null : null
            }
        }
        const thumbClue = proposal.grips.thumb
        if (thumbClue) {
            const candidates = thumbHardwareCandidates(thumbClue, lines, stock)
            result.thumb = {
                clue: [thumbClue.brand, thumbClue.style, thumbClue.size].filter(Boolean).join(' · '),
                candidates,
                selectedId: picked.thumb !== undefined ? picked.thumb! : candidates.options.length === 1 ? candidates.options[0].gripSizeId ?? null : null
            }
        }
        return result
    }, [proposal, lines, stock, picked])

    const select = (slot: Slot, gripSizeId: string | null) => setPicked(prev => ({ ...prev, [slot]: gripSizeId }))

    /** The spec with the picked inserts and hardware (validated, defaults applied). */
    const apply = (spec: DrillSheetSpecInput): DrillSheetSpec => {
        const draft = drillSheetSpecSchema.parse(spec)
        for (const finger of ['middle', 'ring'] as const) {
            const slot = slots[finger]
            const insert = slot?.candidates.options.find(o => o.gripSizeId === slot.selectedId)
            if (insert) applyInsert(draft, finger, insert)
        }
        const hardware = slots.thumb?.candidates.options.find(o => o.gripSizeId === slots.thumb?.selectedId)
        if (hardware) applyThumbHardware(draft, hardware)
        return draft
    }

    return { slots, select, apply }
}
