import { Line } from '@react-three/drei'
import type { Vec } from '../../../../shared/layout/ballLayout'

interface SurfaceLineProps {
    points: Vec[]
    color: string
    width?: number
    dashed?: boolean
}

/** A line drawn on the ball's surface (just above it, so it isn't hidden by the cover). */
export const SurfaceLine = ({ points, color, width = 2.5, dashed }: SurfaceLineProps) => (
    <Line points={points.map(p => [p[0] * 1.003, p[1] * 1.003, p[2] * 1.003] as [number, number, number])}
        color={color} lineWidth={width} dashed={dashed} dashSize={0.03} gapSize={0.02} />
)
