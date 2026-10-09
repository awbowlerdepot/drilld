import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { sql } from 'kysely';
import { createDb, json, uuid } from './db/client';

// The BowlerIQ ball catalog sync (docs/data-model.md, Ball catalog). Runs on
// a schedule: reads the change feed from where it left off, upserts or
// removes each ball in Drilld's copy, and saves the cursor after each page,
// so a crash or timeout resumes safely (applying a page twice is harmless).
// Connects as drilld_catalog_sync_job, which can write only the catalog.

const BASE_URL = 'https://api.bowleriq.io/partner/v1';
const PAGE_SIZE = 100;
/** Stop starting new pages with this much time left, and pick up next run. */
const TIME_RESERVE_MS = 60_000;
const PARTNER_KEY_SECRET = process.env.BOWLERIQ_KEY_SECRET ?? 'drilld/bowleriq-partner-key';

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable ${name}`);
    return value;
};

const db = createDb({
    clusterArn: required('CLUSTER_ARN'),
    secretArn: required('DB_SECRET_ARN'),
    database: required('DATABASE_NAME')
});

let partnerKey: Promise<string> | null = null;
const loadPartnerKey = () => {
    partnerKey ??= new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: PARTNER_KEY_SECRET }))
        .then(secret => {
            const key = (JSON.parse(secret.SecretString ?? '{}') as { apiKey?: string }).apiKey;
            if (!key) throw new Error(`Secret ${PARTNER_KEY_SECRET} has no apiKey`);
            return key;
        })
        .catch(error => { partnerKey = null; throw error; });
    return partnerKey;
};

interface Ball {
    id: string;
    name: string;
    brand: { id: string; name: string };
    status: 'current' | 'retired';
    color?: string | null;
    content_changed_at: string;
}

interface ChangesPage {
    items: { change: 'upsert' | 'remove'; id: string; ball?: Ball }[];
    next_cursor: string;
    has_more: boolean;
}

/** GET with backoff on 429 and 5xx (the API allows about 10 requests a second). */
const fetchPage = async (cursor: string | null): Promise<ChangesPage> => {
    const url = `${BASE_URL}/changes?limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    for (let attempt = 0; ; attempt++) {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${await loadPartnerKey()}`, Accept: 'application/json' } });
        if (response.ok) return response.json() as Promise<ChangesPage>;
        if ((response.status === 429 || response.status >= 500) && attempt < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
            continue;
        }
        throw new Error(`BowlerIQ ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
};

const applyPage = (page: ChangesPage) => db.transaction().execute(async tx => {
    for (const item of page.items) {
        if (item.change === 'upsert' && item.ball) {
            const ball = item.ball;
            await tx.insertInto('catalog_ball').values({
                id: uuid(ball.id),
                brand_id: uuid(ball.brand.id),
                brand_name: ball.brand.name,
                name: ball.name,
                color: ball.color ?? null,
                status: ball.status,
                data: json(ball),
                content_changed_at: sql`cast(${ball.content_changed_at} as timestamptz)`,
                removed_at: null,
                synced_at: sql`now()`
            }).onConflict(oc => oc.column('id').doUpdateSet({
                brand_id: uuid(ball.brand.id),
                brand_name: ball.brand.name,
                name: ball.name,
                color: ball.color ?? null,
                status: ball.status,
                data: json(ball),
                content_changed_at: sql`cast(${ball.content_changed_at} as timestamptz)`,
                removed_at: null,
                synced_at: sql`now()`
            })).execute();
        } else if (item.change === 'remove') {
            // Never deleted: registered balls keep pointing at it.
            await tx.updateTable('catalog_ball').set({ removed_at: sql`coalesce(removed_at, now())` }).where('id', '=', uuid(item.id)).execute();
        }
    }
    await tx.updateTable('catalog_sync_state').set({ cursor: page.next_cursor, last_run_at: sql`now()` }).where('id', '=', 1).execute();
});

export const handler = async (_event: unknown, context: { getRemainingTimeInMillis: () => number }) => {
    const state = await db.selectFrom('catalog_sync_state').select('cursor').where('id', '=', 1).executeTakeFirstOrThrow();
    let cursor = state.cursor;
    let upserts = 0;
    let removes = 0;
    let pages = 0;
    for (;;) {
        const page = await fetchPage(cursor);
        await applyPage(page);
        pages++;
        upserts += page.items.filter(i => i.change === 'upsert').length;
        removes += page.items.filter(i => i.change === 'remove').length;
        cursor = page.next_cursor;
        if (!page.has_more) break;
        if (context.getRemainingTimeInMillis() < TIME_RESERVE_MS) {
            console.log('Out of time; the next run continues from the saved cursor');
            break;
        }
    }
    if (pages === 1 && upserts === 0 && removes === 0) {
        await db.updateTable('catalog_sync_state').set({ last_run_at: sql`now()` }).where('id', '=', 1).execute();
    }
    console.log(`Catalog sync: ${pages} page(s), ${upserts} upserted, ${removes} removed`);
    return { pages, upserts, removes };
};
