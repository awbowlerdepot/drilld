import type { LayoutSystem } from '../../shared/api/ballLayouts'
import {
    BALL_RADIUS, angleArcPoints, arc, arcPoints, circleArcPoints, fromReference, gripPoint, move, toward, valFoot, UP,
    type SolvedLayout, type Vec
} from '../../shared/layout/ballLayout'
import { layoutDegrees, layoutInches } from './BallLayoutFormat'

/** How far either side of the crossing the compass arcs are drawn, degrees. */
const ARC_HALF_ANGLE = 14

export interface DrawnLine {
    points: Vec[]
    width: number
    dashed?: boolean
}

export interface DrawnLabel {
    at: Vec
    text: string
}

export interface LayoutDrawing {
    lines: DrawnLine[]
    labels: DrawnLabel[]
}

/**
 * One layout system drawn the way it's marked: the arcs are swung from the
 * ball's marks (the pin and the PSA/MB, or the PSA mark 6¾″ through the CG),
 * and where they cross is the bowler's point. Points are in the right-hand
 * layout frame (mirror them for a left-hander).
 * - VLS: an arc from the pin at pin to PAP and an arc from the PSA at PSA to
 *   PAP cross at the PAP; the pin buffer is an arc around the pin, centered
 *   where the VAL through the PAP touches it.
 * - 2LS (Storm's steps): arc 1 from the pin (pin to PAP) and arc 2 from the
 *   PSA (PSA to PAP) cross at the PAP; arc 3 from the pin (pin to COG) and
 *   arc 4, the Lightning Arc from the PAP, cross at the COG. The Lightning
 *   Arc's length is calculated: the third side of the triangle made by the
 *   PAP's two measurements (over along the midline, then up), drawn too. The
 *   vertical PAP arc (the PAP's height) sets the midline tangent to it.
 * - Dual Angle: the base line from the pin through the PSA, the drilling angle
 *   at the pin to the pin-to-PAP line, and the angle to the VAL at the PAP.
 */
export const layoutDrawing = (system: LayoutSystem, solved: SolvedLayout): LayoutDrawing => {
    const { pin, psa, pap } = solved
    const lines: DrawnLine[] = []
    const labels: DrawnLabel[] = []
    const last = (points: Vec[]) => points[points.length - 1]
    const middle = (points: Vec[]) => points[Math.floor(points.length / 2)]

    const papArcs = (first: string, second: string) => {
        const fromPin = circleArcPoints(pin, solved.pinToPap, pap, ARC_HALF_ANGLE)
        const fromPsa = circleArcPoints(psa, solved.psaToPap, pap, ARC_HALF_ANGLE)
        lines.push({ points: fromPin, width: 2.5 }, { points: fromPsa, width: 2.5 })
        labels.push({ at: last(fromPin), text: `${first}Pin–PAP ${layoutInches(solved.pinToPap)}` },
            { at: fromPsa[0], text: `${second}PSA–PAP ${layoutInches(solved.psaToPap)}` })
    }

    if (system === 'PIN_BUFFER') {
        papArcs('', '')
        const foot = valFoot(pap, pin)
        // An arc around the pin at the buffer, as long as the other arcs, centered where the VAL touches it.
        const halfAngle = Math.min(90, ARC_HALF_ANGLE * Math.sin(solved.pinToPap / BALL_RADIUS) / Math.sin(Math.max(solved.pinBuffer, 1 / 32) / BALL_RADIUS))
        lines.push({ points: circleArcPoints(pin, solved.pinBuffer, foot, halfAngle), width: 2.5 }, { points: arcPoints(pin, foot), width: 1.5, dashed: true })
        labels.push({ at: arcPoints(pin, foot, 2)[1], text: `Buffer ${layoutInches(solved.pinBuffer)}` })
    } else if (system === 'TWO_LS') {
        papArcs('1 ', '2 ')
        const cog = gripPoint(0, 0)
        const papToCog = arc(pap, cog)
        const { over, up } = fromReference(pap)
        const below = gripPoint(over, 0)
        const cogFromPin = circleArcPoints(pin, solved.pinToCog, cog, 14)
        const lightning = circleArcPoints(pap, papToCog, cog, 12)
        lines.push(
            { points: cogFromPin, width: 2.5 },
            { points: lightning, width: 2.5, dashed: true },
            // The triangle: over along the midline, up to the PAP, and the Lightning distance back to the COG.
            { points: arcPoints(cog, below), width: 1.5, dashed: true },
            { points: arcPoints(below, pap), width: 1.5, dashed: true },
            { points: arcPoints(cog, pap), width: 2, dashed: true }
        )
        if (Math.abs(up) > 1 / 64) lines.push({ points: circleArcPoints(pap, Math.abs(up), below, 40), width: 1.5 })
        labels.push(
            { at: cogFromPin[0], text: `3 Pin–COG ${layoutInches(solved.pinToCog)}` },
            { at: last(lightning), text: '4 Lightning Arc' },
            { at: middle(arcPoints(cog, pap, 2)), text: `Lightning ${layoutInches(papToCog)} (calc.)` },
            { at: cog, text: 'COG' }
        )
    } else {
        const valUp = move(pap, toward(pap, UP), 1)
        const drilling = angleArcPoints(pin, psa, pap, 0.9)
        const valAngle = angleArcPoints(pap, pin, valUp, 0.9)
        lines.push({ points: arcPoints(pin, pap), width: 2.5 }, { points: arcPoints(pin, psa), width: 2.5 }, { points: drilling, width: 2 }, { points: valAngle, width: 2 })
        labels.push(
            { at: middle(drilling), text: `Drilling ${layoutDegrees(solved.drillingAngle)}` },
            { at: middle(valAngle), text: `VAL ${layoutDegrees(solved.valAngle)}` },
            { at: middle(arcPoints(pin, pap, 2)), text: `Pin–PAP ${layoutInches(solved.pinToPap)}` }
        )
    }
    return { lines, labels }
}
