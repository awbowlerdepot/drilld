import { useState } from 'react'
import { cn } from '@/lib/utils'
import { collarBitName } from '../../../utils/DrillBits'
import { format32 } from '../../../utils/Fractions'
import { HoleCircle } from './HoleCircle'
import { applyInsert, applyThumbHardware, describeInsert, describeThumbHardware } from './insertEdits'
import { ScaledCanvas } from './ScaledCanvas'
import { ValueBox } from './ValueBox'
import { usePicker } from './pickers'
import { SPAN_TYPES, defaultSpanType, fingerName, fingersBySide, spanKey, spanTypeRecorded, type Finger, type SheetEditProps, type SpanType } from './editorTypes'

// The drill sheet the way shops draw it (canvas design D): finger holes side
// by side with their pitches outside them, bridge between, spans below, and
// the thumb at the bottom. Every value is tappable. Positions are on an
// 820 × 920 canvas that scales down on small screens.

// Fit first, then the edge measurements.
const SPAN_COLUMN = [...SPAN_TYPES.filter(t => t.key === 'fit32'), ...SPAN_TYPES.filter(t => t.key !== 'fit32')]

const WIDTH = 820
const HEIGHT = 920
const PITCH_WHOLES = [0, 1]

const ARROWS: [number, number, number, number][] = [
    [266, 402, 252, 320], [567, 402, 580, 320], [296, 512, 356, 664], [537, 512, 476, 664],
    [66, 110, 66, 84], [66, 368, 66, 394], [60, 239, 34, 239],
    [754, 110, 754, 84], [754, 368, 754, 394], [760, 239, 786, 239],
    [416, 565, 416, 540], [416, 900, 416, 916], [205, 731, 181, 731], [626, 731, 650, 731]
]

const at = (left: number, top: number, width?: number, height?: number) =>
    ({ position: 'absolute' as const, left, top, width, height })

/** A small caption at a position on the canvas. */
const caption = (left: number, top: number, text: string) => (
    <span className="absolute text-sm text-gray-700" style={{ left, top }}>{text}</span>
)

