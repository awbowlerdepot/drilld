// The drilling plan for a drill sheet: each hole in drilling order, with the
// steps at the press (bit, depth, and where the readout should be). Positions
// are physical (up and right positive); show them with toReadout for a press.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import { addOffsets, fingerOvalCuts, pitchCenter, thumbOvalCuts, type Hand, type Offset } from './DrillReadouts'
import { describeBevel, type BevelAmount } from './Bevel'
import { collarBitName } from './DrillBits'
import { DEFAULT_HOLE_DEPTHS, standardFingerDepth, standardThumbDepth, type GripStyle } from './HoleDepth'
import type { CompanyHoleDepths } from '../types/settings'
import { format32, format64 } from './Fractions'

export interface DrillStep {
    id: string
    /** What this step is: "O.D.", "Vacu", "Drill", "Starting bit", "Pilot", "Cut 2 of 4". */
    title: string
    /** The bit; absent for a step without drilling (installing hardware). */
    bit64?: number
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
    /** Done at the bench after drilling, not a press step: the bevel. */
    finishing: { label: string; value: string }[]
}

type Pitch = DrillSheetSpec['holes']['thumb']['pitch']

/** What the plan needs besides the sheet: the grip, the standard depths and the standard bevel that apply. */
export interface DrillPlanOptions {
    gripStyle?: GripStyle
    holeDepths?: CompanyHoleDepths
    standardBevel?: BevelAmount
}

/** Step drilling (any hole without an insert or hardware): each step's bit to its depth, before the hole. */
const sequenceSteps = (key: string, hole: { drillingSequence?: { step: number; bitSize64: number; depth32?: number | null; notes?: string | null }[] | null }, center: Offset): DrillStep[] =>
    (hole.drillingSequence ?? [])
        .slice()
        .sort((a, b) => a.step - b.step)
        .map((step, index, all) => ({
            id: `${key}-step-${index}`,
            title: `Step ${index + 1} of ${all.length}`,
            bit64: step.bitSize64,
            depth32: step.depth32 ?? null,
            position: center,
            note: step.notes ?? 'Step drilling, before the hole'
        }))

/** The pilot for interchangeable thumb hardware is about 1/2" smaller than the collar bit. */
export const PILOT_UNDER_COLLAR64 = 32

/**
 * How deep to pilot for interchangeable hardware. 2-3/4" is safe for every
 * system; JoPo Twist can go 3". VISE IT won't install if piloted too deep.
 */
export const interchangeablePilot = (manufacturer: string): { depth32: number; note: string } => {
    if (manufacturer === 'JOPO') return { depth32: 96, note: 'Pilot for the hardware' }
    if (manufacturer === 'VISE') return { depth32: 88, note: 'No deeper, or the IT hardware won\'t install' }
    return { depth32: 88, note: 'Pilot for the hardware; no deeper than 3″' }
}

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

type PlannedHole = Omit<DrillHole, 'finishing'>

