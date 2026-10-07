// The drilling plan for a drill sheet: each hole in drilling order, with the
// steps at the press (bit, depth, and where the readout should be). Positions
// are physical (up and right positive); show them with toReadout for a press.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import { addOffsets, fingerOvalCuts, pitchCenter, thumbOvalCuts, type Hand, type Offset } from './DrillReadouts'
import { format32, format64 } from './Fractions'

export interface DrillStep {
    id: string
    /** What this step is: "O.D.", "Vacu", "Drill", "Pilot", "Cut 2 of 4". */
    title: string
    bit64: number
    /** Drill depth in 32nds, when it's not the full hole (vacu). */
    depth32?: number | null
    /** Where the readout should be, physical. */
    position: Offset
    /** For a cut: its offset from the pitch center. */
    offset?: Offset
    note?: string
}

export interface DrillHole {
    key: 'left' | 'right' | 'thumb'
    name: string
    /** The insert or hardware, if any. */
    grip?: string
    center: Offset
    /** "3/8 reverse · 1/8 left" */
    pitch: string
    steps: DrillStep[]
}

type Pitch = DrillSheetSpec['holes']['thumb']['pitch']

/** How deep a finger insert's O.D. is drilled, unless the hole sets a depth: 2". */
export const INSERT_DEPTH32 = 64

const MAKERS: Record<string, string> = { VISE: 'VISE', TURBO: 'Turbo', JOPO: 'JoPo' }
const maker = (code: string) => MAKERS[code] ?? code

const describePitch = (pitch: Pitch) => {
    const parts = []
    if (pitch.forward32) parts.push(`${format32(Math.abs(pitch.forward32))} ${pitch.forward32 < 0 ? 'reverse' : 'forward'}`)
    if (pitch.lateral32) parts.push(`${format32(Math.abs(pitch.lateral32))} ${pitch.lateral32 < 0 ? 'left' : 'right'}`)
    return parts.join(' · ') || 'Zero pitch'
}

const cutSteps = (key: string, bit64: number, center: Offset, cuts: Offset[]): DrillStep[] =>
    cuts.map((cut, index) => ({
        id: `${key}-cut-${index}`,
        title: `Cut ${index + 1} of ${cuts.length}`,
        bit64,
        position: addOffsets(center, cut),
        offset: cut
    }))

const fingerHole = (spec: DrillSheetSpec, finger: 'middle' | 'ring', side: 'LEFT' | 'RIGHT'): DrillHole | null => {
    const hole = spec.holes[finger]
    const key = side === 'LEFT' ? 'left' : 'right'
    const center = pitchCenter('FINGER', hole.pitch)
    const steps: DrillStep[] = []
    const insert = hole.insert

    if (insert) {
        // With a vacu, the vacu bit goes first (to its depth, 1" standard), then the O.D. to the insert depth.
        if (hole.vacu) {
            steps.push({
                id: `${key}-vacu`, title: 'Vacu', bit64: hole.vacu.bit64, depth32: hole.vacu.depth32, position: center,
                note: `Top ${format32(hole.vacu.depth32)}″ only, before the O.D.`
            })
        }
        steps.push({
            id: `${key}-od`, title: 'O.D.', bit64: insert.od64, depth32: hole.depth32 ?? INSERT_DEPTH32, position: center,
            note: 'Outer hole for the insert'
        })
    } else if (hole.size64) {
        steps.push({ id: `${key}-hole`, title: 'Drill', bit64: hole.size64, position: center })
        if (hole.fingerOval && hole.fingerOval.width64 > hole.size64) {
            steps.push(...cutSteps(key, hole.size64, center, fingerOvalCuts({ size64: hole.size64, width64: hole.fingerOval.width64 }, side)))
        }
    }
    if (steps.length === 0) return null

    return {
        key,
        name: `${side === 'LEFT' ? 'Left' : 'Right'} finger · ${finger}`,
        grip: insert
            ? [`${maker(insert.manufacturer)} ${insert.line}`.trim(), insert.label ? `size ${insert.label}` : null, insert.installStyle].filter(Boolean).join(' · ')
            : undefined,
        center,
        pitch: describePitch(hole.pitch),
        steps
    }
}

const thumbHole = (spec: DrillSheetSpec, hand: Hand): DrillHole | null => {
    const thumb = spec.holes.thumb
    if (!thumb.enabled) return null
    const center = pitchCenter('THUMB', thumb.pitch)
    const steps: DrillStep[] = []
    const hardware = thumb.hardware

    if (hardware) {
        steps.push({
            id: 'thumb-od', title: hardware.collar ? 'Collar bit' : 'O.D.', bit64: hardware.od64, position: center,
            note: hardware.collar ? 'Preset collar sets the depth' : 'Outer hole for the hardware'
        })
    }
    const insertSetsHole = hardware?.kind === 'THUMB_INSERT'
    const holeBit = thumb.oval?.pilotHole64 ?? thumb.size64
    if (!insertSetsHole && holeBit) {
        steps.push({
            id: 'thumb-hole', title: thumb.oval ? 'Pilot' : 'Drill', bit64: holeBit, position: center,
            note: hardware ? `Drilled into the ${hardware.kind === 'THUMB_SLUG' ? 'slug' : 'inner'}` : undefined
        })
        if (thumb.oval && thumb.oval.width64 > thumb.oval.pilotHole64) {
            steps.push(...cutSteps('thumb', thumb.oval.pilotHole64, center, thumbOvalCuts(thumb.oval, hand)))
        }
    }
    if (steps.length === 0) return null

    return {
        key: 'thumb',
        name: 'Thumb',
        grip: hardware ? [`${maker(hardware.manufacturer)} ${hardware.line}`.trim(), hardware.label].filter(Boolean).join(' · ') : undefined,
        center,
        pitch: describePitch(thumb.pitch),
        steps
    }
}

/** The holes to drill, fingers then thumb, each with its steps in order. */
export const buildDrillPlan = (spec: DrillSheetSpec, hand: Hand): DrillHole[] => {
    const leftFinger = hand === 'RIGHT' ? 'middle' : 'ring'
    const rightFinger = hand === 'RIGHT' ? 'ring' : 'middle'
    return [fingerHole(spec, leftFinger, 'LEFT'), fingerHole(spec, rightFinger, 'RIGHT'), thumbHole(spec, hand)]
        .filter((hole): hole is DrillHole => hole !== null)
}

/** "61/64″" or "1-5/16″ · 1″ deep" */
export const describeBit = (step: DrillStep) =>
    `${format64(step.bit64)}″${step.depth32 ? ` · ${format32(step.depth32)}″ deep` : ''}`
