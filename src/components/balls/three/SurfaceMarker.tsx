import { Html } from '@react-three/drei'
import { useMemo, type RefObject } from 'react'
import { Quaternion, Vector3, type Object3D } from 'three'
import type { Vec } from '../../../../shared/layout/ballLayout'

interface SurfaceMarkerProps {
    at: Vec
    kind: 'pin' | 'psa' | 'pap'
    label: string
    /** The ball, so the label hides when it's around the back. */
    occluder: RefObject<Object3D | null>
}

/** A mark on the ball (the pin, the PSA/MB, the PAP) with its label. */
export const SurfaceMarker = ({ at, kind, label, occluder }: SurfaceMarkerProps) => {
    const { position, quaternion, labelAt } = useMemo(() => {
        const p = new Vector3(...at)
        return {
            position: p.clone().multiplyScalar(1.004),
            quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), p),
            labelAt: p.clone().multiplyScalar(1.06)
        }
    }, [at])
    return (
        <group>
            <mesh position={position} quaternion={quaternion}>
                {kind === 'pin' && <circleGeometry args={[0.03, 32]} />}
                {kind === 'psa' && <circleGeometry args={[0.032, 4]} />}
                {kind === 'pap' && <ringGeometry args={[0.022, 0.036, 40]} />}
                <meshBasicMaterial color={kind === 'pin' ? '#0f0f14' : kind === 'psa' ? '#f59e0b' : '#2563eb'} />
            </mesh>
            <Html position={labelAt} center occlude={[occluder as RefObject<Object3D>]} zIndexRange={[20, 0]}>
                <span className="pointer-events-none select-none whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-800 shadow">{label}</span>
            </Html>
        </group>
    )
}
