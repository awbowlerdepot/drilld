import { VACU_BIT_RANGE } from '../../../../shared/api/drillSheetSpec'
import type { Finger, FingerHole, Insert, ThumbHardware, Vacu } from './editorTypes'
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

/**
 * Sets (or removes) the thumb hardware. Its od64 is the hole's O.D. (a collar
 * bit for interchangeable systems); a thumb insert also sets the hole size,
 * while a slug or inner has the thumb hole drilled into it.
 */
export const applyThumbHardware = (draft: DrillSheetSpec, hardware: ThumbHardware | null) => {
    const thumb = draft.holes.thumb
    thumb.hardware = hardware
    if (!hardware) return
    thumb.outsideDiameter64 = hardware.od64
    if (hardware.kind === 'THUMB_INSERT' && hardware.size64) thumb.size64 = hardware.size64
}

/** "Turbo Switch Grip · interchangeable" */
export const describeThumbHardware = (hardware: ThumbHardware) => {
    const maker = { VISE: 'VISE', TURBO: 'Turbo', JOPO: 'JoPo' }[hardware.manufacturer] ?? hardware.manufacturer
    const kind = { THUMB_INSERT: 'thumb insert', THUMB_SLUG: 'slug', INTERCHANGEABLE_THUMB: 'interchangeable' }[hardware.kind]
    return [`${maker} ${hardware.line}`.trim(), hardware.kind === 'THUMB_INSERT' ? null : kind].filter(Boolean).join(' · ')
}

/** The minimum wall around a thumb hole drilled into a slug or inner: 1/8". */
export const MIN_WALL64 = 8

/**
 * The wall left around the thumb hole in a slug or interchangeable inner, in
 * 64ths: half the piece's size minus the hole's farthest edge (half the oval
 * width, or the hole radius). Null when it doesn't apply or isn't known yet.
 */
export const thumbWall64 = (hardware: ThumbHardware | null | undefined, holeSize64: number | null | undefined, ovalWidth64?: number | null) => {
    if (!hardware || hardware.kind === 'THUMB_INSERT' || !hardware.size64) return null
    // Interchangeable outer sleeves (Switch Grip, Twist) don't say the inner's size.
    if (hardware.kind === 'INTERCHANGEABLE_THUMB' && hardware.collar && hardware.od64 === hardware.size64) return null
    const hole = ovalWidth64 ?? holeSize64
    if (!hole) return null
    return (hardware.size64 - hole) / 2
}
