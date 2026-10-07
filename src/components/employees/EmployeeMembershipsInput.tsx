import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { canAssignAt, type EmployeeManager } from '../../../shared/api/employees'
import type { EmployeeRole, Location, LocationMembership } from '../../types'
import { EMPLOYEE_ROLE_OPTIONS } from '../../utils/EmployeeRoles'

interface EmployeeMembershipsInputProps {
    locations: Location[]
    memberships: LocationMembership[]
    manager: EmployeeManager
    /** Read-only: shows the roles without letting them change. */
    disabled?: boolean
    onChange: (memberships: LocationMembership[]) => void
}

const NONE = 'NONE'

/**
 * One row per location: the employee's role there, or "Doesn't work here".
 * Locations the manager can't assign at are shown but locked.
 */
export const EmployeeMembershipsInput = ({ locations, memberships, manager, disabled = false, onChange }: EmployeeMembershipsInputProps) => {
    const roleAt = (locationID: string) => memberships.find(m => m.locationID === locationID)?.role

    const setRole = (locationID: string, role: EmployeeRole | undefined) => {
        const others = memberships.filter(m => m.locationID !== locationID)
        onChange(role ? [...others, { locationID, role }] : others)
    }

    // Inactive locations are only listed if the employee still has a role there.
    const shown = locations.filter(location => location.active || roleAt(location.id))

    return (
        <div className="divide-y divide-border rounded-lg border border-border">
            {shown.map(location => {
                const role = roleAt(location.id)
                const locked = disabled || !canAssignAt(manager, location.id)
                return (
                    <div key={location.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                            {location.name}
                            {!location.active && <span className="ml-1 font-normal text-gray-400">(inactive)</span>}
                        </span>
                        <Select value={role ?? NONE} disabled={locked}
                            onValueChange={value => setRole(location.id, value === NONE ? undefined : value as EmployeeRole)}>
                            <SelectTrigger aria-label={`Role at ${location.name}`} className="sm:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE}>Doesn't work here</SelectItem>
                                {EMPLOYEE_ROLE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )
            })}
        </div>
    )
}
