import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import { SPEC_SCHEMA_VERSION, drillSheetSpecSchema, type DrillSheetSpec } from '../../../shared/api/drillSheetSpec';
import {
    drillSheetCreateSchema,
    drillSheetDraftSchema,
    drillSheetUpdateSchema,
    type DrillSheetDto,
    type DrillSheetRevisionDto,
    type DrillSheetRevisionSummaryDto
} from '../../../shared/api/drillSheets';
import { json, uuid, withCompany, type Tx } from '../db/client';
import type { DrillSheet, DrillSheetRevision } from '../db/schema';
import { HttpError } from '../errors';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';
import type { CurrentUser } from '../auth';

type SheetRow = Selectable<DrillSheet>;
type RevisionRow = Selectable<DrillSheetRevision>;

const idParam = (value: string | undefined, notFound: string) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, notFound);
    return value;
};

const iso = (value: Date | string) => new Date(value).toISOString();

/** The queryable columns written from the spec on every save. */
const promotedColumns = (spec: DrillSheetSpec) => {
    const { thumbToMiddle: middle, thumbToRing: ring } = spec.spans;
    return {
        thumb_to_middle_full_32: middle.full32 ?? null,
        thumb_to_middle_cut_32: middle.cutToCut32 ?? null,
        thumb_to_middle_outer_32: middle.outerToCut32 ?? null,
        thumb_to_middle_ctc_32: middle.centerToCenter32 ?? null,
        thumb_to_middle_fit_32: middle.fit32 ?? null,
        thumb_to_ring_full_32: ring.full32 ?? null,
        thumb_to_ring_cut_32: ring.cutToCut32 ?? null,
        thumb_to_ring_outer_32: ring.outerToCut32 ?? null,
        thumb_to_ring_ctc_32: ring.centerToCenter32 ?? null,
        thumb_to_ring_fit_32: ring.fit32 ?? null,
        bridge_32: spec.bridge.distance32 ?? null,
        thumb_size_64: spec.holes.thumb.size64 ?? null,
        middle_size_64: spec.holes.middle.size64 ?? null,
        ring_size_64: spec.holes.ring.size64 ?? null
    };
};

const FINGER_HOLES = ['middle', 'ring', 'index', 'pinky'] as const;

/**
 * Checks catalog inserts and thumb hardware against the grip catalog: the
 * size exists, is the right kind, and the sheet's size, O.D. and install
 * style are ones it offers. ("Other" pieces, with no gripSizeId, aren't checked.)
 */
const checkInsertsAgainstCatalog = async (tx: Tx, spec: DrillSheetSpec) => {
    for (const finger of FINGER_HOLES) {
        const insert = spec.holes[finger]?.insert;
        if (!insert?.gripSizeId) continue;
        const size = await tx.selectFrom('grip_size')
            .innerJoin('grip_line', 'grip_line.id', 'grip_size.line_id')
            .select(['grip_size.size64', 'grip_size.od64_choices', 'grip_line.kind', 'grip_line.install_styles'])
            .where('grip_size.id', '=', uuid(insert.gripSizeId))
            .executeTakeFirst();
        const problem = !size ? 'is not in the grip catalog'
            : size.kind !== 'FINGER_INSERT' ? 'is not a finger insert'
                : insert.size64 != null && insert.size64 !== size.size64 ? 'has the wrong size for its catalog entry'
                    : !size.od64_choices.includes(insert.od64) ? 'has an O.D. its catalog entry doesn\'t offer'
                        : insert.installStyle && !size.install_styles.includes(insert.installStyle) ? 'has an install style its line doesn\'t offer'
                            : null;
        if (problem) throw new HttpError(400, `The ${finger} finger insert ${problem}`);
    }

    const hardware = spec.holes.thumb.hardware;
    if (hardware?.gripSizeId) {
        const size = await tx.selectFrom('grip_size')
            .innerJoin('grip_line', 'grip_line.id', 'grip_size.line_id')
            .select(['grip_size.size64', 'grip_size.od64_choices', 'grip_line.kind'])
            .where('grip_size.id', '=', uuid(hardware.gripSizeId))
            .executeTakeFirst();
        const problem = !size ? 'is not in the grip catalog'
            : size.kind !== hardware.kind ? 'is a different kind of piece in the catalog'
                : hardware.size64 != null && hardware.size64 !== size.size64 ? 'has the wrong size for its catalog entry'
                    : !size.od64_choices.includes(hardware.od64) ? 'has an O.D. its catalog entry doesn\'t offer'
                        : null;
        if (problem) throw new HttpError(400, `The thumb hardware ${problem}`);
    }
};

