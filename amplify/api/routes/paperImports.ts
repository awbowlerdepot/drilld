import { randomUUID } from 'node:crypto';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import {
    paperImportAcceptSchema,
    paperImportCreateSchema,
    type PaperImportDto,
    type PaperImportResultDto,
    type PaperImportUploadDto,
    type SpanTypeKey
} from '../../../shared/api/paperImports';
import { paperSheetReadingSchema, type PaperSheetReading, type PaperTemplate } from '../../../shared/api/paperReading';
import { json, uuid, withCompany, type Tx } from '../db/client';
import type { PaperImport } from '../db/schema';
import { HttpError } from '../errors';
import { deleteFiles, paperImportKey, storedFile, uploadUrl, viewUrl } from '../files';
import { loadAccess, requirePermission } from '../permissions';
import type { ReadPaperImportEvent } from '../readerHandler';
import type { ApiEnv } from '../app';
import { insertCustomer } from './customers';
import { createSheetWithDraft } from './drillSheets';

type Row = Selectable<PaperImport> & { created_by_name: string | null };

const lambda = new LambdaClient({});
const OPEN = ['UPLOADING', 'READING', 'READ', 'FAILED'];

const idParam = (value: string | undefined) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, 'Import not found');
    return value;
};

const selectImports = (tx: Tx) => tx.selectFrom('paper_import as p')
    .leftJoin('app_user as u', 'u.id', 'p.created_by_user_id')
    .selectAll('p')
    .select(sql<string | null>`u.first_name || ' ' || u.last_name`.as('created_by_name'));

