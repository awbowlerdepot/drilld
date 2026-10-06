import { Hono } from 'hono';
import type { MeDto } from '../../../shared/api/me';
import { uuid, withCompany } from '../db/client';
import type { ApiEnv } from '../app';

export const me = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const user = await tx.selectFrom('app_user')
            .select(['id', 'email', 'first_name', 'last_name', 'company_role'])
            .where('id', '=', uuid(c.var.user.userId))
            .executeTakeFirstOrThrow();
        const company = await tx.selectFrom('company')
            .select(['id', 'name'])
            .executeTakeFirstOrThrow();
        const memberships = await tx.selectFrom('location_membership')
            .select(['location_id', 'role'])
            .where('user_id', '=', uuid(c.var.user.userId))
            .execute();

        const body: MeDto = {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                companyRole: user.company_role as MeDto['user']['companyRole']
            },
            company,
            memberships: memberships.map(m => ({
                locationID: m.location_id,
                role: m.role as MeDto['memberships'][number]['role']
            }))
        };
        return c.json(body);
    }));
