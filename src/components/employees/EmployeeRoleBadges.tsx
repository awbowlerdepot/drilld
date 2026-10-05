import React from 'react';
import { Employee } from '../../types/employee';
import { getCompanyRoleLabel, getRoleLabel } from '../../utils/EmployeeRoles';

interface EmployeeRoleBadgesProps {
    employee: Employee;
    locationNames: Record<string, string>;
}

/**
 * Company access (if any) followed by the employee's role at each location.
 */
export const EmployeeRoleBadges: React.FC<EmployeeRoleBadgesProps> = ({ employee, locationNames }) => {
    if (!employee.companyRole && employee.memberships.length === 0) {
        return <span className="text-sm text-gray-400">No locations assigned</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {employee.companyRole && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {getCompanyRoleLabel(employee.companyRole)}
                </span>
            )}
            {employee.memberships.map(membership => (
                <span
                    key={membership.locationID}
                    className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700"
                >
                    <span className="font-medium">{getRoleLabel(membership.role)}</span>
                    {' · '}
                    {locationNames[membership.locationID] ?? 'Unknown location'}
                </span>
            ))}
        </div>
    );
};
