// Turns the AI's transcription of a paper drill sheet (shared/api/paperReading.ts)
// into drill sheet values for review: fractions into 32nds and 64ths, pitch
// boxes into signed pitch, the left/right circles into middle/ring by hand.
// What can't be turned into a value is kept in the hole or sheet notes, and
// anything assumed or unclear is listed for the reviewer. Never converts one
// span type into another: the reviewer says which type the sheet's spans are.

import type { DrillSheetSpecInput } from '../../shared/api/drillSheetSpec'
import type { SpanTypeKey } from '../../shared/api/paperImports'
import type { PaperSheetReading } from '../../shared/api/paperReading'
import { format32, format64, parseInches } from './Fractions'

export type Hand = 'LEFT' | 'RIGHT'
export type GripStyle = 'FINGERTIP' | 'CONVENTIONAL' | 'TWO_HANDED_NO_THUMB'

/** Something the reviewer should look at. */
export interface ImportIssue {
    field: string
    message: string
    /** Set for issues that picking an insert or hardware answers: 'middle-insert', 'ring-insert', 'thumb-hardware'. */
    topic?: string
}

/** One value read from the sheet: where it is in the reading, what it says, and what it becomes. */
export interface ImportRow {
    group: string
    label: string
    raw: string
    value: string
    path: string[]
}

// ==========================================
// Reading handwritten numbers
// ==========================================

/** "X" (crossed out) means zero. */
const isCrossed = (raw: string) => /^[xX×]$/.test(raw.trim())

const isFraction = (text: string) => /^\d+\s*[- ]?\s*\d*\/\d+$/.test(text.trim()) || /^\d+\/\d+$/.test(text.trim())

/** To 32nds; `exact` is false when the sheet's value isn't a whole number of 32nds. */
const to32 = (inches: number) => ({ value: Math.round(inches * 32), exact: Math.abs(inches * 32 - Math.round(inches * 32)) < 1e-6 })
const to64 = (inches: number) => ({ value: Math.round(inches * 64), exact: Math.abs(inches * 64 - Math.round(inches * 64)) < 1e-6 })

/** A circle's contents split into parts: "31/32 / 6" and "31/32 6" are both ["31/32", "6"]. */
export const holeParts = (inCircle: string | null): string[] => {
    if (!inCircle) return []
    return inCircle.split(' / ').flatMap(part => {
        const tokens = part.trim().split(/\s+/)
        // "31/32 6": a fraction followed by a separate small number.
        if (tokens.length === 2 && /^\d+\/\d+$/.test(tokens[0]) && /^\d+(\.\d+)?$/.test(tokens[1])) return tokens
        return [part.trim()]
    }).filter(Boolean)
}

const fingersBySide = (hand: Hand) =>
    hand === 'RIGHT' ? { left: 'middle' as const, right: 'ring' as const } : { left: 'ring' as const, right: 'middle' as const }

const spanKeyFor = (finger: 'middle' | 'ring') => (finger === 'middle' ? 'thumbToMiddle' : 'thumbToRing')
const SPAN_LABELS: Record<SpanTypeKey, string> = {
    full32: 'Full', cutToCut32: 'Cut-to-cut', outerToCut32: 'Outer-to-cut', centerToCenter32: 'Center to center', fit32: 'Fit'
}

const joinNotes = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join('. ') || null

// ==========================================
// The proposal
// ==========================================

/** Where a value is in the reading, so the reviewer can correct it there: ['thumb', 'inCircle']. */
export type ReadingPath = string[]

/** What the sheet says about a finger hole's insert: matched against the grip catalog. */
export interface FingerGripClue {
    finger: 'middle' | 'ring'
    /** The insert size as written: "7.5", "6". */
    sizeLabel: string | null
    /** The O.D. written over the size ("31/32 / 6"), in 64ths. */
    od64: number | null
    /** The style written for it: "Lift", "Oval". */
    style: string | null
    /** A brand mark: "VG", "VISE", "Turbo". */
    brand: string | null
}

/** What the sheet says about the thumb hardware: "Slug", "IT", a size. */
export interface ThumbGripClue {
    style: string | null
    size: string | null
    brand: string | null
    /** The thumb hole drilled into it, for the 1/8″ wall rule. */
    holeSize64: number | null
}

export interface ImportProposal {
    spec: DrillSheetSpecInput
    rows: ImportRow[]
    issues: ImportIssue[]
    grips: { middle: FingerGripClue | null; ring: FingerGripClue | null; thumb: ThumbGripClue | null }
}

