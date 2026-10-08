import { Hono } from 'hono';
import type { Selectable } from 'kysely';
import {
    customerCreateSchema,
    customerUpdateSchema,
    type CustomerDto
} from '../../../shared/api/customers';
import type { Delivery, DeliveryDto } from '../../../shared/api/delivery';
import { uuid, withCompany } from '../db/client';
import type { Customer } from '../db/schema';
import { HttpError } from '../errors';
import { deleteFiles } from '../files';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';

const toNumber = (value: string | number | null): number | null => (value === null ? null : Number(value));

const toDeliveryDto = (row: Selectable<Customer>): DeliveryDto => ({
    axisTiltDegrees: toNumber(row.axis_tilt_degrees),
    axisRotationDegrees: toNumber(row.axis_rotation_degrees),
    papOver32: row.pap_over_32,
    papUp32: row.pap_up_32,
    speedMph: toNumber(row.speed_mph),
    revRateRpm: row.rev_rate_rpm
});

/** Column changes for the delivery fields present in the input (null clears one). */
const deliveryColumns = (delivery: Delivery | undefined) => (delivery ? {
    ...(delivery.axisTiltDegrees !== undefined && { axis_tilt_degrees: delivery.axisTiltDegrees }),
    ...(delivery.axisRotationDegrees !== undefined && { axis_rotation_degrees: delivery.axisRotationDegrees }),
    ...(delivery.papOver32 !== undefined && { pap_over_32: delivery.papOver32 }),
    ...(delivery.papUp32 !== undefined && { pap_up_32: delivery.papUp32 }),
    ...(delivery.speedMph !== undefined && { speed_mph: delivery.speedMph }),
    ...(delivery.revRateRpm !== undefined && { rev_rate_rpm: delivery.revRateRpm })
} : {});

const toDto = (row: Selectable<Customer>): CustomerDto => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dominantHand: row.dominant_hand as CustomerDto['dominantHand'],
    preferredGripStyle: row.preferred_grip_style as CustomerDto['preferredGripStyle'],
    usesThumb: row.uses_thumb,
    notes: row.notes,
    homeLocationID: row.home_location_id,
    delivery: toDeliveryDto(row),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
});

const idParam = (value: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Customer not found');
    return value;
};

/** Customers belong to the company and are shared across its locations. */
export const customers = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:customers');
        const rows = await tx.selectFrom('customer').selectAll()
            .orderBy('last_name').orderBy('first_name')
            .execute();
        return c.json(rows.map(toDto));
    }))

    .get('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:customers');
        const row = await tx.selectFrom('customer').selectAll()
            .where('id', '=', uuid(idParam(c.req.param('id'))))
            .executeTakeFirst();
        if (!row) throw new HttpError(404, 'Customer not found');
        return c.json(toDto(row));
    }))

    .post('/', async c => {
        const input = customerCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await tx.insertInto('customer')
                .values({
                    company_id: uuid(c.var.user.companyId),
                    first_name: input.firstName,
                    last_name: input.lastName,
                    email: input.email,
                    phone: input.phone,
                    dominant_hand: input.dominantHand,
                    preferred_grip_style: input.preferredGripStyle,
                    uses_thumb: input.usesThumb,
                    notes: input.notes,
                    home_location_id: input.homeLocationID ? uuid(input.homeLocationID) : null,
                    ...deliveryColumns(input.delivery)
                })
                .returningAll()
                .executeTakeFirstOrThrow();
            return c.json(toDto(row), 201);
        });
    })

    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'));
        const input = customerUpdateSchema.parse(await c.req.json());
        const changes = {
            ...(input.firstName !== undefined && { first_name: input.firstName }),
            ...(input.lastName !== undefined && { last_name: input.lastName }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.dominantHand !== undefined && { dominant_hand: input.dominantHand }),
            ...(input.preferredGripStyle !== undefined && { preferred_grip_style: input.preferredGripStyle }),
            ...(input.usesThumb !== undefined && { uses_thumb: input.usesThumb }),
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.homeLocationID !== undefined && {
                home_location_id: input.homeLocationID ? uuid(input.homeLocationID) : null
            }),
            ...deliveryColumns(input.delivery)
        };
        if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');

        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await tx.updateTable('customer')
                .set(changes)
                .where('id', '=', uuid(id))
                .returningAll()
                .executeTakeFirst();
            if (!row) throw new HttpError(404, 'Customer not found');
            return c.json(toDto(row));
        });
    })

    .delete('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'delete:customers');
        const id = uuid(idParam(c.req.param('id')));
        // Their attachments go with them (the rows cascade; the files are removed after).
        const files = await tx.selectFrom('customer_attachment').select('storage_key').where('customer_id', '=', id).execute();
        // Refused (409) once the customer has balls, drill sheets or work orders.
        const result = await tx.deleteFrom('customer')
            .where('id', '=', id)
            .executeTakeFirst();
        if (Number(result.numDeletedRows) === 0) throw new HttpError(404, 'Customer not found');
        if (files.length > 0) await deleteFiles(files.map(f => f.storage_key));
        return c.body(null, 204);
    }));
