import { Hono } from 'hono';
import type { Selectable } from 'kysely';
import { locationAddressSchema, locationHoursSchema } from '../../../shared/api/locationHours';
import {
    locationCreateSchema,
    locationUpdateSchema,
    type LocationDto
} from '../../../shared/api/locations';
import { json, uuid, withCompany } from '../db/client';
import type { Location } from '../db/schema';
import { HttpError } from '../errors';
import { loadAccess, requireCompanyAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';

const toDto = (row: Selectable<Location>): LocationDto => ({
    id: row.id,
    companyID: row.company_id,
    name: row.name,
    // Stored as JSON; the old one-line address and free-text hours are upgraded as they're read.
    address: row.address == null ? null : locationAddressSchema.safeParse(row.address).data ?? null,
    phone: row.phone,
    email: row.email,
    website: row.website,
    timezone: row.timezone,
    hours: row.hours == null ? null : locationHoursSchema.safeParse(row.hours).data ?? null,
    equipment: (row.equipment as LocationDto['equipment']) ?? [],
    settingsOverrides: (row.settings_overrides as Record<string, unknown>) ?? {},
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
});

const idParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Location not found');
    return value;
};

/** The location-limit trigger rejects a location past the plan's limit (SQLSTATE 23514). */
const planLimitError = (error: unknown) => {
    const message = error instanceof Error ? error.message : '';
    if (/SQLState: 23514/.test(message) && /active locations/.test(message)) {
        return new HttpError(409, 'Your plan includes 4 active locations. Deactivate one first, or ask about a bigger plan.');
    }
    return error;
};

/** Locations (physical pro shops) of the signed-in user's company. */
export const locations = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const rows = await tx.selectFrom('location').selectAll().orderBy('active', 'desc').orderBy('name').execute();
        return c.json(rows.map(toDto));
    }))

    /** Adding a location is for company owners and admins. */
    .post('/', async c => {
        const input = locationCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requireCompanyAccess(await loadAccess(tx, c.var.user));
            try {
                const row = await tx.insertInto('location')
                    .values({
                        company_id: uuid(c.var.user.companyId),
                        name: input.name,
                        address: input.address === null ? null : json(input.address),
                        phone: input.phone,
                        email: input.email,
                        website: input.website,
                        timezone: input.timezone,
                        hours: input.hours === null ? null : json(input.hours),
                        equipment: json(input.equipment),
                        settings_overrides: json(input.settingsOverrides),
                        active: input.active
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow();
                return c.json(toDto(row), 201);
            } catch (error) {
                throw planLimitError(error);
            }
        });
    })

    /** Editing a location needs manage:settings there (managers, company owners and admins). */
    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'));
        const input = locationUpdateSchema.parse(await c.req.json());
        const changes = {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.address !== undefined && { address: input.address === null ? null : json(input.address) }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.website !== undefined && { website: input.website }),
            ...(input.timezone !== undefined && { timezone: input.timezone }),
            ...(input.hours !== undefined && { hours: input.hours === null ? null : json(input.hours) }),
            ...(input.equipment !== undefined && { equipment: json(input.equipment) }),
            ...(input.settingsOverrides !== undefined && { settings_overrides: json(input.settingsOverrides) }),
            ...(input.active !== undefined && { active: input.active })
        };
        if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');

        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', id);
            try {
                const row = await tx.updateTable('location').set(changes)
                    .where('id', '=', uuid(id))
                    .returningAll()
                    .executeTakeFirst();
                if (!row) throw new HttpError(404, 'Location not found');
                return c.json(toDto(row));
            } catch (error) {
                throw planLimitError(error);
            }
        });
    });
