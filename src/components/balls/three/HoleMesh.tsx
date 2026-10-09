import { useMemo } from 'react'
import { BackSide, Quaternion, Vector3 } from 'three'
import { BALL_RADIUS } from '../../../../shared/layout/ballLayout'
import type { PlacedHole } from '../../../../shared/layout/gripPlacement'

interface HoleMeshProps {
    hole: PlacedHole
    /** The insert's color, when the hole holds one. */
    insertColor?: string
}

const R = BALL_RADIUS

/**
 * A drilled hole: its wall and bottom, along its pitched axis. A hole with an
 * insert or hardware shows the insert's face around the grip hole.
 */
export const HoleMesh = ({ hole, insertColor = '#1c1c22' }: HoleMeshProps) => {
    const { position, quaternion, bottom, faceQuaternion } = useMemo(() => {
        const center = new Vector3(...hole.center)
        const axis = new Vector3(...hole.axis)
        const depth = hole.depth / R
        // The cylinder runs along +Y by default: point it out of the hole (against the axis).
        const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis.clone().negate())
        const face = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), center.clone())
        return {
            position: center.clone().addScaledVector(axis, depth / 2 - 0.004),
            quaternion: q,
            bottom: center.clone().addScaledVector(axis, depth),
            faceQuaternion: face
        }
    }, [hole])
    const depth = hole.depth / R
    const radius = hole.radius / R
    const outside = hole.outsideRadius / R
    const insert = outside > radius + 1e-6

    return (
        <group>
            <mesh position={position} quaternion={quaternion} receiveShadow>
                <cylinderGeometry args={[radius, radius, depth + 0.008, 48, 1, true]} />
                <meshStandardMaterial color="#2a2a30" roughness={0.9} side={BackSide} />
            </mesh>
            <mesh position={bottom} quaternion={quaternion}>
                <circleGeometry args={[radius, 48]} />
                <meshStandardMaterial color="#141418" roughness={1} side={BackSide} />
            </mesh>
            {insert && (
                <mesh position={new Vector3(...hole.center).multiplyScalar(0.999)} quaternion={faceQuaternion}>
                    <ringGeometry args={[radius, outside, 64]} />
                    <meshStandardMaterial color={insertColor} roughness={0.7} />
                </mesh>
            )}
        </group>
    )
}
