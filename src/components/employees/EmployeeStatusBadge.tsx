import { Badge } from '@/components/ui/badge'
import type { EmployeeStatus } from '../../types'

const STATUS: Record<EmployeeStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
    INVITED: { label: 'Invited', className: 'bg-amber-100 text-amber-900' },
    INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600' }
}

/** Active (has signed in), Invited (hasn't yet) or Inactive (can't sign in). */
export const EmployeeStatusBadge = ({ status }: { status: EmployeeStatus }) => (
    <Badge className={STATUS[status].className}>{STATUS[status].label}</Badge>
)
