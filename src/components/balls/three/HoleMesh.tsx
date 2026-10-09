import { useMemo } from 'react'
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Matrix4, Path, Shape, ShapeGeometry, Vector2, Vector3 } from 'three'
import { BALL_RADIUS, UP, cross, dot, scale, toward, unit } from '../../../../shared/layout/ballLayout'
import type { PlacedHole } from '../../../../shared/layout/gripPlacement'

interface HoleMeshProps {
    hole: PlacedHole
    /** The insert's or hardware's color, when the hole holds one. */
    insertColor?: string
}

const R = BALL_RADIUS
const SEGMENTS = 24

/** The hole's outline across it: a circle, or the slot an oval's bit leaves (2D, ball radii). */
const outline = (radius: number, oval: { x: number; y: number; from: number; to: number } | null): Vector2[] => {
    if (!oval) return Array.from({ length: SEGMENTS * 2 }, (_, i) => new Vector2(radius * Math.cos((i / SEGMENTS) * Math.PI), radius * Math.sin((i / SEGMENTS) * Math.PI)))
    const along = Math.atan2(oval.y, oval.x)
    const end = (t: number, start: number) => Array.from({ length: SEGMENTS + 1 }, (_, i) => {
        const a = start + (i / SEGMENTS) * Math.PI
        return new Vector2(oval.x * t + radius * Math.cos(a), oval.y * t + radius * Math.sin(a))
    })
    // Around the far end, then back around the near end.
    return [...end(oval.to, along - Math.PI / 2), ...end(oval.from, along + Math.PI / 2)]
}

/** The hole's wall: its outline swept from the surface down the hole. */
const wallGeometry = (points: Vector2[], top: number, depth: number) => {
    const positions: number[] = []
    for (let i = 0; i < points.length; i++) {
        const p = points[i], q = points[(i + 1) % points.length]
        positions.push(p.x, p.y, top, q.x, q.y, top, q.x, q.y, -depth, p.x, p.y, top, q.x, q.y, -depth, p.x, p.y, -depth)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
}

/**
 * A drilled hole along its pitched axis: its wall and bottom, round or the
 * oval's slot, and the insert's or hardware's face around the grip hole.
 */
export const HoleMesh = ({ hole, insertColor = '#cbd5e1' }: HoleMeshProps) => {
    const { matrix, wall, bottom, face } = useMemo(() => {
        // The hole's own frame: z out of the hole (against its axis), y toward the fingers, x across.
        const out = scale(hole.axis, -1)
        const y = unit(toward(out, UP))
        const x = unit(cross(y, out))
        const radius = hole.radius / R, outside = hole.outsideRadius / R, depth = hole.depth / R
        const oval = hole.oval ? { x: dot(hole.oval.direction, x), y: dot(hole.oval.direction, y), from: hole.oval.from / R, to: hole.oval.to / R } : null
        const points = outline(radius, oval)
        // Start just inside the cover at the hole's rim.
        const reach = Math.max(outside, radius + (oval ? Math.max(Math.abs(oval.from), Math.abs(oval.to)) : 0))
        const top = -(reach * reach) / 2
        const insertFace = outside > reach - 1e-6 && outside > radius + 1e-6
            ? (() => {
                const shape = new Shape().absarc(0, 0, outside, 0, Math.PI * 2, false)
                shape.holes.push(new Path(points.slice().reverse()))
                return new ShapeGeometry(shape, 48)
            })()
            : null
        return {
            matrix: new Matrix4().makeBasis(new Vector3(...x), new Vector3(...y), new Vector3(...out)).setPosition(new Vector3(...hole.center)),
            wall: wallGeometry(points, top, depth),
            bottom: new ShapeGeometry(new Shape(points), 1),
            face: insertFace
        }
    }, [hole])

    return (
        <group matrixAutoUpdate={false} matrix={matrix}>
            <mesh geometry={wall} receiveShadow>
                <meshStandardMaterial color="#2a2a30" roughness={0.9} side={DoubleSide} />
            </mesh>
            <mesh geometry={bottom} position={[0, 0, -hole.depth / R]}>
                <meshStandardMaterial color="#141418" roughness={1} />
            </mesh>
            {face && (
                <mesh geometry={face} position={[0, 0, -0.002]}>
                    <meshStandardMaterial color={insertColor} roughness={0.7} />
                </mesh>
            )}
        </group>
    )
}
