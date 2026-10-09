import { Badge } from '@/components/ui/badge'
import type { DueState } from '../../../shared/api/equipment'

const STYLES: Record<DueState, { label: string; className: string }> = {
    OVERDUE: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
    DUE: { label: 'Due today', className: 'bg-amber-100 text-amber-900' },
    SOON: { label: 'Due soon', className: 'bg-blue-100 text-blue-800' },
    OK: { label: 'OK', className: 'bg-green-100 text-green-800' },
    NOT_SCHEDULED: { label: 'Not scheduled', className: 'bg-gray-100 text-gray-600' },
    INACTIVE: { label: 'Off', className: 'bg-gray-100 text-gray-500' }
}

/** Overdue, due today, due soon, OK. */
export const DueBadge = ({ due }: { due: DueState }) => <Badge className={STYLES[due].className}>{STYLES[due].label}</Badge>
