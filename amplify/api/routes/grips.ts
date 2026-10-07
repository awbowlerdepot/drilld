import { Hono } from 'hono';
import { gripStockSchema, type GripLineDto, type GripStock } from '../../../shared/api/grips';
import { uuid, withCompany, type Tx } from '../db/client';
import { HttpError } from '../errors';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';

/** /grip-catalog: the shared catalog of inserts and thumb hardware, active lines only. */
export const gripCatalog = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const lines = await tx.selectFrom('grip_line').selectAll()
            .where('active', '=', true)
            .orderBy('manufacturer').orderBy('name')
            .execute();
        const sizes = await tx.selectFrom('grip_size').selectAll()
            .orderBy('size64')
            .execute();

        const byLine = new Map<string, GripLineDto['sizes']>();
        for (const size of sizes) {
            const list = byLine.get(size.line_id) ?? [];
            list.push({ id: size.id, size64: size.size64, label: size.label, od64Choices: size.od64_choices, collar: size.collar });
            byLine.set(size.line_id, list);
        }
        const dto: GripLineDto[] = lines.map(line => ({
            id: line.id,
            manufacturer: line.manufacturer as GripLineDto['manufacturer'],
            name: line.name,
            kind: line.kind as GripLineDto['kind'],
            colors: line.colors,
            sizes: byLine.get(line.id) ?? []
        }));
        return c.json(dto);
    }));

const locationParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Location not found');
    return value;
};

const findLocation = async (tx: Tx, id: string) => {
    const location = await tx.selectFrom('location').select('id').where('id', '=', uuid(id)).executeTakeFirst();
    if (!location) throw new HttpError(404, 'Location not found');
};

const readStock = async (tx: Tx, locationId: string): Promise<GripStock> => {
    const rows = await tx.selectFrom('location_grip_stock').select('grip_size_id')
        .where('location_id', '=', uuid(locationId))
        .execute();
    return { gripSizeIds: rows.map(row => row.grip_size_id) };
};

/** Rows per insert: keeps each Data API call well under its size limits. */
const INSERT_CHUNK = 200;

/** /locations/:locationId/grip-stock: the lines and sizes a location carries. */
export const locationGripStock = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const locationId = locationParam(c.req.param('locationId'));
        requirePermission(await loadAccess(tx, c.var.user), 'read:drillsheets', locationId);
        await findLocation(tx, locationId);
        return c.json(await readStock(tx, locationId));
    }))

    /** Replaces what the location carries. */
    .put('/', async c => {
        const locationId = locationParam(c.req.param('locationId'));
        const input = gripStockSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', locationId);
            await findLocation(tx, locationId);

            await tx.deleteFrom('location_grip_stock').where('location_id', '=', uuid(locationId)).execute();
            const ids = [...new Set(input.gripSizeIds)];
            for (let i = 0; i < ids.length; i += INSERT_CHUNK) {
                await tx.insertInto('location_grip_stock')
                    .values(ids.slice(i, i + INSERT_CHUNK).map(id => ({
                        company_id: uuid(c.var.user.companyId),
                        location_id: uuid(locationId),
                        grip_size_id: uuid(id)
                    })))
                    .execute();
            }
            return c.json(await readStock(tx, locationId));
        });
    });
