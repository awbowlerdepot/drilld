import { forwardRef, useEffect, useMemo } from 'react'
import { MeshPhysicalMaterial, Vector3, type Mesh } from 'three'

export const MAX_HOLES = 5

/** The ball's color: the app's blue (blue-700), deep enough for the layout lines to stand out. */
export const BALL_COLOR = '#1d4ed8'

interface BallMeshProps {
    /** The openings cut in the surface: a slot from `a` to `b` (unit vectors; the same for a round hole) of angular radius `angle` (radians). */
    openings: { a: [number, number, number]; b: [number, number, number]; angle: number }[]
    /** Polished: a soft shine. Otherwise satin, like a sanded cover: soft highlights, no gloss. */
    polished: boolean
}

/**
 * The ball: a unit sphere in one solid color with a clear coat, with the hole
 * openings cut out of the surface by its shader (each fragment within an
 * opening's angle of its slot is discarded), so the holes can be seen into.
 */
export const BallMesh = forwardRef<Mesh, BallMeshProps>(({ openings, polished }, ref) => {
    const uniforms = useMemo(() => ({
        holeA: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        holeB: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        holeCos: { value: Array.from({ length: MAX_HOLES }, () => 2) }
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
        m.onBeforeCompile = shader => {
            shader.uniforms.holeA = uniforms.holeA
            shader.uniforms.holeB = uniforms.holeB
            shader.uniforms.holeCos = uniforms.holeCos
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vBallDir;')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBallDir = normalize(position);')
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\nvarying vec3 vBallDir;\nuniform vec3 holeA[${MAX_HOLES}];\nuniform vec3 holeB[${MAX_HOLES}];\nuniform float holeCos[${MAX_HOLES}];`)
                .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
                    vec3 ballDir = normalize(vBallDir);
                    for (int i = 0; i < ${MAX_HOLES}; i++) {
                        // The nearest point of the slot (its chord, back on the sphere).
                        vec3 ab = holeB[i] - holeA[i];
                        float len2 = dot(ab, ab);
                        float t = len2 > 0.0 ? clamp(dot(ballDir - holeA[i], ab) / len2, 0.0, 1.0) : 0.0;
                        if (dot(ballDir, normalize(holeA[i] + ab * t)) > holeCos[i]) discard;
                    }`)
        }
        return m
    }, [polished, uniforms])

    useEffect(() => {
        openings.forEach((o, i) => {
            if (i >= MAX_HOLES) return
            uniforms.holeA.value[i].set(...o.a)
            uniforms.holeB.value[i].set(...o.b)
        })
        uniforms.holeCos.value = uniforms.holeCos.value.map((_, i) => (openings[i] ? Math.cos(openings[i].angle) : 2))
    }, [openings, uniforms])

    useEffect(() => () => material.dispose(), [material])

    return (
        <mesh ref={ref} material={material} castShadow receiveShadow>
            <sphereGeometry args={[1, 160, 120]} />
        </mesh>
    )
})
BallMesh.displayName = 'BallMesh'