/** A stored spec, validated against its schema version. */
const readSpec = (row: RevisionRow): DrillSheetSpec => {
    if (row.spec_schema_version !== SPEC_SCHEMA_VERSION) {
        throw new Error(`Unsupported drill sheet spec version ${row.spec_schema_version} on revision ${row.id}`);
    }
    return drillSheetSpecSchema.parse(row.spec);
};

/** The ids, among these revisions, used on a work order (and so locked). */
const drilledRevisionIds = async (tx: Tx, revisionIds: string[]): Promise<Set<string>> => {
    if (revisionIds.length === 0) return new Set();
    const rows = await tx.selectFrom('work_order')
        .select('drill_sheet_revision_id')
        .distinct()
        .where('drill_sheet_revision_id', 'in', revisionIds.map(uuid))
        .execute();
    return new Set(rows.map(row => row.drill_sheet_revision_id).filter((id): id is string => id !== null));
};

/** What a revision's summary needs besides its row: which are drilled, people's names, and the sheet's current revision. */
interface RevisionContext {
    drilled: Set<string>;
    names: Map<string, string>;
    currentIds: Set<string>;
}

const loadRevisionContext = async (tx: Tx, rows: RevisionRow[], currentIds: (string | null)[]): Promise<RevisionContext> => {
    const userIds = [...new Set(rows.flatMap(row => [row.created_by_user_id, row.updated_by_user_id, row.approved_by_user_id])
        .filter((id): id is string => !!id))];
    const users = userIds.length === 0 ? [] : await tx.selectFrom('app_user')
        .select(['id', 'first_name', 'last_name'])
        .where('id', 'in', userIds.map(uuid))
        .execute();
    return {
        drilled: await drilledRevisionIds(tx, rows.map(row => row.id)),
        names: new Map(users.map(user => [user.id, `${user.first_name} ${user.last_name}`.trim()])),
        currentIds: new Set(currentIds.filter((id): id is string => !!id))
    };
};

const toSummaryDto = (row: RevisionRow, context: RevisionContext): DrillSheetRevisionSummaryDto => {
    const drilled = context.drilled.has(row.id);
    const isCurrent = context.currentIds.has(row.id);
    const name = (id: string | null) => (id ? context.names.get(id) ?? null : null);
    return {
        id: row.id,
        version: row.version,
        locationID: row.location_id,
        createdByUserID: row.created_by_user_id,
        createdByName: name(row.created_by_user_id),
        updatedByUserID: row.updated_by_user_id,
        updatedByName: name(row.updated_by_user_id),
        revisionNotes: row.revision_notes,
        approvedByUserID: row.approved_by_user_id,
        approvedByName: name(row.approved_by_user_id),
        approvedAt: row.approved_at ? iso(row.approved_at) : null,
        drilled,
        editable: !row.approved_at && !drilled,
        isCurrent,
        // A draft that's no longer current was discarded (new drafts only start from approved or drilled revisions).
        discarded: !isCurrent && !row.approved_at && !drilled,
        createdAt: iso(row.created_at),
        updatedAt: iso(row.updated_at)
    };
};

const toRevisionDto = (row: RevisionRow, context: RevisionContext): DrillSheetRevisionDto => ({
    ...toSummaryDto(row, context),
    specSchemaVersion: row.spec_schema_version,
    spec: readSpec(row)
});

const toSheetDto = (sheet: SheetRow, current: RevisionRow | undefined, context: RevisionContext): DrillSheetDto => ({
    id: sheet.id,
    // Customer sheets only: templates (no customer) are not served by this API yet.
    customerID: sheet.customer_id as string,
    name: sheet.name,
    gripStyle: sheet.grip_style as DrillSheetDto['gripStyle'],
    archived: sheet.archived_at !== null,
    currentRevision: current ? toRevisionDto(current, context) : null,
    createdAt: iso(sheet.created_at),
    updatedAt: iso(sheet.updated_at)
});

