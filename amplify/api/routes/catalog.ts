import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import type { CatalogBallDto, CatalogBrandDto, CatalogStatusDto } from '../../../shared/api/balls';
import { uuid, withCompany } from '../db/client';
import type { CatalogBall, CompanyBallModel } from '../db/schema';
import { HttpError } from '../errors';
import type { ApiEnv } from '../app';

// The BowlerIQ ball catalog, from Drilld's synced copy (catalog_ball, written
// only by the sync job). Platform data: every signed-in user can read it.

interface BowlerIqBall {
    release_date?: string | null;
    image_url?: string | null;
    coverstock?: { name?: string | null; material?: string | null; type?: string | null } | null;
    core?: { name?: string | null; type?: string | null } | null;
    factory_finish?: string | null;
    weights?: { weight_lbs: number; rg?: number | null; differential?: number | null; mass_bias?: number | null }[] | null;
}

export const catalogBallDto = (row: Selectable<CatalogBall>): CatalogBallDto => {
    const data = (row.data ?? {}) as BowlerIqBall;
    return {
        id: row.id,
        source: 'catalog',
        brandId: row.brand_id,
        brandName: row.brand_name,
        name: row.name,
        color: row.color,
        status: row.status as CatalogBallDto['status'],
        releaseDate: data.release_date ?? null,
        imageUrl: data.image_url ?? null,
        coverstock: data.coverstock ? { name: data.coverstock.name ?? null, material: data.coverstock.material ?? null, type: data.coverstock.type ?? null } : null,
        core: data.core ? { name: data.core.name ?? null, type: data.core.type ?? null } : null,
        finish: data.factory_finish ?? null,
        weights: (data.weights ?? []).map(w => ({ weightLbs: w.weight_lbs, rg: w.rg ?? null, differential: w.differential ?? null, massBias: w.mass_bias ?? null })),
        removed: row.removed_at !== null
    };
};

/** A ball the company typed in because the catalog doesn't have it. */
export const shopBallModelDto = (row: Selectable<CompanyBallModel>): CatalogBallDto => ({
    id: row.id,
    source: 'shop',
    brandId: row.brand_id,
    brandName: row.brand_name,
    name: row.name,
    color: row.color,
    status: null,
    releaseDate: null,
    imageUrl: null,
    coverstock: row.coverstock ? { name: row.coverstock, material: null, type: null } : null,
    core: row.core ? { name: row.core, type: null } : null,
    finish: null,
    weights: [],
    removed: false
});

const SEARCH_LIMIT = 40;
const searchWords = (q: string | undefined) => (q ?? '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6).map(w => '%' + w.replace(/[%_\\]/g, '') + '%');

export const catalog = new Hono<ApiEnv>()
    /** Brands with published balls. */
    .get('/brands', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const rows = await tx.selectFrom('catalog_ball')
            .select(['brand_id', 'brand_name', sql<number>`count(*)::int`.as('count')])
            .where('removed_at', 'is', null)
            .groupBy(['brand_id', 'brand_name'])
            .orderBy('brand_name')
            .execute();
        const body: CatalogBrandDto[] = rows.map(r => ({ id: r.brand_id, name: r.brand_name, ballCount: Number(r.count) }));
        return c.json(body);
    }))

    /**
     * Search: every word must match the brand, name or color ("storm phaze
     * purple"). Current balls before retired ones; removed balls never. Then
     * the balls this company typed in, which the catalog doesn't have.
     */
    .get('/balls', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const words = searchWords(c.req.query('q'));
        const brandId = c.req.query('brandId');
        let query = tx.selectFrom('catalog_ball').selectAll().where('removed_at', 'is', null);
        if (brandId) {
            if (!/^[0-9a-f-]{36}$/i.test(brandId)) throw new HttpError(400, 'Unknown brand');
            query = query.where('brand_id', '=', uuid(brandId));
        }
        for (const word of words) {
            query = query.where(sql<boolean>`lower(brand_name || ' ' || name || ' ' || coalesce(color, '')) like ${word}`);
        }
        const rows = await query
            .orderBy(sql`status = 'current'`, 'desc')
            .orderBy('brand_name').orderBy('name').orderBy('color')
            .limit(SEARCH_LIMIT)
            .execute();
        let shop = tx.selectFrom('company_ball_model').selectAll();
        if (brandId) shop = shop.where('brand_id', '=', uuid(brandId));
        for (const word of words) {
            shop = shop.where(sql<boolean>`lower(brand_name || ' ' || name || ' ' || coalesce(color, '')) like ${word}`);
        }
        const shopRows = await shop.orderBy('brand_name').orderBy('name').orderBy('color').limit(SEARCH_LIMIT).execute();
        return c.json([...rows.map(catalogBallDto), ...shopRows.map(shopBallModelDto)]);
    }))

    .get('/balls/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const id = c.req.param('id');
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'Ball not found');
        const row = await tx.selectFrom('catalog_ball').selectAll().where('id', '=', uuid(id)).executeTakeFirst();
        if (!row) throw new HttpError(404, 'Ball not found');
        return c.json(catalogBallDto(row));
    }))

    /** How much of the catalog is here, and when it last synced. */
    .get('/status', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const count = await tx.selectFrom('catalog_ball').select(sql<number>`count(*)::int`.as('n')).where('removed_at', 'is', null).executeTakeFirstOrThrow();
        const state = await tx.selectFrom('catalog_sync_state').select('last_run_at').executeTakeFirst();
        const body: CatalogStatusDto = {
            ballCount: Number(count.n),
            lastRunAt: state?.last_run_at ? new Date(state.last_run_at).toISOString() : null
        };
        return c.json(body);
    }));
