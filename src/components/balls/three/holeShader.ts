import type { Material } from 'three'

export const MAX_HOLES = 5

/** A hole's slot on the surface: from `a` to `b` (unit vectors; the same for a round hole), `angle` (radians) either side. */
export interface SurfaceSlot {
    a: [number, number, number]
    b: [number, number, number]
    angle: number
}

/** GLSL: the cosine of the angle from a direction on the ball to the nearest point of a slot (its chord, back on the sphere). */
const SLOT_GLSL = `
float slotCos(vec3 dir, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float len2 = dot(ab, ab);
    float t = len2 > 0.0 ? clamp(dot(dir - a, ab) / len2, 0.0, 1.0) : 0.0;
    return dot(dir, normalize(a + ab * t));
}`

/**
 * Cuts a sphere's material by fragment, around the holes: `keep` is GLSL that
 * decides from `dir` (the fragment's direction from the ball's center) and
 * the uniforms which fragments stay; the others are discarded. The uniforms
 * are read with `uniform vec3 name[MAX_HOLES]` / `uniform float name[MAX_HOLES]`.
 */
export const cutByHoles = (material: Material, uniforms: Record<string, { value: unknown }>, declarations: string, keep: string) => {
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms)
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vBallDir;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBallDir = normalize(position);')
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>\nvarying vec3 vBallDir;\n${declarations}\n${SLOT_GLSL}`)
            .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
                vec3 dir = normalize(vBallDir);
                if (!(${keep})) discard;`)
    }
}
