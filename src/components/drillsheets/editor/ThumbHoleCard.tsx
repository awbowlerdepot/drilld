import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { pitchCenter, thumbOvalCuts, type PressReadout } from '../../../utils/DrillReadouts'
import { format64, formatDecimal } from '../../../utils/Fractions'
import { DetailRow } from './DetailRow'
import { OvalReadoutTable } from './OvalReadoutTable'
import { useGripCatalog } from '../../../hooks/useGripCatalog'
import { applyThumbHardware, describeThumbHardware, MIN_WALL64, thumbWall64 } from './insertEdits'
import { usePicker } from './pickers'
import type { SheetEditProps } from './editorTypes'

interface ThumbHoleCardProps extends SheetEditProps {
    press: PressReadout
}

type OvalField = 'pilotHole64' | 'width64' | 'angleDegrees'

/** The thumb's details: hardware, sizes, the oval measured with bits, and its calculated cuts. */
export const ThumbHoleCard = ({ spec, edit, readOnly, hand, press, locationId }: ThumbHoleCardProps) => {
    const open = usePicker()
    const catalog = useGripCatalog()
    const thumb = spec.holes.thumb
    const hardware = thumb.hardware
    const oval = thumb.oval
    const cuts = oval && oval.width64 > oval.pilotHole64 ? thumbOvalCuts(oval, hand) : []

    // The oval is stored whole; until all three are set, keep the partial entry here.
    const [partialOval, setPartialOval] = useState<Partial<Record<OvalField, number>>>({})
    const ovalValue = (field: OvalField) => oval?.[field] ?? partialOval[field] ?? null
    const setOvalField = (field: OvalField, value: number | null) => {
        const next = { pilotHole64: ovalValue('pilotHole64'), width64: ovalValue('width64'), angleDegrees: ovalValue('angleDegrees'), [field]: value }
        if (next.pilotHole64 !== null && next.width64 !== null && next.angleDegrees !== null && next.width64 > next.pilotHole64) {
            edit(draft => { draft.holes.thumb.oval = { pilotHole64: next.pilotHole64!, width64: next.width64!, angleDegrees: next.angleDegrees! } })
            setPartialOval({})
        } else {
            if (oval) edit(draft => { draft.holes.thumb.oval = null })
            setPartialOval(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== null)))
        }
    }

    const pickBit = (title: string, value: number | null | undefined, onSet: (value: number | null) => void, description?: string, hardwareFirst?: boolean) =>
        open({ kind: 'bit64', title, description, hardwareFirst, value: value ?? null, onSet })

    const pickHardware = () => open({
        kind: 'thumbHardware',
        title: 'Thumb hardware',
        locationId,
        value: hardware ?? null,
        onSet: value => edit(draft => applyThumbHardware(draft, value))
    })

    // A hole drilled into a slug or inner needs 1/8" of wall all around; otherwise go up a size.
    const wall = thumbWall64(hardware, thumb.size64, thumb.oval?.width64)
    const thinWall = wall !== null && wall < MIN_WALL64
    const hole = thumb.oval?.width64 ?? thumb.size64 ?? 0
    const nextSizeUp = thinWall && hardware?.gripSizeId
        ? catalog.lines.find(line => line.sizes.some(size => size.id === hardware.gripSizeId))?.sizes
            .find(size => size.size64 > (hardware.size64 ?? 0) && (size.size64 - hole) / 2 >= MIN_WALL64)
        : undefined

    const angle = ovalValue('angleDegrees')
    const pilot = ovalValue('pilotHole64')
    const width = ovalValue('width64')

    return (
        <article aria-label="Thumb" className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-5">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[17px] font-semibold">Thumb</h2>
                    <p className="text-sm text-gray-600">{hardware ? describeThumbHardware(hardware) : 'No hardware'}</p>
                </div>
                {!readOnly && <Button variant="outline" size="sm" onClick={pickHardware}>{hardware ? 'Change hardware' : 'Hardware'}</Button>}
            </header>

            <DetailRow readOnly={readOnly} label="Hole size"
                hint={hardware?.kind === 'THUMB_INSERT' ? 'Set by the thumb insert' : hardware ? `Drilled into the ${hardware.kind === 'THUMB_SLUG' ? 'slug' : 'inner'}` : undefined}
                value={thumb.size64 ? format64(thumb.size64) : null}
                onClick={() => (hardware?.kind === 'THUMB_INSERT'
                    ? pickHardware()
                    : pickBit('Thumb: hole size', thumb.size64, value => edit(draft => { draft.holes.thumb.size64 = value })))} />
            <DetailRow readOnly={readOnly} label={hardware?.collar ? 'Collar bit' : 'O.D.'}
                hint={hardware ? 'Set by the hardware' : 'Outer hole for a slug or insert'}
                value={thumb.outsideDiameter64 ? format64(thumb.outsideDiameter64) : null}
                onClick={() => (hardware
                    ? pickHardware()
                    : pickBit('Thumb: O.D.', thumb.outsideDiameter64, value => edit(draft => { draft.holes.thumb.outsideDiameter64 = value }), 'The outer hole for a slug or insert', true))} />
            {thinWall && (
                <p className="text-xs text-amber-700">
                    Only {formatDecimal(Math.max(0, wall!) / 64)}″ of wall around the hole (1/8″ minimum).
                    {nextSizeUp ? ` Go up to ${format64(nextSizeUp.size64)}″.` : ' Go up a size.'}
                </p>
            )}

            <div className="space-y-1.5">
                <span className="text-[13px] font-semibold text-gray-700">Oval, measured with bits</span>
                <div className="grid grid-cols-3 gap-2">
                    <DetailRow stacked readOnly={readOnly} label="Pilot" value={pilot ? format64(pilot) : null}
                        onClick={() => pickBit('Thumb oval: pilot', pilot, value => setOvalField('pilotHole64', value), 'The bit that fits the narrow side')} />
                    <DetailRow stacked readOnly={readOnly} label="Width" value={width ? format64(width) : null}
                        onClick={() => pickBit('Thumb oval: width', width, value => setOvalField('width64', value), 'The bit that fits the wide side')} />
                    <DetailRow stacked readOnly={readOnly} label="Angle" value={angle !== null ? `${angle}°` : null}
                        onClick={() => open({
                            kind: 'number', title: 'Thumb oval: angle', description: 'From horizontal: 0° is across, 90° is up and down. Mirrors for left-handers.',
                            unit: 'Degrees', min: 0, max: 90, step: 1, value: angle,
                            onSet: value => setOvalField('angleDegrees', value)
                        })} />
                </div>
                {Object.keys(partialOval).length > 0 && (
                    <p className="text-xs text-amber-700">Set the pilot, a wider width and the angle to calculate the cuts.</p>
                )}
            </div>

            {cuts.length > 0 && (
                <OvalReadoutTable label="Thumb cuts" center={pitchCenter('THUMB', thumb.pitch)} cuts={cuts} centerIndex={cuts.length / 2} press={press}
                    note={`From the thumb pitch center: farthest ${hand === 'RIGHT' ? 'up-left' : 'up-right'} first, through center, out to the farthest ${hand === 'RIGHT' ? 'down-right' : 'down-left'}. Never more than 1/32 per cut.`} />
            )}

        </article>
    )
}
