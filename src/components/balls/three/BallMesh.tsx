import { forwardRef, useEffect, useMemo } from 'react'
import { MeshPhysicalMaterial, Vector3, type Mesh } from 'three'
import { MAX_HOLES, cutByHoles, type SurfaceSlot } from './holeShader'

/** The ball's color: the app's blue (blue-700), deep enough for the layout lines to stand out. */
export const BALL_COLOR = '#1d4ed8'

interface BallMeshProps {
    /** The openings cut in the cover: the drilled hole (an insert's or hardware's O.D., or the hole or its oval). */
    openings: SurfaceSlot[]
    /** Polished: a soft shine. Otherwise satin, like a sanded cover: soft highlights, no gloss. */
    polished: boolean
}

/**
 * The ball: a unit sphere in one solid color with a clear coat, with the
 * holes' openings cut out of the cover by its shader, so they can be seen into.
 */
export const BallMesh = forwardRef<Mesh, BallMeshProps>(({ openings, polished }, ref) => {
    const uniforms = useMemo(() => ({
        openA: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        openB: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        openCos: { value: Array.from({ length: MAX_HOLES }, () => 2) }
    }), [])

    const material = useMemo(() => {
        const m = new MeshPhysicalMaterial({
            color: BALL_COLOR,
            roughness: polished ? 0.3 : 0.55,
            clearcoat: polished ? 0.5 : 0.2,
            clearcoatRoughness: polished ? 0.2 : 0.55,
            sheen: 0.2,
            sheenRoughness: 0.7
        })
        const outside = Array.from({ length: MAX_HOLES }, (_, i) => `slotCos(dir, openA[${i}], openB[${i}]) <= openCos[${i}]`).join(' && ')
        cutByHoles(m, uniforms, `uniform vec3 openA[${MAX_HOLES}];\nuniform vec3 openB[${MAX_HOLES}];\nuniform float openCos[${MAX_HOLES}];`, outside)
        return m
    }, [polished, uniforms])

    useEffect(() => {
        openings.slice(0, MAX_HOLES).forEach((o, i) => {
            uniforms.openA.value[i].set(...o.a)
            uniforms.openB.value[i].set(...o.b)
        })
        uniforms.openCos.value = uniforms.openCos.value.map((_, i) => (openings[i] ? Math.cos(openings[i].angle) : 2))
    }, [openings, uniforms])

    useEffect(() => () => material.dispose(), [material])

    return (
        <mesh ref={ref} material={material} castShadow receiveShadow>
            <sphereGeometry args={[1, 160, 120]} />
        </mesh>
    )
})
BallMesh.displayName = 'BallMesh'