/** Sheets with their current revisions, in one round of queries. */
const toSheetDtos = async (tx: Tx, sheets: SheetRow[]): Promise<DrillSheetDto[]> => {
    const currentIds = sheets.map(sheet => sheet.current_revision_id).filter((id): id is string => id !== null);
    const revisions = currentIds.length === 0 ? [] : await tx.selectFrom('drill_sheet_revision').selectAll()
        .where('id', 'in', currentIds.map(uuid))
        .execute();
    const byId = new Map(revisions.map(revision => [revision.id, revision]));
    const context = await loadRevisionContext(tx, revisions, currentIds);
    return sheets.map(sheet => toSheetDto(sheet, sheet.current_revision_id ? byId.get(sheet.current_revision_id) : undefined, context));
};

const findSheet = async (tx: Tx, id: string, options: { lock?: boolean } = {}): Promise<SheetRow> => {
    let query = tx.selectFrom('drill_sheet').selectAll()
        .where('id', '=', uuid(id))
        .where('is_template', '=', false);
    if (options.lock) query = query.forUpdate();
    const sheet = await query.executeTakeFirst();
    if (!sheet) throw new HttpError(404, 'Drill sheet not found');
    return sheet;
};

const findRevision = async (tx: Tx, sheetId: string | undefined, version: string | undefined): Promise<{ sheet: SheetRow; row: RevisionRow }> => {
    const sheet = await findSheet(tx, idParam(sheetId, 'Drill sheet not found'));
    const number = Number(version);
    if (!Number.isInteger(number) || number < 1) throw new HttpError(404, 'Revision not found');
    const row = await tx.selectFrom('drill_sheet_revision').selectAll()
        .where('drill_sheet_id', '=', uuid(sheet.id))
        .where('version', '=', number)
        .executeTakeFirst();
    if (!row) throw new HttpError(404, 'Revision not found');
    return { sheet, row };
};

const sheetDto = async (tx: Tx, id: string) => (await toSheetDtos(tx, [await findSheet(tx, id)]))[0];

/**
 * /customers/:customerId/drill-sheets: a customer's sheets. Drill sheets
 * belong to the company and are shared across its locations.
 */
/**
 * Creates a drill sheet and its first draft revision for a customer (without
 * spec.delivery, the customer's current delivery is copied in). Returns the
 * sheet id. Also used by paper import.
 */
export const createSheetWithDraft = async (tx: Tx, user: CurrentUser, customerId: string, input: ReturnType<typeof drillSheetCreateSchema.parse>): Promise<string> => {
    const customer = await tx.selectFrom('customer').selectAll()
        .where('id', '=', uuid(customerId))
        .executeTakeFirst();
    if (!customer) throw new HttpError(404, 'Customer not found');

    await checkInsertsAgainstCatalog(tx, input.spec);
    const spec: DrillSheetSpec = {
        ...input.spec,
        delivery: input.spec.delivery ?? {
            axisTiltDegrees: customer.axis_tilt_degrees === null ? null : Number(customer.axis_tilt_degrees),
            axisRotationDegrees: customer.axis_rotation_degrees === null ? null : Number(customer.axis_rotation_degrees),
            papOver32: customer.pap_over_32,
            papUp32: customer.pap_up_32,
            speedMph: customer.speed_mph === null ? null : Number(customer.speed_mph),
            revRateRpm: customer.rev_rate_rpm
        }
    };

    const sheet = await tx.insertInto('drill_sheet')
        .values({
            company_id: uuid(user.companyId),
            customer_id: uuid(customerId),
            name: input.name,
            grip_style: input.gripStyle
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    const revision = await tx.insertInto('drill_sheet_revision')
        .values({
            company_id: uuid(user.companyId),
            drill_sheet_id: uuid(sheet.id),
            version: 1,
            location_id: input.locationID ? uuid(input.locationID) : null,
            created_by_user_id: uuid(user.userId),
            updated_by_user_id: uuid(user.userId),
            revision_notes: input.revisionNotes,
            spec: json(spec),
            spec_schema_version: SPEC_SCHEMA_VERSION,
            ...promotedColumns(spec)
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    await tx.updateTable('drill_sheet')
        .set({ current_revision_id: uuid(revision.id) })
        .where('id', '=', uuid(sheet.id))
        .execute();
    return sheet.id;
};

export const customerDrillSheets = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:drillsheets');
        const customerId = idParam(c.req.param('customerId'), 'Customer not found');
        let query = tx.selectFrom('drill_sheet').selectAll()
            .where('customer_id', '=', uuid(customerId))
            .where('is_template', '=', false);
        if (c.req.query('archived') !== 'true') query = query.where('archived_at', 'is', null);
        const sheets = await query.orderBy('archived_at', 'desc').orderBy('updated_at', 'desc').execute();
        return c.json(await toSheetDtos(tx, sheets));
    }))

    /** Creates the sheet and its first draft revision. */
    .post('/', async c => {
        const customerId = idParam(c.req.param('customerId'), 'Customer not found');
        const input = drillSheetCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:drillsheets', input.locationID ?? undefined);

            const sheetId = await createSheetWithDraft(tx, c.var.user, customerId, input);
            return c.json(await sheetDto(tx, sheetId), 201);
        });
    });

