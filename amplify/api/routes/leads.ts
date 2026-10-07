import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import {
    leadNoteCreateSchema,
    leadSignupSchema,
    leadUpdateSchema,
    type LeadDto,
    type LeadNoteDto
} from '../../../shared/api/leads';
import { json, uuid } from '../db/client';
import type { Lead, LeadNote } from '../db/schema';
import { HttpError } from '../errors';
import { notifyNewLead } from '../notify';
import { requirePlatformAdmin, withPlatformAdmin } from '../platform';
import type { ApiEnv } from '../app';

/** A form sent this soon after it was opened was filled in by a bot. */
const MIN_FILL_MS = 3000;

const toDto = (row: Selectable<Lead>, noteCount = 0): LeadDto => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    status: row.status as LeadDto['status'],
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role as LeadDto['role'],
    shopName: row.shop_name,
    city: row.city,
    region: row.region,
    country: row.country,
    locationCount: row.location_count as LeadDto['locationCount'],
    shopType: row.shop_type as LeadDto['shopType'],
    ballsPerMonth: row.balls_per_month as LeadDto['ballsPerMonth'],
    drillerCount: row.driller_count as LeadDto['drillerCount'],
    drillPress: row.drill_press as LeadDto['drillPress'],
    currentTools: row.current_tools as LeadDto['currentTools'],
    currentSoftware: row.current_software,
    grips: (row.grips ?? []) as LeadDto['grips'],
    timeline: row.timeline as LeadDto['timeline'],
    painPoint: row.pain_point,
    heardFrom: row.heard_from,
    marketingConsent: row.marketing_consent,
    source: (row.source as Record<string, string>) ?? {},
    companyID: row.company_id,
    noteCount
});

const toNoteDto = (row: Selectable<LeadNote>): LeadNoteDto => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    authorName: row.author_name,
    body: row.body
});

const idParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Lead not found');
    return value;
};

/**
 * POST /public/leads: the drilld.io early access form. No sign-in (API
 * Gateway throttles the route). It can only add a new lead, never read one.
 */
export const publicLeads = new Hono<ApiEnv>()
    .post('/', async c => {
        const input = leadSignupSchema.parse(await c.req.json());

        // Spam: the hidden field was filled in, or the form went back too fast. Answer as if it worked.
        if (input.website || (input.startedAt && Date.now() - input.startedAt < MIN_FILL_MS)) {
            console.log('Lead signup dropped as spam');
            return c.json({ ok: true }, 201);
        }

        const id = randomUUID();
        // No RETURNING: a signup can't read leads (row-level security).
        await c.var.db.insertInto('lead').values({
            id: uuid(id),
            first_name: input.firstName,
            last_name: input.lastName,
            email: input.email,
            phone: input.phone,
            role: input.role,
            shop_name: input.shopName,
            city: input.city,
            region: input.region,
            country: input.country,
            location_count: input.locationCount,
            shop_type: input.shopType,
            balls_per_month: input.ballsPerMonth,
            driller_count: input.drillerCount,
            drill_press: input.drillPress,
            current_tools: input.currentTools,
            current_software: input.currentSoftware,
            // The Data API has no array parameters.
            grips: sql<string[]>`string_to_array(${input.grips.join(',')}, ',')::text[]`,
            timeline: input.timeline,
            pain_point: input.painPoint,
            heard_from: input.heardFrom,
            marketing_consent: input.marketingConsent,
            source: json(input.source)
        }).execute();
        console.log(`Lead ${id} signed up`);

        await notifyNewLead({ ...input, id, grips: input.grips, source: input.source });
        return c.json({ ok: true }, 201);
    });

/** Working leads: platform admins only. */
export const leads = new Hono<ApiEnv>()
    .use('*', async (c, next) => {
        await requirePlatformAdmin(c.var.claims);
        await next();
    })

    .get('/', c => withPlatformAdmin(c.var.db, c.var.user.companyId, async tx => {
        const rows = await tx.selectFrom('lead')
            .selectAll('lead')
            .select(eb => eb.selectFrom('lead_note').whereRef('lead_note.lead_id', '=', 'lead.id')
                .select(eb.fn.countAll<number>().as('n')).as('note_count'))
            .orderBy('created_at', 'desc')
            .limit(1000)
            .execute();
        return c.json(rows.map(row => toDto(row, Number(row.note_count ?? 0))));
    }))

    .get('/:id', c => withPlatformAdmin(c.var.db, c.var.user.companyId, async tx => {
        const id = idParam(c.req.param('id'));
        const row = await tx.selectFrom('lead').selectAll().where('id', '=', uuid(id)).executeTakeFirst();
        if (!row) throw new HttpError(404, 'Lead not found');
        const notes = await tx.selectFrom('lead_note').selectAll().where('lead_id', '=', uuid(id)).orderBy('created_at', 'desc').execute();
        return c.json({ lead: toDto(row, notes.length), notes: notes.map(toNoteDto) });
    }))

    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'));
        const input = leadUpdateSchema.parse(await c.req.json());
        return withPlatformAdmin(c.var.db, c.var.user.companyId, async tx => {
            const row = await tx.updateTable('lead').set({ status: input.status }).where('id', '=', uuid(id)).returningAll().executeTakeFirst();
            if (!row) throw new HttpError(404, 'Lead not found');
            return c.json(toDto(row));
        });
    })

    .post('/:id/notes', async c => {
        const id = idParam(c.req.param('id'));
        const input = leadNoteCreateSchema.parse(await c.req.json());
        return withPlatformAdmin(c.var.db, c.var.user.companyId, async tx => {
            const exists = await tx.selectFrom('lead').select('id').where('id', '=', uuid(id)).executeTakeFirst();
            if (!exists) throw new HttpError(404, 'Lead not found');
            const author = await tx.selectFrom('app_user').select(['first_name', 'last_name'])
                .where('id', '=', uuid(c.var.user.userId)).executeTakeFirstOrThrow();
            const row = await tx.insertInto('lead_note')
                .values({ lead_id: uuid(id), author_name: `${author.first_name} ${author.last_name}`.trim(), body: input.body })
                .returningAll()
                .executeTakeFirstOrThrow();
            return c.json(toNoteDto(row), 201);
        });
    })

    /** For spam and test signups. Real leads are marked Not a fit instead. */
    .delete('/:id', c => withPlatformAdmin(c.var.db, c.var.user.companyId, async tx => {
        const id = idParam(c.req.param('id'));
        const row = await tx.deleteFrom('lead').where('id', '=', uuid(id)).returning('id').executeTakeFirst();
        if (!row) throw new HttpError(404, 'Lead not found');
        return c.body(null, 204);
    }));
