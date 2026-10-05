import React from 'react';
import { Location } from '../../types';
import { EmployeeRole, LocationMembership } from '../../types/employee';
import { EMPLOYEE_ROLE_OPTIONS } from '../../utils/EmployeeRoles';

interface EmployeeMembershipsInputProps {
    locations: Location[];
    memberships: LocationMembership[];
    onChange: (memberships: LocationMembership[]) => void;
    error?: string;
}

/**
 * One row per location: whether the employee works there, and their role there.
 */
export const EmployeeMembershipsInput: React.FC<EmployeeMembershipsInputProps> = ({
                                                                                      locations,
                                                                                      memberships,
                                                                                      onChange,
                                                                                      error
                                                                                  }) => {
    const roleAt = (locationID: string) =>
        memberships.find(membership => membership.locationID === locationID)?.role;

    const setRole = (locationID: string, role: EmployeeRole | undefined) => {
        const others = memberships.filter(membership => membership.locationID !== locationID);
        onChange(role ? [...others, { locationID, role }] : others);
    };

    // Inactive locations are only listed if the employee is still assigned there.
    const visibleLocations = locations.filter(location => location.active || roleAt(location.id));

    return (
        <div>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {visibleLocations.map(location => {
                    const role = roleAt(location.id);
                    const checkboxId = `membership-${location.id}`;

                    return (
                        <div key={location.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                            <label htmlFor={checkboxId} className="flex items-center flex-1 min-w-0">
                                <input
                                    id={checkboxId}
                                    type="checkbox"
                                    checked={role !== undefined}
                                    onChange={(e) => setRole(location.id, e.target.checked ? 'TECHNICIAN' : undefined)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900 truncate">
                                    {location.name}
                                    {!location.active && <span className="ml-1 text-gray-400">(inactive)</span>}
                                </span>
                            </label>
                            <select
                                aria-label={`Role at ${location.name}`}
                                value={role ?? ''}
                                onChange={(e) => setRole(location.id, e.target.value as EmployeeRole)}
                                disabled={role === undefined}
                                className="sm:w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                {role === undefined && <option value="">Not assigned</option>}
                                {EMPLOYEE_ROLE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