/** /drill-sheets/:id: one sheet, its draft and its revision history. */
export const drillSheets = new Hono<ApiEnv>()
    .get('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:drillsheets');
        return c.json(await sheetDto(tx, idParam(c.req.param('id'), 'Drill sheet not found')));
    }))

    /** Renames, changes the grip style, or archives/unarchives a sheet. */
    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'), 'Drill sheet not found');
        const input = drillSheetUpdateSchema.parse(await c.req.json());
        const changes = {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.gripStyle !== undefined && { grip_style: input.gripStyle }),
            ...(input.archived !== undefined && { archived_at: input.archived ? sql<Date>`now()` : null })
        };
        if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');

        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:drillsheets');
            await findSheet(tx, id);
            await tx.updateTable('drill_sheet').set(changes).where('id', '=', uuid(id)).execute();
            return c.json(await sheetDto(tx, id));
        });
    })

    /**
     * Saves the draft. The current revision is updated in place while it's a
     * draft; once it's approved or drilled, a new draft revision is started.
     */
    .put('/:id/draft', async c => {
        const id = idParam(c.req.param('id'), 'Drill sheet not found');
        const input = drillSheetDraftSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            // Locking the sheet serializes concurrent saves to it.
            const sheet = await findSheet(tx, id, { lock: true });
            await checkInsertsAgainstCatalog(tx, input.spec);
            if (sheet.archived_at) throw new HttpError(409, 'This drill sheet is archived');
            if (input.basedOnRevisionID && input.basedOnRevisionID !== sheet.current_revision_id) {
                throw new HttpError(409, 'Someone else saved this drill sheet meanwhile. Reload it and try again.');
            }

            const current = sheet.current_revision_id
                ? await tx.selectFrom('drill_sheet_revision').selectAll()
                    .where('id', '=', uuid(sheet.current_revision_id))
                    .executeTakeFirstOrThrow()
                : undefined;
            const locationId = input.locationID ?? current?.location_id ?? null;
            requirePermission(await loadAccess(tx, c.var.user), 'write:drillsheets', locationId ?? undefined);

            const editable = current
                && !current.approved_at
                && !(await drilledRevisionIds(tx, [current.id])).has(current.id);
            const content = {
                location_id: locationId ? uuid(locationId) : null,
                revision_notes: input.revisionNotes,
                spec: json(input.spec),
                spec_schema_version: SPEC_SCHEMA_VERSION,
                ...promotedColumns(input.spec)
            };

            if (editable) {
                await tx.updateTable('drill_sheet_revision')
                    .set({ ...content, updated_by_user_id: uuid(c.var.user.userId) })
                    .where('id', '=', uuid(current.id))
                    .execute();
            } else {
                const latest = await tx.selectFrom('drill_sheet_revision')
                    .select(eb => eb.fn.max('version').as('version'))
                    .where('drill_sheet_id', '=', uuid(id))
                    .executeTakeFirst();
                const revision = await tx.insertInto('drill_sheet_revision')
                    .values({
                        company_id: uuid(c.var.user.companyId),
                        drill_sheet_id: uuid(id),
                        version: (latest?.version ?? 0) + 1,
                        created_by_user_id: uuid(c.var.user.userId),
                        updated_by_user_id: uuid(c.var.user.userId),
                        ...content
                    })
                    .returning('id')
                    .executeTakeFirstOrThrow();
                await tx.updateTable('drill_sheet')
                    .set({ current_revision_id: uuid(revision.id) })
                    .where('id', '=', uuid(id))
                    .execute();
            }
            // Saving counts as a change to the sheet (sorts recently worked sheets first).
            await tx.updateTable('drill_sheet').set({ updated_at: sql<Date>`now()` }).where('id', '=', uuid(id)).execute();

            return c.json(await sheetDto(tx, id));
        });
    })

    /**
     * Discards the current draft revision: the revision it started from (the
     * latest approved or drilled one) becomes current again. Only for a saved draft (not approved, not drilled) with
     * an earlier revision to go back to. Revisions are never deleted, so the
     * discarded draft stays in the history; the next save starts a new one.
     */
    .post('/:id/draft/discard', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const id = idParam(c.req.param('id'), 'Drill sheet not found');
        const sheet = await findSheet(tx, id, { lock: true });
        if (sheet.archived_at) throw new HttpError(409, 'This drill sheet is archived');
        const current = sheet.current_revision_id
            ? await tx.selectFrom('drill_sheet_revision').selectAll()
                .where('id', '=', uuid(sheet.current_revision_id))
                .executeTakeFirstOrThrow()
            : undefined;
        if (!current) throw new HttpError(409, 'This drill sheet has no revisions');
        requirePermission(await loadAccess(tx, c.var.user), 'write:drillsheets', current.location_id ?? undefined);
        if (current.approved_at || (await drilledRevisionIds(tx, [current.id])).has(current.id)) {
            throw new HttpError(409, 'Only a draft can be discarded; this revision is approved or drilled');
        }
        // A new draft only starts from an approved or drilled revision, so go back
        // to the latest of those (skipping any draft discarded before).
        const previous = await tx.selectFrom('drill_sheet_revision').select('id')
            .where('drill_sheet_id', '=', uuid(id))
            .where('version', '<', current.version)
            .where(eb => eb.or([
                eb('approved_at', 'is not', null),
                eb.exists(eb.selectFrom('work_order').select('id').whereRef('work_order.drill_sheet_revision_id', '=', 'drill_sheet_revision.id'))
            ]))
            .orderBy('version', 'desc')
            .executeTakeFirst();
        if (!previous) throw new HttpError(409, 'There is no earlier revision to go back to');

        await tx.updateTable('drill_sheet')
            .set({ current_revision_id: uuid(previous.id), updated_at: sql<Date>`now()` })
            .where('id', '=', uuid(id))
            .execute();
        return c.json(await sheetDto(tx, id));
    }))

    /** Revision history, newest first, without specs. */
    .get('/:id/revisions', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:drillsheets');
        const sheet = await findSheet(tx, idParam(c.req.param('id'), 'Drill sheet not found'));
        const rows = await tx.selectFrom('drill_sheet_revision').selectAll()
            .where('drill_sheet_id', '=', uuid(sheet.id))
            .orderBy('version', 'desc')
            .execute();
        const context = await loadRevisionContext(tx, rows, [sheet.current_revision_id]);
        return c.json(rows.map(row => toSummaryDto(row, context)));
    }))

    .get('/:id/revisions/:version', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:drillsheets');
        const { sheet, row } = await findRevision(tx, c.req.param('id'), c.req.param('version'));
        return c.json(toRevisionDto(row, await loadRevisionContext(tx, [row], [sheet.current_revision_id])));
    }))

    /**
     * Records who approved a revision, and when. Anyone who can edit drill
     * sheets at the revision's location may approve, the author included.
     */
    .post('/:id/revisions/:version/approve', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const { sheet, row } = await findRevision(tx, c.req.param('id'), c.req.param('version'));
        requirePermission(await loadAccess(tx, c.var.user), 'write:drillsheets', row.location_id ?? undefined);
        if (row.approved_at) throw new HttpError(409, 'This revision is already approved');

        const approved = await tx.updateTable('drill_sheet_revision')
            .set({ approved_at: sql<Date>`now()`, approved_by_user_id: uuid(c.var.user.userId) })
            .where('id', '=', uuid(row.id))
            .returningAll()
            .executeTakeFirstOrThrow();
        return c.json(toRevisionDto(approved, await loadRevisionContext(tx, [approved], [sheet.current_revision_id])));
    }));
