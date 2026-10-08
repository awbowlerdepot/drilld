import { cn } from '@/lib/utils'
import type { Customer } from '../../types'
import { likelyMatches } from '../../utils/CustomerMatch'

interface BowlerMatchProps {
    firstName: string
    lastName: string
    customers: Customer[]
    /** The chosen existing customer, or null for a new one. */
    selectedId: string | null
    onSelect: (id: string | null) => void
}

/** Add the sheet to an existing customer who looks like this bowler, or create a new one. */
export const BowlerMatch = ({ firstName, lastName, customers, selectedId, onSelect }: BowlerMatchProps) => {
    const matches = likelyMatches(customers, firstName, lastName)
    if (matches.length === 0) return null
    const option = (id: string | null, title: string, detail?: string) => (
        <button key={id ?? 'new'} type="button" role="radio" aria-checked={selectedId === id} onClick={() => onSelect(id)}
            className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                selectedId === id ? 'border-primary bg-blue-50' : 'border-border bg-white hover:bg-muted')}>
            <span className={cn('size-3.5 shrink-0 rounded-full border-2', selectedId === id ? 'border-primary bg-primary' : 'border-gray-300')} />
            <span className="min-w-0 flex-1">
                <span className="block font-medium text-gray-900">{title}</span>
                {detail && <span className="block truncate text-xs text-gray-500">{detail}</span>}
            </span>
        </button>
    )
    return (
        <div role="radiogroup" aria-label="Customer" className="grid gap-1.5">
            <p className="text-sm text-amber-900">Looks like a customer you already have. Add the sheet to them?</p>
            {matches.map(c => option(c.id, `${c.firstName} ${c.lastName}`,
                [c.phone, c.email, `${c.dominantHand === 'RIGHT' ? 'Right' : 'Left'}-handed`].filter(Boolean).join(' · ')))}
            {option(null, 'No, a new customer')}
        </div>
    )
}
