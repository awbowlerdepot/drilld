import { forwardRef, useEffect, useMemo } from 'react'
import { MeshPhysicalMaterial, Vector3, type Mesh, type Texture } from 'three'

export const MAX_HOLES = 5

interface BallMeshProps {
    texture: Texture
    /** The openings cut in the surface: direction (unit) and angular radius (radians). */
    openings: { direction: [number, number, number]; angle: number }[]
    /** Polished: a soft shine. Otherwise matte, like a sanded cover. */
    polished: boolean
}

/**
 * The ball: a unit sphere with the coverstock and a clear coat, with the hole
 * openings cut out of the surface by its shader (each fragment within an
 * opening's angle of its direction is discarded), so the holes can be seen into.
 */
export const BallMesh = forwardRef<Mesh, BallMeshProps>(({ texture, openings, polished }, ref) => {
    const uniforms = useMemo(() => ({
        holeDir: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        holeCos: { value: Array.from({ length: MAX_HOLES }, () => 2) }
    }), [])

    const material = useMemo(() => {
        const m = new MeshPhysicalMaterial({
            map: texture,
            roughness: polished ? 0.32 : 0.78,
            clearcoat: polished ? 0.45 : 0,
            clearcoatRoughness: polished ? 0.22 : 1,
            sheen: polished ? 0.1 : 0.35,
            sheenRoughness: 0.8
        })
        m.onBeforeCompile = shader => {
            shader.uniforms.holeDir = uniforms.holeDir
            shader.uniforms.holeCos = uniforms.holeCos
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vBallDir;')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBallDir = normalize(position);')
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\nvarying vec3 vBallDir;\nuniform vec3 holeDir[${MAX_HOLES}];\nuniform float holeCos[${MAX_HOLES}];`)
                .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
                    for (int i = 0; i < ${MAX_HOLES}; i++) {
                        if (dot(normalize(vBallDir), holeDir[i]) > holeCos[i]) discard;
                    }`)
        }
        return m
    }, [texture, polished, uniforms])

    useEffect(() => {
        uniforms.holeDir.value.forEach((v, i) => {
            const o = openings[i]
            if (o) v.set(...o.direction)
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
