import { Badge } from '@/components/ui/badge'
import type { Employee } from '../../types'
import { getCompanyRoleLabel, getRoleLabel } from '../../utils/EmployeeRoles'

interface EmployeeRoleBadgesProps {
    employee: Employee
    locationNames: Record<string, string>
}

/** Company access (if any), then the employee's role at each location. */
export const EmployeeRoleBadges = ({ employee, locationNames }: EmployeeRoleBadgesProps) => {
    if (!employee.companyRole && employee.memberships.length === 0) {
        return <span className="text-sm text-gray-400">No locations</span>
    }
    return (
        <div className="flex flex-wrap gap-1">
            {employee.companyRole && (
                <Badge className="bg-purple-100 text-purple-800">{getCompanyRoleLabel(employee.companyRole)}</Badge>
            )}
            {employee.memberships.map(membership => (
                <Badge key={membership.locationID} variant="outline" className="font-normal text-gray-700">
                    <span className="font-medium">{getRoleLabel(membership.role)}</span>
                    <span className="text-gray-500">· {locationNames[membership.locationID] ?? 'Unknown location'}</span>
                </Badge>
            ))}
        </div>
    )
}
