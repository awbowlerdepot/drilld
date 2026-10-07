import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import {
    accessChangeError,
    canAddEmployees,
    canDeactivateEmployee,
    canEditEmployee,
    canSeePay,
    employeeCreateSchema,
    employeeUpdateSchema,
    type EmployeeDto,
    type EmployeeManager,
    type Membership
} from '../../../shared/api/employees';
import { json, uuid, withCompany, type Tx } from '../db/client';
import type { AppUser } from '../db/schema';
import { HttpError } from '../errors';
import { deleteLogin, inviteLogin, resendInvite, setLoginEnabled } from '../logins';
import { loadAccess, requirePermission, toEmployeeManager } from '../permissions';
import type { ApiEnv } from '../app';

type Row = Selectable<AppUser>;

/** A date column as YYYY-MM-DD, however the Data API returns it. */
const dateOnly = (value: unknown): string | null =>
    value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

const toDto = (row: Row, memberships: Membership[], showPay: boolean): EmployeeDto => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    companyRole: row.company_role as EmployeeDto['companyRole'],
    memberships,
    hireDate: dateOnly(row.hire_date),
    ...(showPay && { hourlyRate: row.hourly_rate == null ? null : Number(row.hourly_rate) }),
    specialties: row.specialties ?? [],
    status: !row.active ? 'INACTIVE' : row.cognito_sub ? 'ACTIVE' : 'INVITED',
    active: row.active,
    invitedAt: row.invited_at ? new Date(row.invited_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
});

const idParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Employee not found');
    return value;
};

/** A text[] parameter: the Data API has no array parameters, so the list goes as JSON. */
const textArray = (values: string[]) =>
    sql<string[]>`(select coalesce(array_agg(value), '{}') from jsonb_array_elements_text(${json(values)}::jsonb))`;

const dateParam = (value: string | null) => (value === null ? null : sql<string>`cast(${value} as date)`);

const membershipsOf = async (tx: Tx, userIds?: string[]): Promise<Map<string, Membership[]>> => {
    let query = tx.selectFrom('location_membership').select(['user_id', 'location_id', 'role']);
    if (userIds) query = query.where('user_id', 'in', userIds.map(uuid));
    const byUser = new Map<string, Membership[]>();
    for (const m of await query.execute()) {
        byUser.set(m.user_id, [...(byUser.get(m.user_id) ?? []), { locationID: m.location_id, role: m.role as Membership['role'] }]);
    }
    return byUser;
};

const replaceMemberships = async (tx: Tx, companyId: string, userId: string, memberships: Membership[]) => {
    await tx.deleteFrom('location_membership').where('user_id', '=', uuid(userId)).execute();
    if (memberships.length === 0) return;
    await tx.insertInto('location_membership')
        .values(memberships.map(m => ({
            company_id: uuid(companyId),
            user_id: uuid(userId),
            location_id: uuid(m.locationID),
            role: m.role
        })))
        .execute();
};

