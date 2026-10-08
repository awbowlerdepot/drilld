import { cn } from '@/lib/utils'
import { format64 } from '../../utils/Fractions'
import type { GripCandidates, HardwareChoice, InsertChoice } from '../../utils/PaperGripMatch'
import { describeInsert, describeThumbHardware } from '../drillsheets/editor/insertEdits'

interface GripChoiceProps<T extends InsertChoice | HardwareChoice> {
    title: string
    /** What the sheet said, e.g. "7.5 · Lift". */
    clue: string
    candidates: GripCandidates<T>
    selectedId: string | null
    onSelect: (gripSizeId: string | null) => void
}

const MAX_SHOWN = 8

const describe = (option: InsertChoice | HardwareChoice) =>
    'kind' in option ? describeThumbHardware(option) : describeInsert(option)

/**
 * The inserts or hardware the sheet could mean, narrowed to what the location
 * carries. One is picked for you when only one fits; otherwise choose, or
 * leave it for the editor.
 */
export const GripChoice = <T extends InsertChoice | HardwareChoice>({ title, clue, candidates, selectedId, onSelect }: GripChoiceProps<T>) => {
    const { options, outsideStock } = candidates
    const shown = options.slice(0, MAX_SHOWN)
    const option = (id: string | null, label: string, detail?: string) => (
        <button key={id ?? 'later'} type="button" role="radio" aria-checked={selectedId === id} onClick={() => onSelect(id)}
            className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors',
                selectedId === id ? 'border-primary bg-blue-50' : 'border-border bg-white hover:bg-muted')}>
            <span className={cn('size-3.5 shrink-0 rounded-full border-2', selectedId === id ? 'border-primary bg-primary' : 'border-gray-300')} />
            <span className="min-w-0 flex-1">
                <span className="block text-gray-900">{label}</span>
                {detail && <span className="block text-xs text-gray-500">{detail}</span>}
            </span>
        </button>
    )
    return (
        <div role="radiogroup" aria-label={title} className="grid gap-1.5">
            <p className="text-sm">
                <span className="font-medium">{title}</span> <span className="text-gray-500">· the sheet says {clue}</span>
            </p>
            {options.length === 0 ? (
                <p className="text-sm text-amber-900">Nothing in the grip catalog fits; pick it in the editor.</p>
            ) : (
                <>
                    {outsideStock && <p className="text-xs text-amber-900">Nothing this location carries fits, so these are from the whole catalog.</p>}
                    {options.length > 1 && <p className="text-xs text-gray-500">{options.length} could fit{options.length > MAX_SHOWN ? `; showing ${MAX_SHOWN}` : ''}. Pick one:</p>}
                    {shown.map(o => option(o.gripSizeId ?? null, describe(o), [o.label ? `size ${o.label}` : null, `O.D. ${format64(o.od64)}″`].filter(Boolean).join(' · ')))}
                    {option(null, 'Decide in the editor')}
                </>
            )}
        </div>
    )
}