const fingerHole = (spec: DrillSheetSpec, finger: 'middle' | 'ring', side: 'LEFT' | 'RIGHT', grip: GripStyle, depths: CompanyHoleDepths): PlannedHole | null => {
    const hole = spec.holes[finger]
    // The sheet's depth for this hole, or the standard for its type.
    const depth32 = hole.depth32 ?? standardFingerDepth(hole, grip, depths)
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
            id: `${key}-od`, title: 'O.D.', bit64: insert.od64, depth32, position: center,
            note: 'Outer hole for the insert'
        })
    } else if (hole.size64) {
        steps.push(...sequenceSteps(key, hole, center))
        steps.push({ id: `${key}-hole`, title: 'Drill', bit64: hole.size64, depth32, position: center })
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

const thumbHole = (spec: DrillSheetSpec, hand: Hand, depths: CompanyHoleDepths): PlannedHole | null => {
    const thumb = spec.holes.thumb
    const depth32 = thumb.depth32 ?? standardThumbDepth(thumb, depths)
    if (!thumb.enabled) return null
    const center = pitchCenter('THUMB', thumb.pitch)
    const steps: DrillStep[] = []
    const hardware = thumb.hardware

    // Interchangeable hardware: pilot, collar bit, install. The thumb hole and its
    // oval are drilled into the inner, not the ball.
    if (hardware?.kind === 'INTERCHANGEABLE_THUMB') {
        steps.push(
            {
                id: 'thumb-pilot', title: 'Pilot', bit64: hardware.od64 - PILOT_UNDER_COLLAR64,
                depth32: interchangeablePilot(hardware.manufacturer).depth32, position: center,
                note: interchangeablePilot(hardware.manufacturer).note
            },
            { id: 'thumb-od', title: collarBitName(hardware), bit64: hardware.od64, position: center, note: 'Down to the collar' },
            { id: 'thumb-install', title: 'Install hardware', position: center, note: `${maker(hardware.manufacturer)} ${hardware.line}`.trim() }
        )
        return {
            key: 'thumb',
            name: 'Thumb',
            grip: [`${maker(hardware.manufacturer)} ${hardware.line}`.trim(), hardware.label].filter(Boolean).join(' · '),
            center,
            pitch: describePitch(thumb.pitch),
            steps
        }
    }

    if (hardware) {
        steps.push({
            id: 'thumb-od', title: hardware.collar ? collarBitName(hardware) : 'O.D.', bit64: hardware.od64, depth32, position: center,
            note: hardware.collar ? 'Preset collar sets the depth' : 'Outer hole for the hardware'
        })
    }
    const insertSetsHole = hardware?.kind === 'THUMB_INSERT'
    const holeBit = thumb.oval?.pilotHole64 ?? thumb.size64
    if (!insertSetsHole && holeBit) {
        const centerStep: DrillStep = {
            id: 'thumb-hole', title: thumb.oval ? 'Starting bit · center' : 'Drill', bit64: holeBit, depth32, position: center,
            note: hardware ? 'Drilled into the slug' : undefined
        }
        const cuts = thumb.oval && thumb.oval.width64 > thumb.oval.pilotHole64
            ? cutSteps('thumb', thumb.oval.pilotHole64, center, thumbOvalCuts(thumb.oval, hand))
            : []
        // An oval is drilled in order across the hole: the up-side cuts, the center, then the down-side cuts.
        const half = cuts.length / 2
        // Step drilling (no hardware) comes first, like a vacu; then the hole and its oval.
        if (!hardware) steps.push(...sequenceSteps('thumb', thumb, center))
        steps.push(...cuts.slice(0, half), centerStep, ...cuts.slice(half))
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

/**
 * The holes to drill, fingers then thumb, each with its steps in order, and
 * what's finished at the bench afterwards (the bevel; the company's standard
 * unless the sheet sets one).
 */
export const buildDrillPlan = (spec: DrillSheetSpec, hand: Hand, options: DrillPlanOptions = {}): DrillHole[] => {
    const { gripStyle = 'FINGERTIP', holeDepths = DEFAULT_HOLE_DEPTHS, standardBevel } = options
    const leftFinger = hand === 'RIGHT' ? 'middle' : 'ring'
    const rightFinger = hand === 'RIGHT' ? 'ring' : 'middle'
    const bevelOf = { left: spec.holes[leftFinger].bevel, right: spec.holes[rightFinger].bevel, thumb: spec.holes.thumb.bevel }
    return [
        fingerHole(spec, leftFinger, 'LEFT', gripStyle, holeDepths),
        fingerHole(spec, rightFinger, 'RIGHT', gripStyle, holeDepths),
        thumbHole(spec, hand, holeDepths)
    ]
        .filter((hole): hole is PlannedHole => hole !== null)
        .map(hole => ({ ...hole, finishing: [{ label: 'Bevel', value: describeBevel(bevelOf[hole.key], standardBevel) }] }))
}

/** "61/64″" or "1-5/16″ · 1″ deep"; empty for a step without a bit. */
export const describeBit = (step: DrillStep) =>
    step.bit64 ? `${format64(step.bit64)}″${step.depth32 ? ` · ${format32(step.depth32)}″ deep` : ''}` : ''
