import { arcPoints, fromReference, gripPoint, project, valFoot, valPoints, type SolvedLayout, type Vec } from '../../../../shared/layout/ballLayout'
import { layoutDegrees, layoutInches } from '../../../utils/BallLayoutFormat'

interface LayoutDiagramProps {
    solved: SolvedLayout
    hand: 'RIGHT' | 'LEFT'
    /** What the PAP is measured from. */
    reference: 'GRIP_CENTER' | 'BRIDGE_CENTER'
    className?: string
}

const PX = 22 // per inch
const EXTENT = 7.25 // inches from the center shown
const range = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step)

/**
 * The layout as seen on the ball, fingers up: the grip's midline and
 * centerline, the PAP and its VAL, the pin and the PSA, the pin buffer.
 * Projected around the point between the grip and the PAP, so distances from
 * there are true; mirrored for a left-hander.
 */
export const LayoutDiagram = ({ solved, hand, reference, className }: LayoutDiagramProps) => {
    const papAt = fromReference(solved.pap)
    const center = gripPoint(papAt.over / 2, papAt.up / 2)
    const flip = hand === 'LEFT' ? -1 : 1
    const xy = (p: Vec) => {
        const q = project(center, p)
        return { x: flip * q.x * PX, y: -q.y * PX }
    }
    const path = (points: Vec[]) => points.map((p, i) => { const q = xy(p); return `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}` }).join(' ')
    const mid = (a: Vec, b: Vec) => { const pts = arcPoints(a, b, 2); return xy(pts[1]) }

    const ref = xy(gripPoint(0, 0)), pap = xy(solved.pap), pin = xy(solved.pin), psa = xy(solved.psa)
    const foot = valFoot(solved.pap, solved.pin)
    const size = EXTENT * PX
    const fingers = xy(gripPoint(0, 2.6)), thumb = xy(gripPoint(0, -2.6))
    const label = (at: { x: number; y: number }, text: string, dx = 6, dy = -6, anchor: 'start' | 'end' = 'start') =>
        <text x={at.x + flip * dx} y={at.y + dy} textAnchor={flip < 0 ? (anchor === 'start' ? 'end' : 'start') : anchor} className="fill-gray-700 font-mono text-[10px]">{text}</text>

    return (
        <svg viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} role="img" aria-label="Layout diagram" className={className}>
            <defs><clipPath id="ball-face"><circle r={size - 2} /></clipPath></defs>
            <circle r={size - 2} className="fill-white stroke-gray-200" strokeWidth={1.5} />
            <g clipPath="url(#ball-face)" fill="none" strokeLinecap="round">
                {/* Grip: midline across, centerline up and down. */}
                <path d={path(range(-9, 13, 0.25).map(o => gripPoint(o, 0)))} className="stroke-gray-300" strokeWidth={1} />
                <path d={path(range(-6.5, 6.5, 0.25).map(u => gripPoint(0, u)))} className="stroke-gray-300" strokeWidth={1} />
                {/* VAL through the PAP. */}
                <path d={path(valPoints(solved.pap, 7))} className="stroke-blue-400" strokeWidth={1.25} strokeDasharray="5 4" />
                <path d={path(arcPoints(solved.psa, solved.pap))} className="stroke-amber-400" strokeWidth={1} strokeDasharray="2 3" />
                <path d={path(arcPoints(solved.pin, foot))} className="stroke-blue-600" strokeWidth={1.5} strokeDasharray="2 2.5" />
                <path d={path(arcPoints(solved.pin, solved.pap))} className="stroke-gray-900" strokeWidth={1.5} />
                <path d={path(arcPoints(solved.pin, solved.psa))} className="stroke-amber-600" strokeWidth={1.5} />
            </g>

            <text x={fingers.x} y={fingers.y} textAnchor="middle" className="fill-gray-400 text-[10px]">fingers</text>
            <text x={thumb.x} y={thumb.y + 10} textAnchor="middle" className="fill-gray-400 text-[10px]">thumb</text>
            <path d={`M${ref.x - 5},${ref.y}h10M${ref.x},${ref.y - 5}v10`} className="stroke-gray-500" strokeWidth={1.25} />
            {label(ref, reference === 'BRIDGE_CENTER' ? 'bridge' : 'grip', 6, 14)}

            <circle cx={pap.x} cy={pap.y} r={6} className="fill-white stroke-blue-600" strokeWidth={1.5} />
            <circle cx={pap.x} cy={pap.y} r={1.75} className="fill-blue-600" />
            {label(pap, 'PAP', 9, 14)}

            <circle cx={pin.x} cy={pin.y} r={4.5} className="fill-gray-900" />
            {label(pin, 'Pin', -8, -6, 'end')}
            <rect x={psa.x - 4.5} y={psa.y - 4.5} width={9} height={9} transform={`rotate(45 ${psa.x} ${psa.y})`} className="fill-amber-500" />
            {label(psa, 'PSA', 8, 14)}

            {label(mid(solved.pin, solved.pap), layoutInches(solved.pinToPap), 6, 0)}
            {label(mid(solved.psa, solved.pap), layoutInches(solved.psaToPap), 6, 12)}
            {label(mid(solved.pin, foot), layoutInches(solved.pinBuffer), -4, -7)}
            {label(pin, layoutDegrees(solved.drillingAngle), -10, 16, 'end')}
            {label(pap, `${layoutDegrees(solved.valAngle)} to VAL`, 9, -10)}
        </svg>
    )
}
