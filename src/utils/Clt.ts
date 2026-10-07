// CLT (center line transformation) chart: a CLT angle maps to the fingers'
// lateral pitch (docs/data-model.md, "CLT"). Hidden unless the company turns
// on drillSheets.enableClt. The chart only suggests; the lateral pitch stored
// on each finger hole is what gets drilled.

import type { Hand } from './DrillReadouts'

interface CltLine {
    line: 'A' | 'B' | 'C' | 'D' | 'E'
    degrees: number
    /** Lateral pitch magnitudes in 32nds: the middle finger goes away from the ring, the ring away from the middle. */
    middle32: number
    ring32: number
}

export const CLT_CHART: CltLine[] = [
    { line: 'A', degrees: 8, middle32: 12, ring32: 16 },
    { line: 'B', degrees: 16, middle32: 10, ring32: 18 },
    { line: 'C', degrees: 24, middle32: 8, ring32: 20 },
    { line: 'D', degrees: 32, middle32: 6, ring32: 22 },
    { line: 'E', degrees: 40, middle32: 4, ring32: 24 }
]

/**
 * The chart line nearest a CLT angle, and the lateral pitches it suggests
 * (negative = left). For a right-hander the middle finger goes left and the
 * ring right; a left-hander is mirrored.
 */
export const autoClt = (degrees: number, hand: Hand) => {
    const nearest = CLT_CHART.reduce((best, line) =>
        Math.abs(line.degrees - degrees) < Math.abs(best.degrees - degrees) ? line : best)
    const middleSign = hand === 'RIGHT' ? -1 : 1
    return {
        line: nearest,
        middleLateral32: middleSign * nearest.middle32,
        ringLateral32: -middleSign * nearest.ring32
    }
}
