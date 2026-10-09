import type { EmployeeManager } from '../../shared/api/employees';
import type { MeDto } from '../../shared/api/me';
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

/** Without sign-in (mock data), you're the mock company's owner. */
const MOCK_MANAGER: EmployeeManager = { userId: '00000000-0000-4000-8000-0000000000e3', companyRole: 'OWNER', managedLocationIDs: [] };
const NO_ACCESS: EmployeeManager = { userId: '', companyRole: null, managedLocationIDs: [] };

/**
 * The signed-in user as an employee manager (the same rules as the API's
 * permissions.ts): company access, and where their role has write:employees.
 * Until /me loads, no access; without sign-in, the mock owner.
 */
export const toEmployeeManager = (me: MeDto | null, signedIn: boolean): EmployeeManager => !signedIn
    ? MOCK_MANAGER
    : me ? {
        userId: me.user.id,
        companyRole: me.user.companyRole,
        managedLocationIDs: me.memberships
            .filter(membership => DEFAULT_PERMISSIONS_BY_ROLE[membership.role].includes('write:employees'))
            .map(membership => membership.locationID)
    } : NO_ACCESS;

/**
 * Whether the signed-in user has a permission at a location (company owners
 * and admins everywhere). Without sign-in (mock data), everything is allowed.
 */
export const canAtLocation = (me: MeDto | null, signedIn: boolean, permission: string, locationID: string): boolean => {
    if (!signedIn) return true;
    if (!me) return false;
    if (me.user.companyRole) return true;
    return me.memberships.some(m => m.locationID === locationID && DEFAULT_PERMISSIONS_BY_ROLE[m.role].includes(permission));
};
