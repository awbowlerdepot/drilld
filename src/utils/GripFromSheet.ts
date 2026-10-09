import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import type { GripInput, HoleInput, RecordedSpan } from '../../shared/layout/gripPlacement'

const DEFAULT_THUMB = 1
const DEFAULT_FINGER = 0.75

type Span = DrillSheetSpec['spans']['thumbToMiddle']

const span = (s: Span | undefined): RecordedSpan => ({
    centerToCenter: s?.centerToCenter32 != null ? s.centerToCenter32 / 32 : undefined,
    cutToCut: s?.cutToCut32 != null ? s.cutToCut32 / 32 : undefined,
    outerToCut: s?.outerToCut32 != null ? s.outerToCut32 / 32 : undefined,
    full: s?.full32 != null ? s.full32 / 32 : undefined,
    fit: s?.fit32 != null ? s.fit32 / 32 : undefined
})

const hole = (h: DrillSheetSpec['holes']['middle'] | DrillSheetSpec['holes']['thumb'], fallback: number, od: number | null | undefined,
    oval: HoleInput['oval'] = null, pilot64?: number): HoleInput => ({
    size: pilot64 != null ? pilot64 / 64 : h.size64 != null ? h.size64 / 64 : fallback,
    oval,
    outside: (h.outsideDiameter64 ?? od) != null ? (h.outsideDiameter64 ?? od)! / 64 : null,
    depth: h.depth32 != null ? h.depth32 / 32 : null,
    forward: h.pitch?.forward32 != null ? h.pitch.forward32 / 32 : null,
    lateral: h.pitch?.lateral32 != null ? h.pitch.lateral32 / 32 : null
})

/** A finger oval: the width bit over the hole's size (the pilot). */
const fingerOval = (h: DrillSheetSpec['holes']['middle']): HoleInput['oval'] =>
    h.fingerOval && h.size64 ? { elongation: (h.fingerOval.width64 - h.size64) / 64 } : null

/** A drill sheet's grip for drawing on the ball (shared/layout/gripPlacement.ts); a standard grip without one. */
export const gripFromSheet = (spec: DrillSheetSpec | null, hand: 'RIGHT' | 'LEFT', usesThumb: boolean): GripInput => {
    if (!spec) {
        return {
            hand, thumb: usesThumb ? { size: DEFAULT_THUMB } : null,
            middle: { size: DEFAULT_FINGER }, ring: { size: DEFAULT_FINGER },
            thumbToMiddle: {}, thumbToRing: {}, bridge: null
        }
    }
    const { thumb, middle, ring } = spec.holes
    return {
        hand,
        thumb: thumb.enabled
            ? hole(thumb, DEFAULT_THUMB, thumb.hardware?.od64,
                thumb.oval ? { elongation: (thumb.oval.width64 - thumb.oval.pilotHole64) / 64, angle: thumb.oval.angleDegrees } : null, thumb.oval?.pilotHole64)
            : null,
        middle: hole(middle, DEFAULT_FINGER, middle.insert?.od64, fingerOval(middle)),
        ring: hole(ring, DEFAULT_FINGER, ring.insert?.od64, fingerOval(ring)),
        thumbToMiddle: span(spec.spans.thumbToMiddle),
        thumbToRing: span(spec.spans.thumbToRing),
        bridge: spec.bridge.distance32 != null ? spec.bridge.distance32 / 32 : null
    }
}
