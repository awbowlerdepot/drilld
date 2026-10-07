import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DrillSheetSpec } from '../../../../shared/api/drillSheetSpec'
import { format32, format64 } from '../../../utils/Fractions'
import { usePicker } from './pickers'

type Sequence = NonNullable<DrillSheetSpec['holes']['thumb']['drillingSequence']>

interface StepDrillingProps {
    holeName: string
    steps: Sequence | null | undefined
    onChange: (steps: Sequence | null) => void
    readOnly: boolean
}

/**
 * Step drilling for a hole without an insert or hardware: like a vacu, but
 * any number of steps, each a bit to a depth, drilled in order before the hole.
 */
export const StepDrilling = ({ holeName, steps, onChange, readOnly }: StepDrillingProps) => {
    const open = usePicker()
    const list = steps ?? []
    const renumber = (next: Sequence) => onChange(next.length ? next.map((step, index) => ({ ...step, step: index + 1 })) : null)

    const pickBit = (index: number | null) => open({
        kind: 'bit64',
        title: `${holeName}: step ${index === null ? list.length + 1 : index + 1} bit`,
        value: index === null ? null : list[index].bitSize64,
        onSet: value => {
            if (value === null) {
                if (index !== null) renumber(list.filter((_, i) => i !== index))
                return
            }
            if (index === null) renumber([...list, { step: list.length + 1, bitSize64: value, depth32: null, notes: null }])
            else renumber(list.map((step, i) => (i === index ? { ...step, bitSize64: value } : step)))
        }
    })

    const pickDepth = (index: number) => open({
        kind: 'length32',
        title: `${holeName}: step ${index + 1} depth`,
        wholes: [0, 1, 2, 3],
        value: list[index].depth32 ?? null,
        onSet: value => renumber(list.map((step, i) => (i === index ? { ...step, depth32: value } : step)))
    })

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-gray-700">Step drilling</span>
                {!readOnly && (
                    <Button variant="ghost" size="sm" onClick={() => pickBit(null)}>
                        <Plus data-icon="inline-start" /> Step
                    </Button>
                )}
            </div>
            {list.length === 0 ? (
                <p className="text-xs text-gray-500">None. Like a vacu, but any number of steps, drilled before the hole.</p>
            ) : (
                <ol className="space-y-1">
                    {list.map((step, index) => (
                        <li key={index} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm">
                            <span className="w-12 text-gray-500">Step {index + 1}</span>
                            <button type="button" disabled={readOnly} onClick={() => pickBit(index)}
                                className="rounded px-1.5 py-1 font-mono font-semibold text-primary hover:bg-blue-50">
                                {format64(step.bitSize64)}″
                            </button>
                            <span className="text-gray-400">to</span>
                            <button type="button" disabled={readOnly} onClick={() => pickDepth(index)}
                                className="rounded px-1.5 py-1 font-mono font-semibold text-primary hover:bg-blue-50">
                                {step.depth32 ? `${format32(step.depth32)}″` : <span className="font-sans font-normal text-gray-400">depth</span>}
                            </button>
                            {!readOnly && (
                                <button type="button" aria-label={`Remove step ${index + 1}`} onClick={() => renumber(list.filter((_, i) => i !== index))}
                                    className="ml-auto rounded p-1 text-gray-400 hover:bg-muted hover:text-gray-700">
                                    <X className="size-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}
