// Standard hole depths, by hole type and setup. A company sets them, a
// location can override them, and a drill sheet can override any one hole
// (e.g. deeper for long fingernails). Depths are 32nds of an inch.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import type { CompanyHoleDepths } from '../types/settings'

export type GripStyle = 'CONVENTIONAL' | 'FINGERTIP' | 'TWO_HANDED_NO_THUMB'

/** The starting standards: fingertip 2" with an insert, 1-1/2" without; conventional 2-1/2"; thumb 2-3/4", 2-5/8" with a slug. */
export const DEFAULT_HOLE_DEPTHS: CompanyHoleDepths = {
    fingertipInsert32: 64,
    fingertipNoInsert32: 48,
    conventional32: 80,
    thumb32: 88,
    thumbSlug32: 84
}

/** The standard depth for a finger hole: by grip, and for a fingertip, whether it has an insert. */
export const standardFingerDepth = (hole: DrillSheetSpec['holes']['middle'], grip: GripStyle, depths: CompanyHoleDepths) =>
    grip === 'CONVENTIONAL' ? depths.conventional32
        : hole.insert ? depths.fingertipInsert32 : depths.fingertipNoInsert32

/**
 * The standard depth for the thumb. Interchangeable hardware is piloted
 * instead (see DrillPlan), so it has no standard thumb depth.
 */
export const standardThumbDepth = (thumb: DrillSheetSpec['holes']['thumb'], depths: CompanyHoleDepths): number | null =>
    thumb.hardware?.kind === 'INTERCHANGEABLE_THUMB' ? null
        : thumb.hardware?.kind === 'THUMB_SLUG' ? depths.thumbSlug32
            : depths.thumb32
