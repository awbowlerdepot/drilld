import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'
import { BALL_RADIUS, arcPoints, fromReference, gripPoint, valFoot, valPoints, type SolvedLayout, type Vec } from '../../../../shared/layout/ballLayout'
import type { PlacedGrip } from '../../../../shared/layout/gripPlacement'
import { BallMesh, MAX_HOLES } from './BallMesh'
import { HoleMesh } from './HoleMesh'
import { SurfaceLine } from './SurfaceLine'
import { SurfaceMarker } from './SurfaceMarker'

export interface BallSceneProps {
    solved: SolvedLayout
    hand: 'RIGHT' | 'LEFT'
    grip: PlacedGrip
    polished: boolean
}

const range = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step)

/**
 * The ball in 3D (in the app's blue): the drill sheet's holes, and the layout
 * drawn on the surface (midline and centerline, the VAL, pin to PAP, pin to
 * PSA, the pin buffer), with the pin, PSA and PAP marked. Drag to turn it,
 * scroll or pinch to zoom. A left-hander's layout is mirrored.
 */
const BallScene = ({ solved, hand, grip, polished }: BallSceneProps) => {
    const ball = useRef<Mesh>(null)
    const flip = hand === 'LEFT' ? -1 : 1
    const m = (v: Vec): Vec => [v[0] * flip, v[1], v[2]]
    const pin = m(solved.pin), psa = m(solved.psa), pap = m(solved.pap)
    // Face the point between the grip and the PAP, a little from above.
    const papAt = fromReference(solved.pap)
    const look = m(gripPoint(papAt.over / 2, papAt.up / 2 + 0.8))
    const camera: [number, number, number] = [look[0] * 3.6, look[1] * 3.6, look[2] * 3.6]
    const openings = grip.holes.slice(0, MAX_HOLES).map(h => ({ direction: h.center as [number, number, number], angle: h.outsideRadius / BALL_RADIUS }))

    return (
        <Canvas shadows camera={{ position: camera, fov: 36 }} dpr={[1, 2]} gl={{ antialias: true }}>
            <ambientLight intensity={0.35} />
            <directionalLight position={[3, 4, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, -2, 2]} intensity={0.4} />
            <Environment resolution={256}>
                <Lightformer form="circle" intensity={1.6} position={[1, 4, 4]} scale={3} />
                <Lightformer form="circle" intensity={0.7} position={[-4, 1, 2]} scale={2.5} />
            </Environment>

            <BallMesh ref={ball} openings={openings} polished={polished} />
            {grip.holes.map(h => <HoleMesh key={h.name} hole={h} />)}

            <SurfaceLine points={range(-3, 9, 0.25).map(o => m(gripPoint(o, 0)))} color="#e5e7eb" width={1.25} />
            <SurfaceLine points={range(-4, 4, 0.25).map(u => m(gripPoint(0, u)))} color="#e5e7eb" width={1.25} />
            <SurfaceLine points={valPoints(solved.pap, 7, 48).map(m)} color="#bfdbfe" dashed />
            <SurfaceLine points={arcPoints(solved.pin, valFoot(solved.pap, solved.pin)).map(m)} color="#bfdbfe" width={2} dashed />
            <SurfaceLine points={arcPoints(solved.pin, solved.pap).map(m)} color="#f8fafc" width={3} />
            <SurfaceLine points={arcPoints(solved.pin, solved.psa).map(m)} color="#fbbf24" width={3} />

            <SurfaceMarker at={pin} kind="pin" label="Pin" occluder={ball} />
            <SurfaceMarker at={psa} kind="psa" label="PSA" occluder={ball} />
            <SurfaceMarker at={pap} kind="pap" label="PAP" occluder={ball} />

            <OrbitControls enablePan={false} minDistance={1.8} maxDistance={6} rotateSpeed={0.8} />
        </Canvas>
    )
}

export default BallScene
