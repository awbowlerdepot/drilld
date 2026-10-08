// Narrows the grip catalog to the inserts or thumb hardware a paper sheet
// could mean, from what's written (a size like "7.5", an O.D. like 31/32, a
// style like "Lift", a brand mark like "VG") and what the location carries.
// One match is filled in; several are offered for the reviewer to choose.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import type { GripLineDto, GripManufacturer } from '../../shared/api/grips'
import type { FingerGripClue, ThumbGripClue } from './PaperSheetImport'

export type InsertChoice = NonNullable<DrillSheetSpec['holes']['middle']['insert']>
export type HardwareChoice = NonNullable<DrillSheetSpec['holes']['thumb']['hardware']>

export interface GripCandidates<T> {
    options: T[]
    /** True when nothing the location carries matched, so the whole catalog was used. */
    outsideStock: boolean
}

/** The 1/8″ minimum wall around a thumb hole drilled into a slug or inner. */
const MIN_WALL64 = 8

const BRANDS: Record<string, GripManufacturer> = { VG: 'VISE', VISE: 'VISE', TURBO: 'TURBO', JOPO: 'JOPO', 'JO PO': 'JOPO' }

const sameSize = (label: string, written: string) => {
    const a = Number(label)
    const b = Number(written)
    return Number.isFinite(a) && Number.isFinite(b) ? a === b : label.trim().toLowerCase() === written.trim().toLowerCase()
}

/** The install style a written style means: "Lift" → "Power Lift"; null if the line has none that fit. */
const matchStyle = (styles: string[], written: string | null): string | null | undefined => {
    if (!written) return styles.length === 1 ? styles[0] : null
    const word = written.trim().toLowerCase()
    const found = styles.filter(style => style.toLowerCase().includes(word))
    // "Lift" fits both "Power Lift" and "Power Lift Oval": prefer the plain one.
    found.sort((a, b) => a.length - b.length)
    return found[0] ?? undefined
}

const narrowToStock = <T extends { gripSizeId?: string | null }>(all: T[], stock: Set<string>): GripCandidates<T> => {
    if (stock.size === 0) return { options: all, outsideStock: false }
    const carried = all.filter(option => option.gripSizeId && stock.has(option.gripSizeId))
    return carried.length > 0 ? { options: carried, outsideStock: false } : { options: all, outsideStock: all.length > 0 }
}

/** Finger inserts that fit the clue, from what the location carries when anything there fits. */
export const fingerInsertCandidates = (clue: FingerGripClue, lines: GripLineDto[], stock: Set<string>): GripCandidates<InsertChoice> => {
    const brand = clue.brand ? BRANDS[clue.brand] : undefined
    const options: InsertChoice[] = []
    for (const line of lines) {
        if (line.kind !== 'FINGER_INSERT') continue
        if (brand && line.manufacturer !== brand) continue
        const style = matchStyle(line.installStyles, clue.style)
        if (style === undefined) continue
        for (const size of line.sizes) {
            if (clue.sizeLabel && !sameSize(size.label, clue.sizeLabel)) continue
            if (clue.od64 && !size.od64Choices.includes(clue.od64)) continue
            options.push({
                gripSizeId: size.id,
                manufacturer: line.manufacturer,
                line: line.name,
                size64: size.size64,
                label: size.label,
                od64: clue.od64 ?? size.od64Choices[0],
                installStyle: style
            })
        }
    }
    return narrowToStock(options, stock)
}

const HARDWARE_KIND = (style: string | null): HardwareChoice['kind'] | null => {
    const text = style?.toLowerCase() ?? ''
    if (/slug|solid/.test(text)) return 'THUMB_SLUG'
    if (/\bit\b|interchang|switch|twist/.test(text)) return 'INTERCHANGEABLE_THUMB'
    if (/insert|oval|round|vinyl|xcel/.test(text)) return 'THUMB_INSERT'
    return null
}

/**
 * Thumb hardware that fits the clue. A slug or inner must leave a 1/8″ wall
 * around the thumb hole drilled into it; a thumb insert's size is the hole.
 */
export const thumbHardwareCandidates = (clue: ThumbGripClue, lines: GripLineDto[], stock: Set<string>): GripCandidates<HardwareChoice> => {
    const kind = HARDWARE_KIND(clue.style)
    const brand = clue.brand ? BRANDS[clue.brand] : undefined
    const options: HardwareChoice[] = []
    for (const line of lines) {
        if (line.kind !== 'THUMB_SLUG' && line.kind !== 'THUMB_INSERT' && line.kind !== 'INTERCHANGEABLE_THUMB') continue
        if (kind && line.kind !== kind) continue
        if (brand && line.manufacturer !== brand) continue
        for (const size of line.sizes) {
            if (clue.size && !sameSize(size.label, clue.size)) continue
            const od64 = size.od64Choices[0]
            if (line.kind === 'THUMB_INSERT' && clue.holeSize64 && !clue.size && size.size64 !== clue.holeSize64) continue
            if (line.kind !== 'THUMB_INSERT' && clue.holeSize64 && size.size64 && size.size64 - clue.holeSize64 < 2 * MIN_WALL64) continue
            options.push({
                gripSizeId: size.id,
                manufacturer: line.manufacturer,
                line: line.name,
                kind: line.kind,
                size64: size.size64,
                label: size.label,
                od64,
                collar: size.collar
            })
        }
    }
    // Smallest that fits first: the usual pick for a slug.
    options.sort((a, b) => (a.size64 ?? 0) - (b.size64 ?? 0))
    return narrowToStock(options, stock)
}
