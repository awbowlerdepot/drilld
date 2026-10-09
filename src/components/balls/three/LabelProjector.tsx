import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Vector3 } from 'three'

export interface SceneLabel {
    id: string
    /** On the ball (unit sphere). */
    at: [number, number, number]
}

interface LabelProjectorProps {
    labels: SceneLabel[]
    /** The labels' elements in the overlay over the canvas, by id. */
    elements: RefObject<Map<string, HTMLElement>>
}

/**
 * Positions the label overlay each frame: each label follows its point on the
 * ball, and is hidden once that point turns to the back. (Plain elements over
 * the canvas, rather than a React root per label.)
 */
export const LabelProjector = ({ labels, elements }: LabelProjectorProps) => {
    const { camera, size } = useThree()
    const point = useRef(new Vector3())
    const toCamera = useRef(new Vector3())
    useFrame(() => {
        for (const label of labels) {
            const el = elements.current.get(label.id)
            if (!el) continue
            const p = point.current.set(...label.at)
            const facing = toCamera.current.copy(camera.position).sub(p).normalize().dot(p) > 0.12
            p.multiplyScalar(1.03).project(camera)
            el.style.transform = `translate(-50%, -50%) translate(${((p.x + 1) / 2) * size.width}px, ${((1 - p.y) / 2) * size.height}px)`
            el.style.opacity = facing ? '1' : '0'
        }
    })
    return null
}