const loadEmployee = async (tx: Tx, id: string) => {
    const row = await tx.selectFrom('app_user').selectAll().where('id', '=', uuid(id)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Employee not found');
    return { row, memberships: (await membershipsOf(tx, [id])).get(id) ?? [] };
};

const loadManager = async (tx: Tx, user: ApiEnv['Variables']['user']): Promise<EmployeeManager> =>
    toEmployeeManager(await loadAccess(tx, user), user);

/** Emails are unique across Drilld: one company per person. */
const duplicateEmailError = (error: unknown) =>
    /SQLState: 23505/.test(error instanceof Error ? error.message : '') && /app_user_email_uq/.test((error as Error).message)
        ? new HttpError(409, 'That email already has a Drilld account')
        : error;

/**
 * Employees of the signed-in user's company. Anyone with read:employees sees
 * the list; pay only shows for owners and admins. Adding and changing people
 * follows the rules in shared/api/employees.ts.
 */
export const employees = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const access = await loadAccess(tx, c.var.user);
        requirePermission(access, 'read:employees');
        const showPay = canSeePay(toEmployeeManager(access, c.var.user));
        const rows = await tx.selectFrom('app_user').selectAll()
            .orderBy('active', 'desc').orderBy('last_name').orderBy('first_name')
            .execute();
        const memberships = await membershipsOf(tx);
        return c.json(rows.map(row => toDto(row, memberships.get(row.id) ?? [], showPay)));
    }))

    /** Adds an employee and emails them an invitation to sign in. */
    .post('/', async c => {
        const input = employeeCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const manager = await loadManager(tx, c.var.user);
            if (!canAddEmployees(manager)) throw new HttpError(403, 'Only owners, admins and managers can add employees');
            const denied = accessChangeError(manager, null, input);
            if (denied) throw new HttpError(403, denied);
            const showPay = canSeePay(manager);

            let row: Row;
            try {
                row = await tx.insertInto('app_user')
                    .values({
                        company_id: uuid(c.var.user.companyId),
                        email: input.email,
                        first_name: input.firstName,
                        last_name: input.lastName,
                        phone: input.phone,
                        company_role: input.companyRole,
                        hire_date: dateParam(input.hireDate),
                        hourly_rate: showPay ? input.hourlyRate : null,
                        specialties: textArray(input.specialties),
                        invited_at: sql`now()`
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow();
            } catch (error) {
                throw duplicateEmailError(error);
            }
            await replaceMemberships(tx, c.var.user.companyId, row.id, input.memberships);

            // Last, so a failed invitation rolls the employee back.
            const inviteSent = await inviteLogin(input.email);
            console.log(`Employee ${row.id} added by ${c.var.user.userId}; invitation ${inviteSent ? 'sent' : 'skipped (login exists)'}`);
            return c.json({ ...toDto(row, input.memberships, showPay), inviteSent }, 201);
        });
    })

    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'));
        const input = employeeUpdateSchema.parse(await c.req.json());
        if (Object.keys(input).length === 0) throw new HttpError(400, 'Nothing to update');

        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const manager = await loadManager(tx, c.var.user);
            const before = await loadEmployee(tx, id);
            const target = { id, companyRole: before.row.company_role as EmployeeDto['companyRole'], memberships: before.memberships };
            if (!canEditEmployee(manager, target)) throw new HttpError(403, 'You can\'t edit this employee');

            if ('companyRole' in input || 'memberships' in input) {
                const denied = accessChangeError(manager, target, {
                    companyRole: input.companyRole !== undefined ? input.companyRole : target.companyRole,
                    memberships: input.memberships ?? target.memberships
                });
                if (denied) throw new HttpError(403, denied);
            }
            if (input.active !== undefined && input.active !== before.row.active && !canDeactivateEmployee(manager, target)) {
                throw new HttpError(403, id === manager.userId
                    ? 'You can\'t deactivate yourself'
                    : 'Only owners, admins, or a manager of every location they work at can do this');
            }
            if (input.hourlyRate !== undefined && !canSeePay(manager)) throw new HttpError(403, 'Only owners and admins can set pay');

            const changes = {
                ...(input.firstName !== undefined && { first_name: input.firstName }),
                ...(input.lastName !== undefined && { last_name: input.lastName }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.companyRole !== undefined && { company_role: input.companyRole }),
                ...(input.hireDate !== undefined && { hire_date: dateParam(input.hireDate) }),
                ...(input.hourlyRate !== undefined && { hourly_rate: input.hourlyRate }),
                ...(input.specialties !== undefined && { specialties: textArray(input.specialties) }),
                ...(input.active !== undefined && { active: input.active })
            };
            const row = Object.keys(changes).length > 0
                ? await tx.updateTable('app_user').set(changes).where('id', '=', uuid(id)).returningAll().executeTakeFirstOrThrow()
                : before.row;
            if (input.memberships) await replaceMemberships(tx, c.var.user.companyId, id, input.memberships);

            if (input.active !== undefined && input.active !== before.row.active) {
                await setLoginEnabled(row.email, input.active);
                console.log(`Employee ${id} ${input.active ? 'reactivated' : 'deactivated'} by ${c.var.user.userId}`);
            }
            return c.json(toDto(row, input.memberships ?? before.memberships, canSeePay(manager)));
        });
    })

    /** Emails the invitation again (a new temporary password), for someone who hasn't signed in yet. */
    .post('/:id/invite', c => {
        const id = idParam(c.req.param('id'));
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const manager = await loadManager(tx, c.var.user);
            const { row, memberships } = await loadEmployee(tx, id);
            if (!canEditEmployee(manager, { companyRole: row.company_role as EmployeeDto['companyRole'], memberships })) {
                throw new HttpError(403, 'You can\'t edit this employee');
            }
            if (row.cognito_sub) throw new HttpError(409, 'They\'ve already signed in');
            if (!row.active) throw new HttpError(409, 'Reactivate them first');
            const updated = await tx.updateTable('app_user').set({ invited_at: sql`now()` })
                .where('id', '=', uuid(id)).returningAll().executeTakeFirstOrThrow();
            await resendInvite(row.email);
            return c.json(toDto(updated, memberships, canSeePay(manager)));
        });
    })

    /**
     * Cancels an invitation: removes someone who never signed in (e.g. a typo in
     * the email). Anyone who has signed in is deactivated instead, which keeps
     * their name on the work they did.
     */
    .delete('/:id', c => {
        const id = idParam(c.req.param('id'));
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const manager = await loadManager(tx, c.var.user);
            const { row, memberships } = await loadEmployee(tx, id);
            if (!canDeactivateEmployee(manager, { id, companyRole: row.company_role as EmployeeDto['companyRole'], memberships })) {
                throw new HttpError(403, 'You can\'t remove this employee');
            }
            if (row.cognito_sub) throw new HttpError(409, 'They\'ve signed in, so deactivate them instead');
            await tx.deleteFrom('app_user').where('id', '=', uuid(id)).execute();
            await deleteLogin(row.email);
            console.log(`Invitation for employee ${id} cancelled by ${c.var.user.userId}`);
            return c.body(null, 204);
        });
    });
