// What changed between two drill sheet revisions: each spec is described as
// labelled, formatted values ("Bridge: 1/4", "Ring insert: Turbo Quad 8.5 ·
// Power Oval"), and the labels whose values differ are the changes.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import { describeBevel } from './Bevel'
import { format32, format64 } from './Fractions'

export interface SpecChange {
    group: string
    label: string
    before: string
    after: string
}

interface Entry {
    group: string
    label: string
    value: string
}

const NONE = '—'
const MAKERS: Record<string, string> = { VISE: 'VISE', TURBO: 'Turbo', JOPO: 'JoPo' }

const length = (value: number | null | undefined) => (value == null ? NONE : `${format32(value)}″`)
const bit = (value: number | null | undefined) => (value == null ? NONE : `${format64(value)}″`)
const text = (value: string | null | undefined) => (value ? value : NONE)
const number = (value: number | null | undefined, unit: string) => (value == null ? NONE : `${value}${unit}`)

const forward = (value: number | null | undefined) =>
    value ? `${format32(Math.abs(value))}″ ${value < 0 ? 'reverse' : 'forward'}` : NONE
const lateral = (value: number | null | undefined) =>
    value ? `${format32(Math.abs(value))}″ ${value < 0 ? 'left' : 'right'}` : NONE

type Hole = DrillSheetSpec['holes']['middle']
type Thumb = DrillSheetSpec['holes']['thumb']

const SPAN_TYPES = [
    ['full32', 'full'], ['cutToCut32', 'cut-to-cut'], ['outerToCut32', 'outer-to-cut'],
    ['centerToCenter32', 'center to center'], ['fit32', 'fit']
] as const

/** Every value on a sheet worth comparing, labelled and formatted. */
export const describeSpec = (spec: DrillSheetSpec): Entry[] => {
    const entries: Entry[] = []
    const add = (group: string, label: string, value: string) => entries.push({ group, label, value })

    for (const [key, name] of [['thumbToMiddle', 'Thumb–middle'], ['thumbToRing', 'Thumb–ring']] as const) {
        for (const [type, typeName] of SPAN_TYPES) add('Spans', `${name} ${typeName}`, length(spec.spans[key][type]))
        add('Spans', `${name} notes`, text(spec.spans[key].notes))
    }
    for (const span of spec.spans.custom) {
        add('Spans', `${span.name} (${span.from.toLowerCase()}–${span.to.toLowerCase()})`,
            SPAN_TYPES.map(([type, typeName]) => (span[type] ? `${typeName} ${format32(span[type]!)}″` : null)).filter(Boolean).join(', ') || NONE)
    }
    add('Bridge', 'Bridge', length(spec.bridge.distance32))
    add('Bridge', 'Bridge notes', text(spec.bridge.notes))

    const commonHole = (group: string, hole: Hole | Thumb) => {
        add(group, 'Hole size', bit(hole.size64))
        add(group, 'O.D.', bit(hole.outsideDiameter64))
        add(group, 'Depth', length(hole.depth32))
        add(group, 'Pitch', forward(hole.pitch.forward32))
        add(group, 'Lateral pitch', lateral(hole.pitch.lateral32))
        add(group, 'Bevel', describeBevel(hole.bevel))
        add(group, 'Step drilling', hole.drillingSequence?.length
            ? hole.drillingSequence.map(step => `${format64(step.bitSize64)}″${step.depth32 ? ` to ${format32(step.depth32)}″` : ''}`).join(' → ')
            : NONE)
        add(group, 'Notes', text(hole.notes))
    }

    const thumb = spec.holes.thumb
    add('Thumb', 'Thumb hole', thumb.enabled ? 'Yes' : 'No thumb')
    commonHole('Thumb', thumb)
    add('Thumb', 'Hardware', thumb.hardware
        ? [`${MAKERS[thumb.hardware.manufacturer] ?? thumb.hardware.manufacturer} ${thumb.hardware.line}`.trim(), thumb.hardware.label].filter(Boolean).join(' · ')
        : NONE)
    add('Thumb', 'Oval', thumb.oval
        ? `${format64(thumb.oval.pilotHole64)}″ → ${format64(thumb.oval.width64)}″ at ${thumb.oval.angleDegrees}°`
        : NONE)

    for (const [finger, name] of [['middle', 'Middle finger'], ['ring', 'Ring finger'], ['index', 'Index finger'], ['pinky', 'Pinky']] as const) {
        const hole = spec.holes[finger]
        if (!hole) continue
        commonHole(name, hole)
        add(name, 'Insert', hole.insert
            ? [`${MAKERS[hole.insert.manufacturer] ?? hole.insert.manufacturer} ${hole.insert.line}`.trim(),
                hole.insert.label ? `size ${hole.insert.label}` : null, hole.insert.installStyle].filter(Boolean).join(' · ')
            : NONE)
        add(name, 'Vacu', hole.vacu ? `${format64(hole.vacu.bit64)}″ · ${format32(hole.vacu.depth32)}″ deep` : NONE)
        add(name, 'Oval width', bit(hole.fingerOval?.width64))
    }

    add('Fit', 'Flexibility', number(spec.fitting.flexibilityDegrees, '°'))
    add('Fit', 'Pro fit', spec.fitting.proFit ? 'Yes' : 'No')
    add('Fit', 'CLT', number(spec.fitting.cltDegrees, '°'))

    const delivery = spec.delivery ?? {}
    add('Delivery', 'Tilt', number(delivery.axisTiltDegrees, '°'))
    add('Delivery', 'Rotation', number(delivery.axisRotationDegrees, '°'))
    add('Delivery', 'PAP over', length(delivery.papOver32))
    add('Delivery', 'PAP up/down', delivery.papUp32 == null ? NONE : delivery.papUp32 === 0 ? '0' : `${format32(Math.abs(delivery.papUp32))}″ ${delivery.papUp32 > 0 ? 'up' : 'down'}`)
    add('Delivery', 'Speed', number(delivery.speedMph, ' mph'))
    add('Delivery', 'Rev rate', number(delivery.revRateRpm, ' RPM'))

    add('Notes', 'Fitting notes', text(spec.fittingNotes))
    add('Notes', 'General notes', text(spec.notes))
    add('Notes', 'Customer preferences', text(spec.customerPreferences))
    add('Notes', 'Restrictions', spec.restrictions.join(', ') || NONE)
    return entries
}

/** The values that differ from one revision to the next, in sheet order. */
export const diffSpecs = (before: DrillSheetSpec, after: DrillSheetSpec): SpecChange[] => {
    const old = new Map(describeSpec(before).map(entry => [`${entry.group}/${entry.label}`, entry.value]))
    const changes: SpecChange[] = []
    const seen = new Set<string>()
    for (const entry of describeSpec(after)) {
        const key = `${entry.group}/${entry.label}`
        seen.add(key)
        const was = old.get(key) ?? NONE
        if (was !== entry.value) changes.push({ group: entry.group, label: entry.label, before: was, after: entry.value })
    }
    // Something only the earlier revision had (e.g. an index finger hole that was removed).
    for (const entry of describeSpec(before)) {
        const key = `${entry.group}/${entry.label}`
        if (!seen.has(key) && entry.value !== NONE) changes.push({ group: entry.group, label: entry.label, before: entry.value, after: NONE })
    }
    return changes
}
