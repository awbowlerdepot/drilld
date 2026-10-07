import { VACU_BIT_RANGE } from '../../../../shared/api/drillSheetSpec'
import type { Finger, FingerHole, Insert, Vacu } from './editorTypes'
import type { DrillSheetSpec } from '../../../../shared/api/drillSheetSpec'

/** The standard vacu for an insert: O.D. + 1/16" at 1" deep. */
export const standardVacu = (od64: number): Vacu => ({ bit64: od64 + VACU_BIT_RANGE.above, depth32: 32 })

/** The vacu bits allowed for an insert's O.D.: one bit under it up to 1/16" over. */
export const vacuBits = (od64: number): number[] =>
    Array.from({ length: VACU_BIT_RANGE.below + VACU_BIT_RANGE.above + 1 }, (_, i) => od64 - VACU_BIT_RANGE.below + i)

/** Vacu depths: 1/2" to 1-1/2" in 1/16" steps (32nds). */
export const VACU_DEPTHS: number[] = Array.from({ length: 17 }, (_, i) => 16 + i * 2)

/**
 * Sets (or removes) a finger hole's insert. The insert sets the hole's O.D.
 * and size; a vacu that no longer fits the new O.D. goes back to standard.
 */
export const applyInsert = (draft: DrillSheetSpec, finger: Finger, insert: Insert | null) => {
    const hole: FingerHole = draft.holes[finger]
    hole.insert = insert
    if (!insert) {
        hole.vacu = null
        return
    }
    hole.outsideDiameter64 = insert.od64
    if (insert.size64) hole.size64 = insert.size64
    if (hole.vacu && !vacuBits(insert.od64).includes(hole.vacu.bit64)) hole.vacu = standardVacu(insert.od64)
}

/** "Turbo Quad · Perfect Oval Mesh" */
export const describeInsert = (insert: Insert) => {
    const maker = { VISE: 'VISE', TURBO: 'Turbo', JOPO: 'JoPo' }[insert.manufacturer] ?? insert.manufacturer
    return [`${maker} ${insert.line}`.trim(), insert.installStyle].filter(Boolean).join(' · ')
}
