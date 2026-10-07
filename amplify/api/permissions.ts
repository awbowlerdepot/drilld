import type { EmployeeManager } from '../../shared/api/employees';
import { DEFAULT_PERMISSIONS_BY_ROLE, EmployeeRole } from '../../src/types/employee';
import { uuid, type Tx } from './db/client';
import { HttpError } from './errors';
import type { CurrentUser } from './auth';

/**
 * Permissions follow the same rules as the frontend (src/utils/EmployeeRoles):
 * company owners and admins have every permission; everyone else gets the
 * defaults for their role at each location.
 */
export interface Access {
    companyRole: 'OWNER' | 'ADMIN' | null;
    memberships: { locationID: string; role: EmployeeRole }[];
}

export const loadAccess = async (tx: Tx, user: CurrentUser): Promise<Access> => {
    const account = await tx.selectFrom('app_user')
        .select('company_role')
        .where('id', '=', uuid(user.userId))
        .executeTakeFirstOrThrow();
    const memberships = await tx.selectFrom('location_membership')
        .select(['location_id', 'role'])
        .where('user_id', '=', uuid(user.userId))
        .execute();

    return {
        companyRole: account.company_role as Access['companyRole'],
        memberships: memberships.map(m => ({ locationID: m.location_id, role: m.role as EmployeeRole }))
    };
};

/**
 * Throws 403 unless the user has the permission: at the given location, or at
 * any of their locations for company-level data such as customers.
 */
export const requirePermission = (access: Access, permission: string, locationID?: string) => {
    if (access.companyRole) return;
    const allowed = access.memberships.some(m =>
        (!locationID || m.locationID === locationID) && DEFAULT_PERMISSIONS_BY_ROLE[m.role].includes(permission)
    );
    if (!allowed) throw new HttpError(403, `Missing permission ${permission}`);
};

/** Throws 403 unless the user has company access (OWNER or ADMIN), e.g. to add a location. */
export const requireCompanyAccess = (access: Access) => {
    if (!access.companyRole) throw new HttpError(403, 'Only company owners and admins can do this');
};

/** The user as an employee manager: company access, and where their role lets them manage employees. */
export const toEmployeeManager = (access: Access, user: CurrentUser): EmployeeManager => ({
    userId: user.userId,
    companyRole: access.companyRole,
    managedLocationIDs: access.memberships
        .filter(m => DEFAULT_PERMISSIONS_BY_ROLE[m.role].includes('write:employees'))
        .map(m => m.locationID)
});
