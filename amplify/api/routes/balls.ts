import { Hono } from 'hono';
import { sql } from 'kysely';
import {
    ballRegisterSchema,
    ballTransferSchema,
    ballUpdateSchema,
    type BallDetailDto,
    type BallDto,
    type BallHistoryDto,
    type BallLookupDto
} from '../../../shared/api/balls';
import { uuid, withCompany, type Tx } from '../db/client';
import { HttpError } from '../errors';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';
import { catalogBallDto } from './catalog';

// A company's physical balls. Each is a row in the platform-wide registry
// (ball: catalog ball, weight, serial) plus the company's own record
// (company_ball) and its owners over time (ball_ownership). Another company
// that registers the same serial gets the same registry row, and sees only
// the anonymous history (ball_service_summary), never who or what.

const idParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Ball not found');
    return value;
};

const customerParam = (value: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Customer not found');
    return value;
};

const dateOnly = (value: unknown): string | null =>
    value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
const num = (value: unknown) => (value == null ? null : Number(value));
const dateParam = (value: string | null) => (value === null ? null : sql<string>`cast(${value} as date)`);

/** The company's balls with their catalog ball and current owner. */
const selectBalls = (tx: Tx) => tx.selectFrom('company_ball as cb')
    .innerJoin('ball as b', 'b.id', 'cb.ball_id')
    .innerJoin('catalog_ball as cat', 'cat.id', 'b.catalog_ball_id')
    .leftJoin('ball_ownership as o', join => join.onRef('o.company_ball_id', '=', 'cb.id').on('o.to_date', 'is', null))
    .leftJoin('customer as cu', 'cu.id', 'o.customer_id')
    .select([
        'cb.id', 'cb.ball_id', 'cb.pin_distance', 'cb.top_weight', 'cb.status', 'cb.purchase_date', 'cb.notes', 'cb.created_at', 'cb.updated_at',
        'b.weight_lbs', 'b.serial_number',
        'cat.id as cat_id', 'cat.brand_id as cat_brand_id', 'cat.brand_name as cat_brand_name', 'cat.name as cat_name', 'cat.color as cat_color',
        'cat.status as cat_status', 'cat.data as cat_data', 'cat.content_changed_at as cat_content_changed_at', 'cat.removed_at as cat_removed_at', 'cat.synced_at as cat_synced_at',
        'o.customer_id as owner_id', 'o.from_date as owner_since',
        sql<string | null>`cu.first_name || ' ' || cu.last_name`.as('owner_name')
    ]);

type BallRow = Awaited<ReturnType<ReturnType<typeof selectBalls>['executeTakeFirstOrThrow']>>;

const toDto = (row: BallRow): BallDto => ({
    id: row.id,
    ballId: row.ball_id,
    catalogBall: catalogBallDto({
        id: row.cat_id, brand_id: row.cat_brand_id, brand_name: row.cat_brand_name, name: row.cat_name, color: row.cat_color,
        status: row.cat_status, data: row.cat_data, content_changed_at: row.cat_content_changed_at, removed_at: row.cat_removed_at, synced_at: row.cat_synced_at
    }),
    weightLbs: row.weight_lbs,
    serialNumber: row.serial_number,
    pinDistance: num(row.pin_distance),
    topWeight: num(row.top_weight),
    status: row.status as BallDto['status'],
    purchaseDate: dateOnly(row.purchase_date),
    notes: row.notes,
    owner: row.owner_id ? { customerId: row.owner_id, name: row.owner_name ?? '', since: dateOnly(row.owner_since)! } : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
});

/** Drill and plug counts across every shop, without saying which. */
const historyOf = async (tx: Tx, ballId: string): Promise<BallHistoryDto> => {
    const row = (await sql<{ drill_count: number; plug_count: number; last_worked_month: unknown }>`select * from ball_service_summary(${uuid(ballId)})`.execute(tx)).rows[0];
    return { drillCount: Number(row?.drill_count ?? 0), plugCount: Number(row?.plug_count ?? 0), lastWorkedMonth: dateOnly(row?.last_worked_month) };
};