const BRAND = /\b(VG|VISE|TURBO|JOPO|JO PO)\b/i
const brandIn = (...texts: (string | null)[]) => {
    for (const text of texts) {
        const match = text ? BRAND.exec(text) : null
        if (match) return match[1].toUpperCase()
    }
    return null
}
/** "Lift" from "VG Lift"; brand marks and sizes aren't the style. */
const styleIn = (...texts: (string | null)[]) => {
    for (const text of texts) {
        const words = text?.replace(BRAND, ' ').replace(/[\d./-]+/g, ' ').trim()
        if (words) return words
    }
    return null
}
const isSizeLabel = (text: string) => /^-?\d+(\.\d+)?$/.test(text.trim()) && Number(text) < 30

/**
 * The drill sheet values a reading proposes, for this hand and span type,
 * with where each was read from, what the reviewer should check, and the
 * clues for picking inserts and thumb hardware from the catalog.
 */
export const proposeFromReading = (reading: PaperSheetReading, options: { hand: Hand; spanType: SpanTypeKey }): ImportProposal => {
    const rows: ImportRow[] = []
    const issues: ImportIssue[] = reading.uncertain.map(u => ({ field: u.field, message: `Hard to read: ${u.reason}` }))
    for (const correction of reading.corrections) issues.push({ field: 'corrections', message: `Corrected on the sheet: ${correction}` })
    const sides = fingersBySide(options.hand)
    const brandNote = reading.template.brand === 'ULTIMATE' ? ' (Ultimate crosshair: up read as reverse for fingers, forward for the thumb)' : ''

    const length32 = (group: string, label: string, raw: string | null, path: ReadingPath, max = 320): number | null => {
        const inches = parseInches(raw)
        if (inches == null) {
            if (raw && !isCrossed(raw)) {
                issues.push({ field: `${group} ${label}`, message: `Couldn't read "${raw}" as a measurement` })
                rows.push({ group, label, raw, value: '—', path })
            }
            return null
        }
        const { value, exact } = to32(inches)
        if (!exact) issues.push({ field: `${group} ${label}`, message: `"${raw}" isn't a whole 32nd; rounded to ${format32(value)}` })
        if (value > max) {
            issues.push({ field: `${group} ${label}`, message: `"${raw}" is out of range` })
            return null
        }
        rows.push({ group, label, raw: raw ?? '', value: value === 0 ? '0' : `${format32(value)}″`, path })
        return value
    }

    /** One pitch direction from its pair of boxes: positive one way, negative the other. */
    const pitch = (group: string, label: string, positive: [string, string | null, ReadingPath], negative: [string, string | null, ReadingPath]): number | null => {
        const plus = parseInches(positive[1])
        const minus = parseInches(negative[1])
        const unreadable = (positive[1] && plus == null && !isCrossed(positive[1])) || (negative[1] && minus == null && !isCrossed(negative[1]))
        if (unreadable) issues.push({ field: `${group} ${label}`, message: `Couldn't read the pitch (${positive[0]} "${positive[1] ?? ''}", ${negative[0]} "${negative[1] ?? ''}")` })
        if (plus == null && minus == null) return null
        if (plus && minus) {
            issues.push({ field: `${group} ${label}`, message: `Both ${positive[0]} (${positive[1]}) and ${negative[0]} (${negative[1]}) have values; left blank` })
            rows.push({ group, label: `${label} (${positive[0]})`, raw: positive[1] ?? '', value: '—', path: positive[2] })
            rows.push({ group, label: `${label} (${negative[0]})`, raw: negative[1] ?? '', value: '—', path: negative[2] })
            return null
        }
        const inches = plus ? plus : minus ? -minus : 0
        const { value, exact } = to32(inches)
        if (!exact) issues.push({ field: `${group} ${label}`, message: `Pitch isn't a whole 32nd; rounded to ${format32(value)}` })
        if (Math.abs(value) > 64) {
            issues.push({ field: `${group} ${label}`, message: 'Pitch is over 2″; left blank' })
            return null
        }
        const box = plus ? positive : minus ? negative : (positive[1] != null ? positive : negative)
        rows.push({
            group, label: `${label} (${box[0]})`, raw: box[1] ?? '', path: box[2],
            value: value === 0 ? '0' : `${format32(Math.abs(value))} ${value > 0 ? positive[0] : negative[0]}`
        })
        return value
    }

    const fingerPitch = (group: string, key: 'leftFingerPitch' | 'rightFingerPitch') => {
        const boxes = reading[key]
        // Fingers: reverse is up on the form; forward down.
        const forwardKey = boxes.forward != null ? 'forward' : 'down'
        const reverseKey = boxes.reverse != null ? 'reverse' : 'up'
        return {
            forward32: pitch(group, 'Pitch', ['forward', boxes[forwardKey], [key, forwardKey]], ['reverse', boxes[reverseKey], [key, reverseKey]]),
            lateral32: pitch(group, 'Lateral', ['right', boxes.right, [key, 'right']], ['left', boxes.left, [key, 'left']])
        }
    }

    // A finger hole: a bit size, or an insert (its O.D. over its size, or just its size).
    const fingerHole = (side: 'left' | 'right') => {
        const finger = sides[side]
        const group = `${finger === 'middle' ? 'Middle' : 'Ring'} finger`
        const holeKey = side === 'left' ? 'leftFinger' : 'rightFinger'
        const hole = reading[holeKey]
        const insertRow = reading.inserts[finger]
        const parts = holeParts(hole.inCircle)
        const result: Record<string, unknown> = { pitch: fingerPitch(group, side === 'left' ? 'leftFingerPitch' : 'rightFingerPitch') }
        const notes: string[] = []
        const sizeParts = parts.filter(isFraction)
        const labelParts = parts.filter(isSizeLabel)
        let od64: number | null = null
        let sizeLabel: string | null = labelParts[0] ?? null
        let description = '—'

        if (sizeParts.length === 1 && labelParts.length > 0) {
            // "31/32 / 6": the insert's O.D. and its size.
            od64 = to64(parseInches(sizeParts[0]) ?? 0).value
            result.outsideDiameter64 = od64
            description = `O.D. ${format64(od64)}″, insert size ${labelParts.join(' ')}`
        } else if (sizeParts.length === 1) {
            const { value, exact } = to64(parseInches(sizeParts[0]) ?? 0)
            if (!exact) issues.push({ field: group, message: `"${sizeParts[0]}" isn't a whole 64th; rounded to ${format64(value)}` })
            result.size64 = value
            description = `Hole ${format64(value)}″`
        } else if (parts.length === 1 && /^\d+$/.test(parts[0]) && Number(parts[0]) >= 32 && Number(parts[0]) <= 80) {
            // A bare "47": a bit size in 64ths.
            result.size64 = Number(parts[0])
            sizeLabel = null
            description = `Hole ${format64(Number(parts[0]))}″`
            issues.push({ field: group, message: `Read "${parts[0]}" as a ${format64(Number(parts[0]))}″ bit (64ths)` })
        } else if (labelParts.length === 1 && parts.length === 1) {
            // "7.5": an insert size by itself.
            description = `Insert size ${labelParts[0]}`
        } else if (parts.length > 0) {
            notes.push(`Paper sheet: ${hole.inCircle}`)
            issues.push({ field: group, message: `Couldn't make sense of "${hole.inCircle}"; kept in the hole notes`, topic: `${finger}-insert` })
        }
        if (hole.inCircle) rows.push({ group, label: 'In the circle', raw: hole.inCircle, value: description, path: [holeKey, 'inCircle'] })
        if (hole.beside) rows.push({ group, label: 'Beside the circle', raw: hole.beside, value: 'Used to find the insert', path: [holeKey, 'beside'] })
        if (insertRow.style) rows.push({ group, label: 'Insert style (table)', raw: insertRow.style, value: 'Used to find the insert', path: ['inserts', finger, 'style'] })
        if (insertRow.size) {
            rows.push({ group, label: 'Insert size (table)', raw: insertRow.size, value: 'Used to find the insert', path: ['inserts', finger, 'size'] })
            if (!sizeLabel && isSizeLabel(insertRow.size)) sizeLabel = insertRow.size.trim()
        }
        const style = styleIn(insertRow.style, hole.beside)
        const brand = brandIn(hole.beside, insertRow.style, hole.inCircle)
        if (style || brand) notes.push(`Insert on the sheet: ${[hole.beside, insertRow.style, insertRow.size].filter(Boolean).join(' ')}`)
        result.notes = joinNotes(...notes)
        const clue: FingerGripClue | null = sizeLabel || od64 ? { finger, sizeLabel, od64, style, brand } : null
        return { finger, hole: result, clue }
    }

    const left = fingerHole('left')
    const right = fingerHole('right')

    // The thumb: bit size, oval, pitch, hardware.
    const thumbBoxes = reading.thumbPitch
    // Thumb: reverse is down on the form; forward up.
    const thumbForwardKey = thumbBoxes.forward != null ? 'forward' : 'up'
    const thumbReverseKey = thumbBoxes.reverse != null ? 'reverse' : 'down'
    const thumb: Record<string, unknown> = {
        pitch: {
            forward32: pitch('Thumb', 'Pitch', ['forward', thumbBoxes[thumbForwardKey], ['thumbPitch', thumbForwardKey]], ['reverse', thumbBoxes[thumbReverseKey], ['thumbPitch', thumbReverseKey]]),
            lateral32: pitch('Thumb', 'Lateral', ['right', thumbBoxes.right, ['thumbPitch', 'right']], ['left', thumbBoxes.left, ['thumbPitch', 'left']])
        }
    }
    const thumbNotes: string[] = []
    const thumbParts = holeParts(reading.thumb.inCircle)
    const thumbSize = thumbParts.find(isFraction)
    let thumbSize64: number | null = null
    if (thumbSize) {
        const { value, exact } = to64(parseInches(thumbSize) ?? 0)
        if (!exact) issues.push({ field: 'Thumb', message: `"${thumbSize}" isn't a whole 64th; rounded to ${format64(value)}` })
        thumbSize64 = value
        thumb.size64 = value
    }
    if (reading.thumb.inCircle) {
        rows.push({ group: 'Thumb', label: 'In the circle', raw: reading.thumb.inCircle, value: thumbSize64 ? `Hole ${format64(thumbSize64)}″` : '—', path: ['thumb', 'inCircle'] })
    }
    const thumbExtra = [...thumbParts.filter(part => part !== thumbSize), reading.thumb.beside].filter(Boolean).join(' ')
    if (thumbExtra) {
        thumbNotes.push(`Paper sheet: ${[reading.thumb.inCircle, reading.thumb.beside].filter(Boolean).join(' ')}`)
        issues.push({ field: 'Thumb', message: `Also written with the thumb: "${thumbExtra}"; kept in the thumb notes` })
    }
    const thumbRow = reading.inserts.thumb
    if (thumbRow.style) rows.push({ group: 'Thumb', label: 'Hardware (table)', raw: thumbRow.style, value: 'Used to find the hardware', path: ['inserts', 'thumb', 'style'] })
    if (thumbRow.size) rows.push({ group: 'Thumb', label: 'Hardware size (table)', raw: thumbRow.size, value: 'Used to find the hardware', path: ['inserts', 'thumb', 'size'] })
    const thumbClue: ThumbGripClue | null = thumbRow.style || thumbRow.size
        ? { style: styleIn(thumbRow.style), size: thumbRow.size, brand: brandIn(thumbRow.style, reading.thumb.beside), holeSize64: thumbSize64 }
        : null
    if (thumbClue) thumbNotes.push(`Thumb hardware on the sheet: ${[thumbRow.style, thumbRow.size].filter(Boolean).join(' ')}`)

    // Oval: the angle, and the width as decimal inches added to the starting bit.
    const degrees = reading.oval.degree ? Number(/\d+(\.\d+)?/.exec(reading.oval.degree)?.[0]) : NaN
    const width = parseInches(reading.oval.width)
    if (reading.oval.degree || reading.oval.width) {
        const ok = thumbSize64 && !Number.isNaN(degrees) && width && degrees <= 90
        const width64 = ok ? thumbSize64! + Math.max(1, Math.round(width! * 64)) : null
        if (reading.oval.degree) rows.push({ group: 'Thumb', label: 'Oval angle', raw: reading.oval.degree, value: ok ? `${degrees}°` : '—', path: ['oval', 'degree'] })
        if (reading.oval.width) rows.push({ group: 'Thumb', label: 'Oval width', raw: reading.oval.width, value: ok ? `${format64(thumbSize64!)}″ to ${format64(width64!)}″` : '—', path: ['oval', 'width'] })
        if (ok) {
            thumb.oval = { angleDegrees: degrees, pilotHole64: thumbSize64, width64 }
            issues.push({ field: 'Thumb oval', message: `Read width ${reading.oval.width} as ${width}″ added to the ${format64(thumbSize64!)}″ starting bit (≈${format64(width64!)}″)` })
        } else {
            thumbNotes.push(`Oval on the sheet: ${[reading.oval.degree, reading.oval.width].filter(Boolean).join(', ')}`)
            issues.push({ field: 'Thumb oval', message: `Couldn't set the oval from "${reading.oval.degree ?? ''}" / "${reading.oval.width ?? ''}"; kept in the thumb notes` })
        }
    }
    thumb.notes = joinNotes(...thumbNotes)
    if (reading.grip === 'NO_THUMB') thumb.enabled = false

    // Spans, in the type the reviewer chose. A value written later (another ink) wins.
    const spans: Record<string, Record<string, unknown>> = { thumbToMiddle: {}, thumbToRing: {} }
    for (const side of ['left', 'right'] as const) {
        const key = side === 'left' ? 'leftSpan' : 'rightSpan'
        const span = reading[key]
        const finger = sides[side]
        const group = `Span to ${finger}`
        const useAlternate = !!span.alternate
        if (span.alternate && span.value) issues.push({ field: group, message: `Used the later value ${span.alternate} (the sheet also has ${span.value})` })
        const value = length32(group, SPAN_LABELS[options.spanType], useAlternate ? span.alternate : span.value, [key, useAlternate ? 'alternate' : 'value'])
        if (value) spans[spanKeyFor(finger)][options.spanType] = value
        const spanNotes = joinNotes(span.annotation ? `Marked "${span.annotation}" on the paper sheet` : null, span.alternate && span.value ? `Paper sheet: ${span.value}, later ${span.alternate}` : null)
        if (spanNotes) spans[spanKeyFor(finger)].notes = spanNotes
        if (span.annotation) issues.push({ field: group, message: `Marked "${span.annotation}" on the sheet: check the span type` })
    }

    const bridge = length32('Bridge', 'Bridge', reading.bridge, ['bridge'], 64)

    const sheetNotes = joinNotes(
        reading.notes,
        reading.layout ? `Layout: ${reading.layout}` : null,
        reading.pap ? `PAP: ${reading.pap}` : null,
        reading.ball.name || reading.ball.weight || reading.ball.serial ? `Ball: ${[reading.ball.name, reading.ball.weight, reading.ball.serial].filter(Boolean).join(', ')}` : null,
        `Imported from a ${templateName(reading.template.brand) ?? 'paper'} drill sheet${brandNote}`
    )

    const spec: DrillSheetSpecInput = {
        spans: spans as DrillSheetSpecInput['spans'],
        bridge: { distance32: bridge },
        holes: { thumb, [left.finger]: left.hole, [right.finger]: right.hole } as DrillSheetSpecInput['holes'],
        notes: sheetNotes
    }
    return {
        spec, rows, issues,
        grips: { [left.finger]: left.clue, [right.finger]: right.clue, thumb: thumbClue } as ImportProposal['grips']
    }
}

