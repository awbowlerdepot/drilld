import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial, Vector3 } from 'three'
import { MAX_HOLES, cutByHoles, type SurfaceSlot } from './holeShader'

/** An insert's or thumb hardware's face: inside its O.D. circle, outside its grip hole (or oval). */
export interface GripFace {
    center: [number, number, number]
    /** The O.D.'s angular radius, radians. */
    outsideAngle: number
    hole: SurfaceSlot
}

interface GripFacesProps {
    faces: GripFace[]
    color?: string
}

/**
 * The inserts' and thumb hardware's faces, trimmed flush with the ball: a
 * shell just under the cover, kept only between each O.D. and its grip hole
 * (the cover is cut out there).
 */
export const GripFaces = ({ faces, color = '#cbd5e1' }: GripFacesProps) => {
    const uniforms = useMemo(() => ({
        faceCenter: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        faceCos: { value: Array.from({ length: MAX_HOLES }, () => 2) },
        gripA: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        gripB: { value: Array.from({ length: MAX_HOLES }, () => new Vector3(0, 0, 1)) },
        gripCos: { value: Array.from({ length: MAX_HOLES }, () => 2) }
    }), [])

    const material = useMemo(() => {
        const m = new MeshStandardMaterial({ color, roughness: 0.6 })
        const onAFace = Array.from({ length: MAX_HOLES }, (_, i) =>
            `(dot(dir, faceCenter[${i}]) > faceCos[${i}] && slotCos(dir, gripA[${i}], gripB[${i}]) <= gripCos[${i}])`).join(' || ')
        cutByHoles(m, uniforms, `uniform vec3 faceCenter[${MAX_HOLES}];\nuniform float faceCos[${MAX_HOLES}];\nuniform vec3 gripA[${MAX_HOLES}];\nuniform vec3 gripB[${MAX_HOLES}];\nuniform float gripCos[${MAX_HOLES}];`, onAFace)
        return m
    }, [color, uniforms])

    useEffect(() => {
        faces.slice(0, MAX_HOLES).forEach((f, i) => {
            uniforms.faceCenter.value[i].set(...f.center)
            uniforms.gripA.value[i].set(...f.hole.a)
            uniforms.gripB.value[i].set(...f.hole.b)
        })
        uniforms.faceCos.value = uniforms.faceCos.value.map((_, i) => (faces[i] ? Math.cos(faces[i].outsideAngle) : 2))
        uniforms.gripCos.value = uniforms.gripCos.value.map((_, i) => (faces[i] ? Math.cos(faces[i].hole.angle) : 2))
    }, [faces, uniforms])

    useEffect(() => () => material.dispose(), [material])

    if (faces.length === 0) return null
    return (
        <mesh material={material} receiveShadow>
            <sphereGeometry args={[0.9994, 160, 120]} />
        </mesh>
    )
}