const detail = async (tx: Tx, id: string): Promise<BallDetailDto> => {
    const row = await selectBalls(tx).where('cb.id', '=', uuid(id)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Ball not found');
    const owners = await tx.selectFrom('ball_ownership as o')
        .innerJoin('customer as cu', 'cu.id', 'o.customer_id')
        .select(['o.customer_id', 'o.from_date', 'o.to_date', sql<string>`cu.first_name || ' ' || cu.last_name`.as('name')])
        .where('o.company_ball_id', '=', uuid(id))
        .orderBy('o.from_date', 'desc')
        .execute();
    return {
        ...toDto(row),
        owners: owners.map(o => ({ customerId: o.customer_id, name: o.name, from: dateOnly(o.from_date)!, to: dateOnly(o.to_date) })),
        history: await historyOf(tx, row.ball_id)
    };
};

const today = sql<string>`current_date`;

export const balls = new Hono<ApiEnv>()
    /** The company's balls; ?customerId= for one bowler's (current owner), ?status= to filter. */
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:balls');
        let query = selectBalls(tx);
        const customerId = c.req.query('customerId');
        if (customerId) query = query.where('o.customer_id', '=', uuid(idParam(customerId)));
        const status = c.req.query('status');
        if (status) query = query.where('cb.status', '=', status);
        const rows = await query.orderBy('cb.status').orderBy('cat.brand_name').orderBy('cat.name').limit(2000).execute();
        return c.json(rows.map(toDto));
    }))

    /** What's known about a serial: registered somewhere? Its anonymous history; this company's record. */
    .get('/lookup', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:balls');
        const brandId = idParam(c.req.query('brandId'));
        const serial = ballRegisterSchema.shape.serialNumber.parse(c.req.query('serial'));
        const empty: BallLookupDto = { registered: false, catalogBall: null, weightLbs: null, history: null, companyBallId: null };
        if (!serial) return c.json(empty);
        const ball = await tx.selectFrom('ball').selectAll()
            .where('brand_id', '=', uuid(brandId)).where('serial_number', '=', serial).executeTakeFirst();
        if (!ball) return c.json(empty);
        const cat = await tx.selectFrom('catalog_ball').selectAll().where('id', '=', uuid(ball.catalog_ball_id)).executeTakeFirstOrThrow();
        const mine = await tx.selectFrom('company_ball').select('id').where('ball_id', '=', uuid(ball.id)).executeTakeFirst();
        const body: BallLookupDto = {
            registered: true, catalogBall: catalogBallDto(cat), weightLbs: ball.weight_lbs,
            history: await historyOf(tx, ball.id), companyBallId: mine?.id ?? null
        };
        return c.json(body);
    }))

    .get('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:balls');
        return c.json(await detail(tx, idParam(c.req.param('id'))));
    }))

    /**
     * Registers a bowler's ball: the registry row (shared with any shop that has
     * the same brand + serial), this company's record, and the bowler as owner.
     */
    .post('/', async c => {
        const input = ballRegisterSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:balls');
            const cat = await tx.selectFrom('catalog_ball').selectAll().where('id', '=', uuid(input.catalogBallId)).executeTakeFirst();
            if (!cat) throw new HttpError(404, 'That ball isn\'t in the catalog');
            const weights = catalogBallDto(cat).weights.map(w => w.weightLbs);
            if (weights.length > 0 && !weights.includes(input.weightLbs)) throw new HttpError(400, `${cat.name} comes in ${weights.join(', ')} lb`);
            const customer = await tx.selectFrom('customer').select('id').where('id', '=', uuid(customerParam(input.customerId))).executeTakeFirst();
            if (!customer) throw new HttpError(404, 'Customer not found');

            // The same brand + serial is the same physical ball, wherever it was registered.
            let ballId: string | null = null;
            if (input.serialNumber) {
                const existing = await tx.selectFrom('ball').selectAll()
                    .where('brand_id', '=', uuid(cat.brand_id)).where('serial_number', '=', input.serialNumber).executeTakeFirst();
                if (existing) {
                    if (existing.catalog_ball_id !== cat.id || existing.weight_lbs !== input.weightLbs) {
                        throw new HttpError(409, `Serial ${input.serialNumber} is already registered as a different ball or weight. Check the serial.`);
                    }
                    ballId = existing.id;
                }
            }
            if (!ballId) {
                ballId = (await tx.insertInto('ball').values({
                    catalog_ball_id: uuid(cat.id), weight_lbs: input.weightLbs, brand_id: uuid(cat.brand_id), serial_number: input.serialNumber
                }).returning('id').executeTakeFirstOrThrow()).id;
            }
            const mine = await tx.selectFrom('company_ball').select('id').where('ball_id', '=', uuid(ballId)).executeTakeFirst();
            if (mine) throw new HttpError(409, 'This ball is already in your records; transfer it to the new owner instead');

            const companyBall = await tx.insertInto('company_ball').values({
                company_id: uuid(c.var.user.companyId),
                ball_id: uuid(ballId),
                pin_distance: input.pinDistance,
                top_weight: input.topWeight,
                purchase_date: dateParam(input.purchaseDate),
                notes: input.notes
            }).returning('id').executeTakeFirstOrThrow();
            await tx.insertInto('ball_ownership').values({
                company_id: uuid(c.var.user.companyId), company_ball_id: uuid(companyBall.id), customer_id: uuid(input.customerId), from_date: today
            }).execute();
            return c.json(await detail(tx, companyBall.id), 201);
        });
    })

    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'));
        const input = ballUpdateSchema.parse(await c.req.json());
        const changes = {
            ...(input.pinDistance !== undefined && { pin_distance: input.pinDistance }),
            ...(input.topWeight !== undefined && { top_weight: input.topWeight }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.purchaseDate !== undefined && { purchase_date: dateParam(input.purchaseDate) }),
            ...(input.notes !== undefined && { notes: input.notes })
        };
        if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:balls');
            const result = await tx.updateTable('company_ball').set(changes).where('id', '=', uuid(id)).executeTakeFirst();
            if (Number(result.numUpdatedRows) === 0) throw new HttpError(404, 'Ball not found');
            return c.json(await detail(tx, id));
        });
    })

    /** The ball changes hands: the current owner's ownership ends today, the new one's starts. */
    .post('/:id/transfer', async c => {
        const id = idParam(c.req.param('id'));
        const input = ballTransferSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:balls');
            const ball = await tx.selectFrom('company_ball').select('id').where('id', '=', uuid(id)).executeTakeFirst();
            if (!ball) throw new HttpError(404, 'Ball not found');
            const customer = await tx.selectFrom('customer').select('id').where('id', '=', uuid(customerParam(input.customerId))).executeTakeFirst();
            if (!customer) throw new HttpError(404, 'Customer not found');
            const current = await tx.selectFrom('ball_ownership').select(['id', 'customer_id'])
                .where('company_ball_id', '=', uuid(id)).where('to_date', 'is', null).executeTakeFirst();
            if (current?.customer_id === input.customerId) throw new HttpError(409, 'They already own it');
            if (current) await tx.updateTable('ball_ownership').set({ to_date: today }).where('id', '=', uuid(current.id)).execute();
            await tx.insertInto('ball_ownership').values({
                company_id: uuid(c.var.user.companyId), company_ball_id: uuid(id), customer_id: uuid(input.customerId), from_date: today
            }).execute();
            return c.json(await detail(tx, id));
        });
    });
