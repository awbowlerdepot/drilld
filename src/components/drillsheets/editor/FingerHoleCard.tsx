import { Button } from '@/components/ui/button'
import { fingerOvalCuts, pitchCenter, type PressReadout, type ScreenSide } from '../../../utils/DrillReadouts'
import { format32, format64 } from '../../../utils/Fractions'
import { DetailRow } from '../../pickers/DetailRow'
import { applyInsert, describeInsert } from './insertEdits'
import { OvalReadoutTable } from './OvalReadoutTable'
import { usePicker } from './pickers'
import { VacuControl } from './VacuControl'
import { BevelRow } from './BevelRow'
import { StepDrilling } from './StepDrilling'
import { standardFingerDepth, type GripStyle } from '../../../utils/HoleDepth'
import type { CompanyHoleDepths } from '../../../types/settings'
import type { BevelAmount } from '../../../utils/Bevel'
import { fingerName, type Finger, type SheetEditProps } from './editorTypes'

interface FingerHoleCardProps extends SheetEditProps {
    finger: Finger
    side: ScreenSide
    press: PressReadout
    standardBevel: BevelAmount
    gripStyle: GripStyle
    holeDepths: CompanyHoleDepths
}

/** A finger hole's details: insert, sizes, oval width and its calculated readouts. */
export const FingerHoleCard = ({ spec, edit, readOnly, finger, side, press, locationId, standardBevel, gripStyle, holeDepths }: FingerHoleCardProps) => {
    const open = usePicker()
    const hole = spec.holes[finger]
    const name = `${side === 'LEFT' ? 'Left' : 'Right'} finger · ${fingerName(finger).toLowerCase()}`
    const insert = hole.insert
    const standardDepth = standardFingerDepth(hole, gripStyle, holeDepths)
    const ovalWidth = hole.fingerOval?.width64 ?? null
    const cuts = hole.size64 && ovalWidth ? fingerOvalCuts({ size64: hole.size64, width64: ovalWidth }, side) : []

    const pickInsert = () => open({
        kind: 'insert',
        title: `${name}: insert`,
        locationId,
        value: insert ?? null,
        onSet: value => edit(draft => applyInsert(draft, finger, value))
    })

    const pickBit = (title: string, value: number | null | undefined, onSet: (value: number | null) => void, description?: string) =>
        open({ kind: 'bit64', title, description, value: value ?? null, onSet })

    return (
        <article aria-label={name} className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-5">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[17px] font-semibold">{name}</h2>
                    <p className="text-sm text-gray-600">{insert ? describeInsert(insert) : 'No insert'}</p>
                </div>
                {!readOnly && <Button variant="outline" size="sm" onClick={pickInsert}>{insert ? 'Change insert' : 'Insert'}</Button>}
            </header>

            <DetailRow readOnly={readOnly} label={insert ? 'Insert size' : 'Hole size'}
                hint={insert?.label && insert.label !== format64(hole.size64 ?? 0) ? `Size ${insert.label}` : undefined}
                value={hole.size64 ? format64(hole.size64) : null}
                onClick={() => (insert ? pickInsert() : pickBit(`${name}: hole size`, hole.size64, value => edit(draft => { draft.holes[finger].size64 = value })))} />
            <DetailRow readOnly={readOnly} label="O.D." hint={insert ? 'Set by the insert' : 'Outer hole for an insert'}
                value={hole.outsideDiameter64 ? format64(hole.outsideDiameter64) : null}
                onClick={() => (insert ? pickInsert() : pickBit(`${name}: O.D.`, hole.outsideDiameter64, value => edit(draft => { draft.holes[finger].outsideDiameter64 = value })))} />
            {insert && (
                <VacuControl id={`vacu-${finger}`} od64={insert.od64} vacu={hole.vacu} readOnly={readOnly}
                    onChange={vacu => edit(draft => { draft.holes[finger].vacu = vacu })} />
            )}
            <DetailRow readOnly={readOnly} label="Depth"
                hint={hole.depth32 ? `Set for this hole · standard ${format32(standardDepth)}″` : 'The standard for this hole'}
                value={`${format32(hole.depth32 ?? standardDepth)}″`}
                onClick={() => open({
                    kind: 'length32', title: `${name}: depth`, description: 'Clear to go back to the standard', wholes: [0, 1, 2, 3, 4],
                    value: hole.depth32 ?? standardDepth,
                    onSet: value => edit(draft => { draft.holes[finger].depth32 = value })
                })} />
            {!insert && (
                <StepDrilling holeName={name} steps={hole.drillingSequence} readOnly={readOnly}
                    onChange={steps => edit(draft => { draft.holes[finger].drillingSequence = steps })} />
            )}
            <BevelRow holeName={name} bevel={hole.bevel} standard={standardBevel} readOnly={readOnly}
                onSet={bevel => edit(draft => { draft.holes[finger].bevel = bevel })} />
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

        </article>
    )
}