/** The bowler from the reading: first and last name split if the model didn't. */
export const bowlerFromReading = (reading: PaperSheetReading) => {
    let firstName = reading.bowler.firstName?.trim() ?? ''
    let lastName = reading.bowler.lastName?.trim() ?? ''
    if ((!firstName || !lastName) && reading.bowler.name) {
        const parts = reading.bowler.name.trim().split(/\s+/)
        firstName ||= parts.slice(0, -1).join(' ') || parts[0] || ''
        lastName ||= parts.length > 1 ? parts[parts.length - 1] : ''
    }
    const grip: GripStyle = reading.grip === 'CONVENTIONAL' ? 'CONVENTIONAL' : reading.grip === 'NO_THUMB' ? 'TWO_HANDED_NO_THUMB' : 'FINGERTIP'
    return {
        firstName,
        lastName,
        phone: reading.bowler.phone ?? '',
        email: reading.bowler.email ?? '',
        hand: reading.hand,
        grip,
        gripKnown: reading.grip !== null
    }
}

/** A blank reading: for entering a sheet by hand when it couldn't be read. */
export const EMPTY_READING: PaperSheetReading = {
    template: { brand: 'UNKNOWN', printed: null },
    bowler: { name: null, firstName: null, lastName: null, phone: null, email: null, date: null },
    hand: null,
    grip: null,
    twoHanded: null,
    leftFinger: { inCircle: null, beside: null },
    rightFinger: { inCircle: null, beside: null },
    thumb: { inCircle: null, beside: null },
    bridge: null,
    leftSpan: { value: null, annotation: null, alternate: null },
    rightSpan: { value: null, annotation: null, alternate: null },
    leftFingerPitch: { reverse: null, forward: null, left: null, right: null, up: null, down: null },
    rightFingerPitch: { reverse: null, forward: null, left: null, right: null, up: null, down: null },
    thumbPitch: { reverse: null, forward: null, left: null, right: null, up: null, down: null },
    oval: { degree: null, width: null },
    inserts: { thumb: { style: null, size: null }, middle: { style: null, size: null }, ring: { style: null, size: null } },
    layout: null,
    pap: null,
    ball: { name: null, weight: null, serial: null },
    notes: null,
    corrections: [],
    uncertain: []
}

/** "Motiv", "Storm"…, or null for an unknown form. */
export const templateName = (brand: PaperSheetReading['template']['brand'] | null) =>
    !brand || brand === 'UNKNOWN' || brand === 'OTHER' ? null : `${brand.charAt(0)}${brand.slice(1).toLowerCase()}`
