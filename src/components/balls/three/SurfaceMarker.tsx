import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import type { Vec } from '../../../../shared/layout/ballLayout'

interface SurfaceMarkerProps {
    at: Vec
    kind: 'pin' | 'psa' | 'pap'
}

/** A mark on the ball: the pin (black dot), the PSA/MB (amber diamond), the PAP (white ring). Labels are in the scene's overlay. */
export const SurfaceMarker = ({ at, kind }: SurfaceMarkerProps) => {
    const { position, quaternion } = useMemo(() => {
        const p = new Vector3(...at)
        return { position: p.clone().multiplyScalar(1.004), quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), p) }
    }, [at])
    return (
        <mesh position={position} quaternion={quaternion}>
            {kind === 'pin' && <circleGeometry args={[0.03, 32]} />}
            {kind === 'psa' && <circleGeometry args={[0.032, 4]} />}
            {kind === 'pap' && <ringGeometry args={[0.022, 0.036, 40]} />}
            <meshBasicMaterial color={kind === 'pin' ? '#0f0f14' : kind === 'psa' ? '#f59e0b' : '#ffffff'} />
        </mesh>
    )
}
