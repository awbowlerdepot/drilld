import { useState } from 'react'
import { cn } from '@/lib/utils'
import { describeBevel, type Bevel, type BevelAmount } from '../../../utils/Bevel'
import { BevelDialog } from './BevelDialog'

interface BevelRowProps {
    holeName: string
    bevel: Bevel | null | undefined
    standard: BevelAmount
    onSet: (bevel: Bevel | null) => void
    readOnly: boolean
}

/** A hole card's bevel: the standard unless set; tap to change. */
export const BevelRow = ({ holeName, bevel, standard, onSet, readOnly }: BevelRowProps) => {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button type="button" disabled={readOnly} onClick={() => setOpen(true)} aria-label={`${holeName} bevel: ${describeBevel(bevel, standard)}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-left text-sm text-gray-700 hover:border-primary disabled:hover:border-border">
                <span className="flex flex-col">
                    Bevel
                    <span className="text-xs text-gray-500">Top edge, finished at the bench</span>
                </span>
                <span className={cn('text-right text-sm', bevel ? 'font-semibold text-primary' : 'text-gray-500')}>
                    {describeBevel(bevel, standard)}
                </span>
            </button>
            {open && <BevelDialog title={`${holeName}: bevel`} bevel={bevel} standard={standard} onSet={onSet} onClose={() => setOpen(false)} />}
        </>
    )
}
