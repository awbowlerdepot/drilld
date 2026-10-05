import {
    CompanyRole,
    DEFAULT_PERMISSIONS_BY_ROLE,
    Employee,
    EmployeeRole,
    PERMISSION_CATEGORIES
} from '../types/employee';

/** Location job roles, most senior first. */
export const EMPLOYEE_ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'SENIOR_TECH', label: 'Senior Tech' },
    { value: 'TECHNICIAN', label: 'Technician' },
    { value: 'APPRENTICE', label: 'Apprentice' }
];

export const COMPANY_ROLE_OPTIONS: { value: CompanyRole; label: string }[] = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'ADMIN', label: 'Admin' }
];

const ALL_PERMISSIONS: string[] = Object.values(PERMISSION_CATEGORIES).flat();

export const getRoleLabel = (role: EmployeeRole): string =>
    EMPLOYEE_ROLE_OPTIONS.find(option => option.value === role)?.label ?? role;

export const getCompanyRoleLabel = (role: CompanyRole): string =>
    COMPANY_ROLE_OPTIONS.find(option => option.value === role)?.label ?? role;

export const getRoleAtLocation = (employee: Employee, locationID: string): EmployeeRole | undefined =>
    employee.memberships.find(membership => membership.locationID === locationID)?.role;

/** The employee's most senior role across all their locations. */
export const getHighestRole = (employee: Employee): EmployeeRole | undefined =>
    EMPLOYEE_ROLE_OPTIONS.find(option =>
        employee.memberships.some(membership => membership.role === option.value)
    )?.value;

export const hasRoleAnywhere = (employee: Employee, role: EmployeeRole): boolean =>
    employee.memberships.some(membership => membership.role === role);

/** Whether the employee works at the location (has a role there). */
export const isAssignedToLocation = (employee: Employee, locationID: string): boolean =>
    employee.memberships.some(membership => membership.locationID === locationID);

/**
 * Permissions at a location: everything for company owners and admins,
 * otherwise the defaults for the employee's role there.
 */
export const getPermissionsAtLocation = (employee: Employee, locationID: string): string[] => {
    if (employee.companyRole) return ALL_PERMISSIONS;
    const role = getRoleAtLocation(employee, locationID);
    return role ? DEFAULT_PERMISSIONS_BY_ROLE[role] : [];
};

/**
 * Whether the employee has a permission at a location, or at any of their
 * locations when no location is given.
 */
export const hasPermission = (employee: Employee, permission: string, locationID?: string): boolean => {
    if (employee.companyRole) return true;
    if (locationID) return getPermissionsAtLocation(employee, locationID).includes(permission);
    return employee.memberships.some(membership =>
        DEFAULT_PERMISSIONS_BY_ROLE[membership.role].includes(permission)
    );
};
