import { z } from 'zod';

/**
 * Employees API contract. An employee is an app_user: invited by email, with
 * a role at each location they work at (location_membership) and optional
 * company access (OWNER or ADMIN). The rules for who may change whom are
 * here too, so the API enforces and the screen shows the same thing.
 */

export const EMPLOYEE_ROLES = ['MANAGER', 'SENIOR_TECH', 'TECHNICIAN', 'APPRENTICE'] as const;
export const COMPANY_ROLES = ['OWNER', 'ADMIN'] as const;

export type EmployeeRoleCode = typeof EMPLOYEE_ROLES[number];
export type CompanyRoleCode = typeof COMPANY_ROLES[number];

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);

export const membershipSchema = z.object({
    locationID: z.string().uuid(),
    role: z.enum(EMPLOYEE_ROLES)
}).strict();

const membershipsSchema = z.array(membershipSchema).max(50)
    .refine(list => new Set(list.map(m => m.locationID)).size === list.length, 'One role per location');

const fields = {
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    phone: optionalText(40),
    companyRole: z.enum(COMPANY_ROLES).nullable(),
    memberships: membershipsSchema,
    /** YYYY-MM-DD; empty means none. */
    hireDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')]).nullish().transform(value => value || null),
    /** Only owners and admins see or set pay. */
    hourlyRate: z.number().min(0).max(9999).multipleOf(0.01).nullish().transform(value => value ?? null),
    specialties: z.array(z.string().trim().min(1).max(60)).max(30)
};

export const employeeEmailSchema = z.string().trim().toLowerCase().email('Enter a valid email').max(254);

/**
 * The details a form edits besides access (company role and location roles,
 * which accessChangeError checks), for validating a form before sending.
 */
export const employeeDetailsSchema = z.object({
    firstName: fields.firstName,
    lastName: fields.lastName,
    phone: fields.phone,
    hireDate: fields.hireDate,
    hourlyRate: fields.hourlyRate,
    specialties: fields.specialties
});

const hasAccess = (value: { companyRole?: CompanyRoleCode | null; memberships?: unknown[] }) =>
    !!value.companyRole || (value.memberships?.length ?? 0) > 0;
const NEEDS_ACCESS = { message: 'Give them a role at a location, or company access', path: ['memberships'] };

/** Body of POST /employees: adds the employee and emails them an invitation. */
export const employeeCreateSchema = z.object({
    email: employeeEmailSchema,
    ...fields,
    companyRole: fields.companyRole.default(null),
    memberships: fields.memberships.default([]),
    specialties: fields.specialties.default([])
}).strict().refine(hasAccess, NEEDS_ACCESS);

/**
 * Body of PATCH /employees/:id: any subset. The email is the login, so it
 * can't change; to fix a typo, cancel the invitation and add them again.
 * `memberships` replaces the whole list.
 */
export const employeeUpdateSchema = z.object({ ...fields, active: z.boolean() }).partial().strict();

export type EmployeeCreate = z.input<typeof employeeCreateSchema>;
export type EmployeeUpdate = z.input<typeof employeeUpdateSchema>;
export type Membership = z.infer<typeof membershipSchema>;

/** INVITED: hasn't signed in yet. ACTIVE: has signed in. INACTIVE: deactivated, can't sign in. */
export type EmployeeStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE';

/** An employee as the API returns them. */
export interface EmployeeDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    companyRole: CompanyRoleCode | null;
    memberships: Membership[];
    hireDate: string | null;
    /** Absent unless the viewer may see pay (owners and admins). */
    hourlyRate?: number | null;
    specialties: string[];
    status: EmployeeStatus;
    active: boolean;
    /** When the last invitation went out. */
    invitedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ==========================================
// Who may change whom
// ==========================================

/**
 * The signed-in user as an employee manager: their company access, and the
 * locations where they manage employees (where their role has write:employees).
 */
export interface EmployeeManager {
    userId: string;
    companyRole: CompanyRoleCode | null;
    managedLocationIDs: string[];
}

interface Target {
    companyRole: CompanyRoleCode | null;
    memberships: Membership[];
}

/** Pay is for owners and admins only. */
export const canSeePay = (manager: EmployeeManager) => manager.companyRole !== null;

/** Whether the manager can add employees at all (company access, or managing a location). */
export const canAddEmployees = (manager: EmployeeManager) =>
    manager.companyRole !== null || manager.managedLocationIDs.length > 0;

/**
 * Whether the manager can edit this employee. Owners and admins can edit
 * anyone, except that only an owner can edit an owner. A location manager can
 * edit people without company access who work at a location they manage.
 */
export const canEditEmployee = (manager: EmployeeManager, target: Target) => {
    if (manager.companyRole) return target.companyRole !== 'OWNER' || manager.companyRole === 'OWNER';
    return !target.companyRole && target.memberships.some(m => manager.managedLocationIDs.includes(m.locationID));
};

/**
 * Whether the manager can deactivate (or reactivate) this employee: anyone they
 * can edit, but a location manager only when every location the employee works
 * at is one they manage. Nobody deactivates themselves.
 */
export const canDeactivateEmployee = (manager: EmployeeManager, target: Target & { id: string }) =>
    target.id !== manager.userId && canEditEmployee(manager, target) &&
    (manager.companyRole !== null || target.memberships.every(m => manager.managedLocationIDs.includes(m.locationID)));

/** Whether the manager can set a role at this location. */
export const canAssignAt = (manager: EmployeeManager, locationID: string) =>
    manager.companyRole !== null || manager.managedLocationIDs.includes(locationID);

/**
 * Why the manager can't make this change to company access and roles, or null
 * if they can. `before` is null for a new employee.
 */
export const accessChangeError = (
    manager: EmployeeManager,
    before: (Target & { id: string }) | null,
    after: Target
): string | null => {
    if (!after.companyRole && after.memberships.length === 0) return NEEDS_ACCESS.message;

    const companyRoleChanged = (before?.companyRole ?? null) !== after.companyRole;
    if (companyRoleChanged) {
        if (!manager.companyRole) return 'Only company owners and admins can give company access';
        if (before?.id === manager.userId) return 'You can\'t change your own company access';
        if ((after.companyRole === 'OWNER' || before?.companyRole === 'OWNER') && manager.companyRole !== 'OWNER') {
            return 'Only an owner can make or remove an owner';
        }
    }

    const roleAt = (list: Membership[], locationID: string) => list.find(m => m.locationID === locationID)?.role;
    const locations = new Set([...(before?.memberships ?? []), ...after.memberships].map(m => m.locationID));
    for (const locationID of locations) {
        if (roleAt(before?.memberships ?? [], locationID) !== roleAt(after.memberships, locationID) && !canAssignAt(manager, locationID)) {
            return 'You can only set roles at locations you manage';
        }
    }
    return null;
};