const loadImport = async (tx: Tx, id: string): Promise<Row> => {
    const row = await selectImports(tx).where('p.id', '=', uuid(id)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Import not found');
    return row;
};

/** The span type the company chose the last time it imported this template's sheets. */
const lastSpanTypes = async (tx: Tx): Promise<Map<string, SpanTypeKey>> => {
    const rows = await tx.selectFrom('paper_import')
        .select(['template', 'span_type'])
        .where('status', '=', 'IMPORTED')
        .where('span_type', 'is not', null)
        .orderBy('imported_at', 'desc')
        .limit(50)
        .execute();
    const byTemplate = new Map<string, SpanTypeKey>();
    for (const row of rows) {
        if (row.template && !byTemplate.has(row.template)) byTemplate.set(row.template, row.span_type as SpanTypeKey);
    }
    return byTemplate;
};

const toDto = async (row: Row, spanTypes: Map<string, SpanTypeKey>): Promise<PaperImportDto> => ({
    id: row.id,
    fileName: row.file_name,
    contentType: row.content_type as PaperImportDto['contentType'],
    status: row.status as PaperImportDto['status'],
    reading: (row.reading as PaperSheetReading | null) ?? null,
    template: (row.template as PaperTemplate | null) ?? null,
    error: row.error,
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    locationID: row.location_id,
    suggestedSpanType: (row.template && spanTypes.get(row.template)) || null,
    customerID: row.customer_id,
    drillSheetID: row.drill_sheet_id,
    createdByName: row.created_by_name,
    createdAt: new Date(row.created_at).toISOString(),
    viewUrl: await viewUrl(row.storage_key, row.file_name)
});

/** Starts the reader Lambda without waiting for it (reading takes ~30s). */
const startReading = async (event: ReadPaperImportEvent) => {
    const functionName = process.env.READER_FUNCTION;
    if (!functionName) throw new Error('Missing environment variable READER_FUNCTION');
    await lambda.send(new InvokeCommand({ FunctionName: functionName, InvocationType: 'Event', Payload: JSON.stringify(event) }));
};

/**
 * /paper-imports: pages of paper drill sheets. Upload one or many; each is
 * read by AI in the background; a person reviews each one and imports it as a
 * customer attachment plus a draft drill sheet, or discards it.
 */
export const paperImports = new Hono<ApiEnv>()
    /** Open imports (not yet imported or discarded), newest first. */
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
        const rows = await selectImports(tx).where('p.status', 'in', OPEN).orderBy('p.created_at', 'desc').limit(500).execute();
        const spanTypes = await lastSpanTypes(tx);
        return c.json(await Promise.all(rows.map(row => toDto(row, spanTypes))));
    }))

    .get('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
        return c.json(await toDto(await loadImport(tx, idParam(c.req.param('id'))), await lastSpanTypes(tx)));
    }))

    /** Starts an upload: records the page and returns where to PUT it. */
    .post('/', async c => {
        const input = paperImportCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            // Tidy up this user's abandoned uploads.
            const abandoned = await tx.deleteFrom('paper_import')
                .where('created_by_user_id', '=', uuid(c.var.user.userId))
                .where('status', '=', 'UPLOADING')
                .where('created_at', '<', sql<Date>`now() - '1 hour'::interval`)
                .returning('storage_key')
                .execute();
            if (abandoned.length > 0) await deleteFiles(abandoned.map(r => r.storage_key));

            const id = randomUUID();
            const key = paperImportKey(c.var.user.companyId, id);
            await tx.insertInto('paper_import').values({
                id: uuid(id),
                company_id: uuid(c.var.user.companyId),
                location_id: input.locationID ? uuid(input.locationID) : null,
                storage_key: key,
                file_name: input.fileName,
                content_type: input.contentType,
                size_bytes: input.sizeBytes,
                created_by_user_id: uuid(c.var.user.userId)
            }).execute();
            const body: PaperImportUploadDto = { id, uploadUrl: await uploadUrl(key, input.contentType, input.sizeBytes) };
            return c.json(body, 201);
        });
    })

    /** Confirms the upload and starts reading it. */
    .post('/:id/complete', c => {
        const id = idParam(c.req.param('id'));
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await loadImport(tx, id);
            if (row.status === 'UPLOADING') {
                const stored = await storedFile(row.storage_key);
                if (!stored) throw new HttpError(409, 'The file hasn\'t finished uploading');
                if (stored.sizeBytes !== Number(row.size_bytes) || stored.contentType !== row.content_type) {
                    throw new HttpError(409, 'The uploaded file doesn\'t match');
                }
                await tx.updateTable('paper_import').set({ status: 'READING' }).where('id', '=', uuid(id)).execute();
                await startReading({ importId: id, companyId: c.var.user.companyId });
            }
            return c.json(await toDto(await loadImport(tx, id), await lastSpanTypes(tx)));
        });
    })

    /** Reads a page again (after it failed, or to try again). */
    .post('/:id/retry', c => {
        const id = idParam(c.req.param('id'));
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await loadImport(tx, id);
            if (row.status !== 'FAILED' && row.status !== 'READ') throw new HttpError(409, 'Only a read or failed page can be read again');
            await tx.updateTable('paper_import').set({ status: 'READING', error: null }).where('id', '=', uuid(id)).execute();
            await startReading({ importId: id, companyId: c.var.user.companyId });
            return c.json(await toDto(await loadImport(tx, id), await lastSpanTypes(tx)));
        });
    })

    /**
     * Imports the reviewed page: creates the customer (or uses the chosen one),
     * attaches the page to them, and creates the drill sheet with the reviewed
     * values as draft revision 1.
     */
    .post('/:id/import', async c => {
        const id = idParam(c.req.param('id'));
        const input = paperImportAcceptSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const access = await loadAccess(tx, c.var.user);
            requirePermission(access, 'write:customers');
            const row = await loadImport(tx, id);
            requirePermission(access, 'write:drillsheets', row.location_id ?? undefined);
            if (row.status !== 'READ' && row.status !== 'FAILED') throw new HttpError(409, 'This page has already been imported or discarded');

            // Corrections must be a whole reading; anything else is ignored rather than stored.
            const corrected = input.correctedReading ? paperSheetReadingSchema.safeParse(input.correctedReading) : null;
            if (corrected && !corrected.success) throw new HttpError(400, 'The corrected reading isn\'t valid');

            const customerId = 'id' in input.customer
                ? (await tx.selectFrom('customer').select('id').where('id', '=', uuid(input.customer.id)).executeTakeFirst())?.id
                : (await insertCustomer(tx, c.var.user.companyId, input.customer.create)).id;
            if (!customerId) throw new HttpError(404, 'Customer not found');

            const attachment = await tx.insertInto('customer_attachment').values({
                company_id: uuid(c.var.user.companyId),
                customer_id: uuid(customerId),
                storage_key: row.storage_key,
                file_name: row.file_name,
                content_type: row.content_type,
                size_bytes: row.size_bytes,
                kind: 'DRILL_SHEET',
                label: row.template && row.template !== 'UNKNOWN' && row.template !== 'OTHER'
                    ? `${row.template.charAt(0)}${row.template.slice(1).toLowerCase()} sheet (imported)`
                    : 'Paper sheet (imported)',
                uploaded: true,
                created_by_user_id: uuid(c.var.user.userId)
            }).returning('id').executeTakeFirstOrThrow();

            const drillSheetId = await createSheetWithDraft(tx, c.var.user, customerId, {
                name: input.sheetName,
                gripStyle: input.gripStyle,
                locationID: row.location_id,
                spec: input.spec,
                revisionNotes: 'Imported from a paper drill sheet'
            });

            await tx.updateTable('paper_import').set({
                status: 'IMPORTED',
                span_type: input.spanType,
                customer_id: uuid(customerId),
                attachment_id: uuid(attachment.id),
                drill_sheet_id: uuid(drillSheetId),
                imported_spec: json(input.spec),
                corrected_reading: corrected?.success ? json(corrected.data) : null,
                imported_at: sql`now()`,
                imported_by_user_id: uuid(c.var.user.userId)
            }).where('id', '=', uuid(id)).execute();

            const body: PaperImportResultDto = { customerID: customerId, drillSheetID: drillSheetId };
            return c.json(body, 201);
        });
    })

    /** Discards a page that won't be imported (and removes the file). */
    .delete('/:id', c => {
        const id = idParam(c.req.param('id'));
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await loadImport(tx, id);
            if (row.status === 'IMPORTED') throw new HttpError(409, 'This page was imported; remove it from the customer\'s files instead');
            await tx.updateTable('paper_import').set({ status: 'DISCARDED' }).where('id', '=', uuid(id)).execute();
            await deleteFiles([row.storage_key]);
            return c.body(null, 204);
        });
    });
