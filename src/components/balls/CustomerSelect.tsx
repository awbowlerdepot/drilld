import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer } from '../../types'

interface CustomerSelectProps {
    id: string
    customers: Customer[]
    value: string | null
    onChange: (customerId: string) => void
    /** Left out of the list (e.g. the current owner). */
    exclude?: string
}

/** Pick a bowler, by last name. */
export const CustomerSelect = ({ id, customers, value, onChange, exclude }: CustomerSelectProps) => (
    <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Pick a customer" /></SelectTrigger>
        <SelectContent>
            {[...customers].filter(c => c.id !== exclude)
                .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
                .map(c => <SelectItem key={c.id} value={c.id}>{c.lastName}, {c.firstName}</SelectItem>)}
        </SelectContent>
    </Select>
)