export const HoleLayout = ({ spec, edit, readOnly, hand, locationId }: SheetEditProps) => {
    const open = usePicker()
    // Follows the sheet (hardware, inserts, what's recorded) until a type is picked.
    const [pickedSpanType, setSpanType] = useState<SpanType | null>(null)
    const spanType = pickedSpanType ?? defaultSpanType(spec)
    const [selectedSpan, setSelectedSpan] = useState<Finger | null>(null)
    const sides = fingersBySide(hand)
    const thumb = spec.holes.thumb

    /** Opens a pitch picker; `direction` is the tapped box's (0 = reverse/left, 1 = forward/right). */
    const pickPitch = (title: string, hole: 'thumb' | Finger, axis: 'forward32' | 'lateral32', direction?: 0 | 1) => open({
        kind: 'length32',
        title,
        direction,
        description: axis === 'forward32' ? 'Pitch in inches' : 'Lateral pitch in inches',
        directions: axis === 'forward32' ? ['Reverse', 'Forward'] : ['Left', 'Right'],
        wholes: PITCH_WHOLES,
        value: spec.holes[hole].pitch[axis] ?? null,
        onSet: value => edit(draft => { draft.holes[hole].pitch[axis] = value })
    })

    const pickBit = (title: string, hole: 'thumb' | Finger, field: 'size64' | 'outsideDiameter64') => open({
        kind: 'bit64',
        title,
        // The thumb's O.D. is usually drilled for interchangeable hardware.
        hardwareFirst: hole === 'thumb' && field === 'outsideDiameter64',
        value: spec.holes[hole][field] ?? null,
        onSet: value => edit(draft => { draft.holes[hole][field] = value })
    })

    const pickSpan = (finger: Finger) => {
        setSelectedSpan(finger)
        const type = SPAN_TYPES.find(t => t.key === spanType)!
        open({
            kind: 'length32',
            title: `Thumb to ${fingerName(finger).toLowerCase()} span`,
            description: `${type.label} span: ${type.description}`,
            wholes: [2, 3, 4, 5, 6],
            value: spec.spans[spanKey(finger)][spanType] ?? null,
            onSet: value => edit(draft => { draft.spans[spanKey(finger)][spanType] = value })
        })
    }

    /** Reverse above, lateral in the middle, forward below: the pitch column beside a finger hole. */
    const fingerPitch = (finger: Finger, left: number) => {
        const { forward32, lateral32 } = spec.holes[finger].pitch
        const name = `${fingerName(finger)} finger`
        const boxClass = 'h-[70px] w-[116px]'
        return (
            <>
                {caption(left + 16, 88, 'Reverse')}
                <ValueBox label={`${name} reverse pitch`} readOnly={readOnly} className={boxClass} style={at(left, 110)}
                    value={forward32 && forward32 < 0 ? format32(-forward32) : null}
                    onClick={() => pickPitch(`${name} pitch`, finger, 'forward32', 0)} />
                <ValueBox label={`${name} lateral pitch`} readOnly={readOnly} className={boxClass} style={at(left, 204)}
                    value={lateral32 ? format32(Math.abs(lateral32)) : null}
                    onClick={() => pickPitch(`${name} lateral pitch`, finger, 'lateral32')} />
                {caption(left + 16, 278, lateral32 ? (lateral32 < 0 ? 'Left' : 'Right') : 'Lateral')}
                <ValueBox label={`${name} forward pitch`} readOnly={readOnly} className={boxClass} style={at(left, 298)}
                    value={forward32 && forward32 > 0 ? format32(forward32) : null}
                    onClick={() => pickPitch(`${name} pitch`, finger, 'forward32', 1)} />
                {caption(left + 16, 372, 'Forward')}
            </>
        )
    }

    const pickInsert = (finger: Finger) => open({
        kind: 'insert',
        title: `${fingerName(finger)} finger insert`,
        locationId,
        value: spec.holes[finger].insert ?? null,
        onSet: insert => edit(draft => applyInsert(draft, finger, insert))
    })

    const pickThumbHardware = () => open({
        kind: 'thumbHardware',
        title: 'Thumb hardware',
        locationId,
        value: spec.holes.thumb.hardware ?? null,
        onSet: hardware => edit(draft => applyThumbHardware(draft, hardware))
    })

    const fingerHole = (finger: Finger, left: number) => {
        const hole = spec.holes[finger]
        const name = `${fingerName(finger)} finger`
        // With an insert, its size and O.D. come from the insert: tapping either opens the insert picker.
        return (
            <>
                <button type="button" disabled={readOnly} onClick={() => pickInsert(finger)}
                    className="absolute flex h-[42px] w-[160px] items-end justify-center text-center text-[13px] font-medium leading-tight text-primary hover:underline disabled:no-underline"
                    style={at(left - 4, 118)}>
                    {hole.insert ? describeInsert(hole.insert) : 'No insert'}
                </button>
                <HoleCircle left={left} top={164}
                    upper={{ label: 'O.D.', value: hole.outsideDiameter64, onClick: () => (hole.insert ? pickInsert(finger) : pickBit(`${name} O.D.`, finger, 'outsideDiameter64')) }}
                    lower={{ label: hole.insert ? 'Insert size' : 'Hole size', value: hole.size64, onClick: () => (hole.insert ? pickInsert(finger) : pickBit(`${name} hole size`, finger, 'size64')) }}
                    readOnly={readOnly} name={name} />
            </>
        )
    }

    const activeType = SPAN_TYPES.find(t => t.key === spanType)!

    const spanBox = (finger: Finger, left: number) => {
        const span = spec.spans[spanKey(finger)]
        const value = span[spanType]
        const others = SPAN_TYPES.filter(t => t.key !== spanType && span[t.key])
        return (
            <ValueBox label={`Thumb to ${fingerName(finger).toLowerCase()} span`} readOnly={readOnly}
                selected={selectedSpan === finger} className="h-[110px] w-[196px]" style={at(left, 402)}
                value={value ? `${format32(value)}` : null} onClick={() => pickSpan(finger)}>
                <span className="font-sans text-xs font-medium text-gray-500">{activeType.label}</span>
                {others.length > 0 && (
                    <span className="text-[13px] font-medium text-gray-600">
                        {others.map(t => `${t.short} ${format32(span[t.key]!)}`).join(' · ')}
                    </span>
                )}
            </ValueBox>
        )
    }

    const flexibility = spec.fitting.flexibilityDegrees
    // Norm warnings are off for a pro fit, which breaks the norms on purpose.
    const flexibilityOutsideNorm = flexibility != null && !spec.fitting.proFit && (flexibility < 70 || flexibility > 135)
    const thumbLateral = thumb.pitch.lateral32 ?? 0
    const thumbForward = thumb.pitch.forward32 ?? 0

    return (
        <ScaledCanvas width={WIDTH} height={HEIGHT}>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} aria-hidden="true" className="absolute inset-0">
                <defs>
                    <marker id="drill-sheet-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                        <path d="M0 0 L10 5 L0 10 z" fill="#1F2937" />
                    </marker>
                </defs>
                <g stroke="#1F2937" strokeWidth="2" fill="none" markerEnd="url(#drill-sheet-arrow)">
                    {ARROWS.map(([x1, y1, x2, y2]) => <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />)}
                </g>
            </svg>

            {fingerPitch(sides.left, 60)}
            {fingerPitch(sides.right, 644)}
            {fingerHole(sides.left, 193)}
            {fingerHole(sides.right, 486)}

            <ValueBox label="Bridge, edge to edge" readOnly={readOnly} className="h-16 w-28" style={at(360, 208)}
                value={spec.bridge.distance32 != null ? format32(spec.bridge.distance32) : null}
                onClick={() => open({
                    kind: 'length32', title: 'Bridge', description: 'Edge to edge, between the finger holes',
                    wholes: [0, 1], value: spec.bridge.distance32 ?? null,
                    onSet: value => edit(draft => { draft.bridge.distance32 = value })
                })} />
            {caption(392, 278, 'Bridge')}

            {/* Span type: a column down the middle, Fit on top. */}
            <div role="radiogroup" aria-label="Span type shown" className="absolute flex flex-col items-center gap-1.5" style={{ left: 396, top: 308 }}>
                {SPAN_COLUMN.map(type => {
                    // Selected: solid. Recorded: tinted with a solid border. Blank: dashed and muted.
                    const recorded = spanTypeRecorded(spec, type.key)
                    return (
                        <button key={type.key} type="button" role="radio" aria-checked={spanType === type.key}
                            aria-label={`${type.label}: ${type.description}${recorded ? '' : ' (not recorded)'}`}
                            title={`${type.label}: ${type.description}${recorded ? '' : ' (not recorded)'}`}
                            onClick={() => setSpanType(type.key)}
                            className={cn('size-10 rounded-full text-[15px] font-semibold transition-colors',
                                spanType === type.key
                                    ? cn('bg-primary text-primary-foreground', !recorded && 'ring-2 ring-primary/30 ring-offset-1')
                                    : recorded
                                        ? 'border-2 border-primary bg-blue-50 text-primary hover:bg-blue-100'
                                        : 'border-[1.5px] border-dashed border-slate-300 bg-white text-gray-400 hover:bg-muted')}>
                            {type.short}
                        </button>
                    )
                })}
            </div>

            {spanBox(sides.left, 176)}
            {spanBox(sides.right, 461)}

            <span className="absolute text-lg font-medium text-gray-900" style={at(196, 590)}>Flexibility</span>
            <button type="button" disabled={readOnly} aria-label="Flexibility"
                className="absolute h-[34px] w-[104px] border-b-2 border-dashed border-gray-400 font-mono text-xl font-semibold text-primary"
                style={at(188, 610)}
                onClick={() => open({
                    kind: 'number', title: 'Flexibility', description: 'Hand spread angle; 70–135° is typical',
                    unit: 'Degrees', min: 0, max: 180, step: 1, value: spec.fitting.flexibilityDegrees ?? null,
                    onSet: value => edit(draft => { draft.fitting.flexibilityDegrees = value })
                })}>
                {spec.fitting.flexibilityDegrees != null ? `${spec.fitting.flexibilityDegrees}°` : ''}
            </button>

            {flexibilityOutsideNorm && (
                <span className="absolute text-xs text-amber-700" style={at(188, 648)}>Outside the usual 70–135°</span>
            )}

            <span className="absolute text-lg font-medium text-gray-900" style={at(548, 590)}>Thumb hardware</span>
            <button type="button" disabled={readOnly} onClick={pickThumbHardware}
                className="absolute w-[230px] text-left text-[15px] font-medium leading-tight text-primary hover:underline disabled:no-underline"
                style={at(548, 616)}>
                {thumb.hardware ? describeThumbHardware(thumb.hardware) : 'None'}
            </button>

            <ValueBox label="Thumb forward pitch" readOnly={readOnly} className="h-[70px] w-28" style={at(360, 565)}
                value={thumbForward > 0 ? format32(thumbForward) : null}
                onClick={() => pickPitch('Thumb pitch', 'thumb', 'forward32', 1)} />
            {caption(386, 640, 'Forward')}
            <HoleCircle left={340} top={659} readOnly={readOnly} name="Thumb"
                upper={{ label: thumb.hardware?.collar ? collarBitName(thumb.hardware).replace(' bit', '') : 'O.D.', value: thumb.outsideDiameter64,
                    onClick: () => (thumb.hardware ? pickThumbHardware() : pickBit('Thumb O.D.', 'thumb', 'outsideDiameter64')) }}
                lower={{ label: 'Hole size', value: thumb.size64,
                    onClick: () => (thumb.hardware?.kind === 'THUMB_INSERT' ? pickThumbHardware() : pickBit('Thumb hole size', 'thumb', 'size64')) }} />
            <ValueBox label="Thumb lateral pitch, left" readOnly={readOnly} className="h-[70px] w-[113px]" style={at(205, 696)}
                value={thumbLateral < 0 ? format32(-thumbLateral) : null}
                onClick={() => pickPitch('Thumb lateral pitch', 'thumb', 'lateral32', 0)} />
            {caption(248, 772, 'Left')}
            <ValueBox label="Thumb lateral pitch, right" readOnly={readOnly} className="h-[70px] w-[113px]" style={at(513, 696)}
                value={thumbLateral > 0 ? format32(thumbLateral) : null}
                onClick={() => pickPitch('Thumb lateral pitch', 'thumb', 'lateral32', 1)} />
            {caption(550, 772, 'Right')}
            {caption(388, 812, 'Reverse')}
            <ValueBox label="Thumb reverse pitch" readOnly={readOnly} className="h-[70px] w-28" style={at(360, 830)}
                value={thumbForward < 0 ? format32(-thumbForward) : null}
                onClick={() => pickPitch('Thumb pitch', 'thumb', 'forward32', 0)} />
        </ScaledCanvas>
    )
}
