import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { fingerOvalCuts, pitchCenter, type PressReadout, type ScreenSide } from '../../../utils/DrillReadouts'
import { format64 } from '../../../utils/Fractions'
import { DetailRow } from './DetailRow'
import { InsertDialog } from './InsertDialog'
import { OvalReadoutTable } from './OvalReadoutTable'
import { usePicker } from './pickers'
import { fingerName, type Finger, type SheetEditProps } from './editorTypes'

interface FingerHoleCardProps extends SheetEditProps {
    finger: Finger
    side: ScreenSide
    press: PressReadout
}

/** A finger hole's details: insert, sizes, oval width and its calculated readouts. */
export const FingerHoleCard = ({ spec, edit, readOnly, finger, side, press }: FingerHoleCardProps) => {
    const open = usePicker()
    const [editingInsert, setEditingInsert] = useState(false)
    const hole = spec.holes[finger]
    const name = `${side === 'LEFT' ? 'Left' : 'Right'} finger · ${fingerName(finger).toLowerCase()}`
    const insert = hole.insert
    const ovalWidth = hole.fingerOval?.width64 ?? null
    const cuts = hole.size64 && ovalWidth ? fingerOvalCuts({ size64: hole.size64, width64: ovalWidth }, side) : []

    const pickBit = (title: string, value: number | null | undefined, onSet: (value: number | null) => void, description?: string) =>
        open({ kind: 'bit64', title, description, value: value ?? null, onSet })

    return (
        <article aria-label={name} className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-5">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[17px] font-semibold">{name}</h2>
                    <p className="text-sm text-gray-600">
                        {insert ? `${[insert.manufacturer, insert.type].filter(Boolean).join(' ')} insert` : 'No insert'}
                    </p>
                </div>
                {!readOnly && <Button variant="outline" size="sm" onClick={() => setEditingInsert(true)}>Insert</Button>}
            </header>

            <DetailRow readOnly={readOnly} label={insert ? 'Insert size' : 'Hole size'}
                value={hole.size64 ? format64(hole.size64) : null}
                onClick={() => pickBit(`${name}: hole size`, hole.size64, value => edit(draft => { draft.holes[finger].size64 = value }))} />
            <DetailRow readOnly={readOnly} label="O.D." hint="Outer hole for the insert"
                value={hole.outsideDiameter64 ? format64(hole.outsideDiameter64) : null}
                onClick={() => pickBit(`${name}: O.D.`, hole.outsideDiameter64, value => edit(draft => { draft.holes[finger].outsideDiameter64 = value }))} />
            <DetailRow readOnly={readOnly} label="Oval width" hint="Bit that fits across; height is the hole size"
                value={ovalWidth ? format64(ovalWidth) : null}
                onClick={() => pickBit(`${name}: oval width`, ovalWidth,
                    value => edit(draft => { draft.holes[finger].fingerOval = value ? { width64: value } : null }),
                    'The bit that fits the hole across. Cuts go away from the bridge.')} />

            {ovalWidth !== null && hole.size64 && ovalWidth <= hole.size64 && (
                <p className="text-xs text-amber-700">The oval width must be wider than the hole, or the sheet can't be saved.</p>
            )}

            {cuts.length > 0 && (
                <OvalReadoutTable label={`${name} cuts`} center={pitchCenter('FINGER', hole.pitch)} cuts={cuts} centerIndex={0} press={press}
                    note={`From the finger pitch center, ${cuts.length} cut${cuts.length > 1 ? 's' : ''} ${side === 'LEFT' ? 'left' : 'right'}, away from the bridge. Never more than 1/32 per cut.`} />
            )}

            {editingInsert && (
                <InsertDialog title={`${name}: insert`} insert={insert}
                    onSet={value => edit(draft => { draft.holes[finger].insert = value })}
                    onClose={() => setEditingInsert(false)} />
            )}
        </article>
    )
}
