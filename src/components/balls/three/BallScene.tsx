import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'
import type { LayoutSystem } from '../../../../shared/api/ballLayouts'
import { BALL_RADIUS, REFERENCE, add, gripPoint, move, unit, valPoints, type SolvedLayout, type Vec } from '../../../../shared/layout/ballLayout'
import type { PlacedGrip, PlacedHole } from '../../../../shared/layout/gripPlacement'
import { BallMesh } from './BallMesh'
import { GripFaces, type GripFace } from './GripFaces'
import { MAX_HOLES, type SurfaceSlot } from './holeShader'
import { HoleMesh } from './HoleMesh'
import { SurfaceLine } from './SurfaceLine'
import { layoutDrawing } from '../../../utils/LayoutDrawing'
import { LabelProjector, type SceneLabel } from './LabelProjector'
import { SurfaceMarker } from './SurfaceMarker'
import { SYSTEM_COLORS } from './systemColors'

export interface BallSceneProps {
    solved: SolvedLayout
    hand: 'RIGHT' | 'LEFT'
    grip: PlacedGrip
    polished: boolean
    /** The layout systems drawn on the ball. */
    systems: LayoutSystem[]
    /** A still thumbnail: no labels, no turning. */
    compact?: boolean
}

const range = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step)

/**
 * The ball in 3D (in the app's blue): the drill sheet's holes, the midline
 * and centerline, the pin, PSA and PAP marked, and each chosen layout system
 * drawn the way it's marked (utils/LayoutDrawing). Drag to turn it,
 * scroll or pinch to zoom. A left-hander's layout is mirrored.
 */
const BallScene = ({ solved, hand, grip, polished, systems, compact = false }: BallSceneProps) => {
    const ball = useRef<Mesh>(null)
    const flip = hand === 'LEFT' ? -1 : 1
    const m = (v: Vec): Vec => [v[0] * flip, v[1], v[2]]
    const pin = m(solved.pin), psa = m(solved.psa), pap = m(solved.pap)
    // Face the middle of the grip, the PAP, the pin and the PSA.
    const look = m(unit(add(add(REFERENCE, solved.pap), add(solved.pin, solved.psa))))
    const distance = compact ? 3.25 : 4.1
    const camera: [number, number, number] = [look[0] * distance, look[1] * distance, look[2] * distance]
    // Each chosen system's lines and labels; the labels sit in a plain overlay over the canvas.
    const drawings = useMemo(() => systems.map(system => ({ system, ...layoutDrawing(system, solved) })), [systems, solved])
    const labels = useMemo(() => {
        const marks = [{ at: pin, text: 'Pin', color: '#ffffff' }, { at: psa, text: 'PSA', color: '#ffffff' }, { at: pap, text: 'PAP', color: '#ffffff' }]
        const fromSystems = drawings.flatMap(d => d.labels.map(l => ({ at: m(l.at), text: l.text, color: SYSTEM_COLORS[d.system] })))
        return [...marks, ...fromSystems].map((l, i) => ({ ...l, id: `${i}-${l.text}` }))
    }, [drawings, pin, psa, pap])  // eslint-disable-line react-hooks/exhaustive-deps
    const labelElements = useRef(new Map<string, HTMLElement>())
    const projected: SceneLabel[] = labels.map(l => ({ id: l.id, at: l.at as [number, number, number] }))
    // Each hole's grip hole (round, or its oval's slot) on the surface; the cover is cut out to the drilled
    // hole (an insert's or hardware's O.D.), and the insert's or hardware's face fills between, flush.
    const gripSlot = (h: PlacedHole): SurfaceSlot => {
        const end = (t: number) => (h.oval ? move(h.center, h.oval.direction, t) : h.center) as [number, number, number]
        return { a: end(h.oval?.from ?? 0), b: end(h.oval?.to ?? 0), angle: h.radius / BALL_RADIUS }
    }
    const holes = grip.holes.slice(0, MAX_HOLES)
    const withFace = (h: PlacedHole) => h.outsideRadius > h.radius + 1e-6
    const openings: SurfaceSlot[] = holes.map(h => (withFace(h)
        ? { a: h.center as [number, number, number], b: h.center as [number, number, number], angle: h.outsideRadius / BALL_RADIUS }
        : gripSlot(h)))
    const faces: GripFace[] = holes.filter(withFace).map(h => ({ center: h.center as [number, number, number], outsideAngle: h.outsideRadius / BALL_RADIUS, hole: gripSlot(h) }))

    return (
        <div className="relative size-full">
        <Canvas shadows={!compact} camera={{ position: camera, fov: 36 }} dpr={[1, 2]} gl={{ antialias: true }} className={compact ? 'pointer-events-none' : undefined}>
            <ambientLight intensity={0.35} />
            <directionalLight position={[3, 4, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, -2, 2]} intensity={0.4} />
            <Environment resolution={256}>
                <Lightformer form="circle" intensity={1.6} position={[1, 4, 4]} scale={3} />
                <Lightformer form="circle" intensity={0.7} position={[-4, 1, 2]} scale={2.5} />
            </Environment>

            <BallMesh ref={ball} openings={openings} polished={polished} />
            <GripFaces faces={faces} />
            {grip.holes.map(h => <HoleMesh key={h.name} hole={h} />)}

            <SurfaceLine points={range(-3, 9, 0.25).map(o => m(gripPoint(o, 0)))} color="#e5e7eb" width={1.25} />
            <SurfaceLine points={range(-4, 4, 0.25).map(u => m(gripPoint(0, u)))} color="#e5e7eb" width={1.25} />
            {(systems.includes('PIN_BUFFER') || systems.includes('DUAL_ANGLE')) && <SurfaceLine points={valPoints(solved.pap, 7, 48).map(m)} color="#bfdbfe" dashed />}
            {drawings.flatMap(d => d.lines.map((line, i) => (
                <SurfaceLine key={`${d.system}-${i}`} points={line.points.map(m)} color={SYSTEM_COLORS[d.system]} width={line.width} dashed={line.dashed} />
            )))}

            <SurfaceMarker at={pin} kind="pin" />
            <SurfaceMarker at={psa} kind="psa" />
            <SurfaceMarker at={pap} kind="pap" />

            {!compact && <OrbitControls enablePan={false} minDistance={1.25} maxDistance={6} rotateSpeed={0.8} />}
            {!compact && <LabelProjector labels={projected} elements={labelElements} />}
        </Canvas>
        {!compact && <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {labels.map(l => (
                <span key={l.id} ref={el => { if (el) labelElements.current.set(l.id, el); else labelElements.current.delete(l.id) }}
                    className="absolute left-0 top-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-900 opacity-0 shadow transition-opacity duration-150"
                    style={{ background: l.color }}>{l.text}</span>
            ))}
        </div>}
        </div>
    )
}

export default BallScene
