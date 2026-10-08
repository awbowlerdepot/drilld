import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import {
    attachmentCreateSchema,
    attachmentUpdateSchema,
    type AttachmentDto,
    type AttachmentUploadDto
} from '../../../shared/api/attachments';
import { uuid, withCompany, type Tx } from '../db/client';
import type { CustomerAttachment } from '../db/schema';
import { HttpError } from '../errors';
import { attachmentKey, deleteFiles, storedFile, uploadUrl, viewUrl } from '../files';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';

type Row = Selectable<CustomerAttachment> & { created_by_name: string | null };

const toDto = async (row: Row): Promise<AttachmentDto> => ({
    id: row.id,
    customerID: row.customer_id,
    fileName: row.file_name,
    contentType: row.content_type as AttachmentDto['contentType'],
    sizeBytes: Number(row.size_bytes),
    kind: row.kind as AttachmentDto['kind'],
    label: row.label,
    rotation: row.rotation as AttachmentDto['rotation'],
    createdByUserID: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    viewUrl: await viewUrl(row.storage_key, row.file_name)
});

const idParam = (value: string | undefined, what: string) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, `${what} not found`);
    return value;
};

/** Attachments with who added them. */
const selectAttachments = (tx: Tx) => tx.selectFrom('customer_attachment as a')
    .leftJoin('app_user as u', 'u.id', 'a.created_by_user_id')
    .selectAll('a')
    .select(sql<string | null>`u.first_name || ' ' || u.last_name`.as('created_by_name'));

const loadAttachment = async (tx: Tx, id: string): Promise<Row> => {
    const row = await selectAttachments(tx).where('a.id', '=', uuid(id)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'File not found');
    return row;
};

/** An upload that was started but never confirmed is dropped after this long. */
const ABANDONED_UPLOAD = '1 hour';

/** GET and POST /customers/:customerId/attachments. */
export const customerAttachments = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        requirePermission(await loadAccess(tx, c.var.user), 'read:customers');
        const rows = await selectAttachments(tx)
            .where('a.customer_id', '=', uuid(idParam(c.req.param('customerId'), 'Customer')))
            .where('a.uploaded', '=', true)
            .orderBy('a.created_at', 'desc')
            .execute();
        return c.json(await Promise.all(rows.map(toDto)));
    }))

    /** Starts an upload: records the file and returns where to PUT it. */
    .post('/', async c => {
        const customerId = idParam(c.req.param('customerId'), 'Customer');
        const input = attachmentCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const customer = await tx.selectFrom('customer').select('id').where('id', '=', uuid(customerId)).executeTakeFirst();
            if (!customer) throw new HttpError(404, 'Customer not found');

            // Tidy up this customer's abandoned uploads.
            const abandoned = await tx.deleteFrom('customer_attachment')
                .where('customer_id', '=', uuid(customerId))
                .where('uploaded', '=', false)
                .where('created_at', '<', sql<Date>`now() - ${ABANDONED_UPLOAD}::interval`)
                .returning('storage_key')
                .execute();
            if (abandoned.length > 0) await deleteFiles(abandoned.map(r => r.storage_key));

            const id = randomUUID();
            const key = attachmentKey(c.var.user.companyId, customerId, id);
            await tx.insertInto('customer_attachment').values({
                id: uuid(id),
                company_id: uuid(c.var.user.companyId),
                customer_id: uuid(customerId),
                storage_key: key,
                file_name: input.fileName,
                content_type: input.contentType,
                size_bytes: input.sizeBytes,
                kind: input.kind,
                created_by_user_id: uuid(c.var.user.userId)
            }).execute();

            const body: AttachmentUploadDto = { id, uploadUrl: await uploadUrl(key, input.contentType, input.sizeBytes) };
            return c.json(body, 201);
        });
    });

/** /attachments/:id: confirm an upload, change it, remove it. */
export const attachments = new Hono<ApiEnv>()
    /** Confirms the file arrived (and is the size and type that was signed for). */
    .post('/:id/complete', c => {
        const id = idParam(c.req.param('id'), 'File');
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const row = await loadAttachment(tx, id);
            if (!row.uploaded) {
                const stored = await storedFile(row.storage_key);
                if (!stored) throw new HttpError(409, 'The file hasn\'t finished uploading');
                if (stored.sizeBytes !== Number(row.size_bytes) || stored.contentType !== row.content_type) {
                    throw new HttpError(409, 'The uploaded file doesn\'t match');
                }
                await tx.updateTable('customer_attachment').set({ uploaded: true }).where('id', '=', uuid(id)).execute();
            }
            return c.json(await toDto(await loadAttachment(tx, id)));
        });
    })

    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'), 'File');
        const input = attachmentUpdateSchema.parse(await c.req.json());
        const changes = {
            ...(input.label !== undefined && { label: input.label }),
            ...(input.kind !== undefined && { kind: input.kind }),
            ...(input.rotation !== undefined && { rotation: input.rotation })
        };
        if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'write:customers');
            const result = await tx.updateTable('customer_attachment').set(changes)
                .where('id', '=', uuid(id)).where('uploaded', '=', true)
                .executeTakeFirst();
            if (Number(result.numUpdatedRows) === 0) throw new HttpError(404, 'File not found');
            return c.json(await toDto(await loadAttachment(tx, id)));
        });
    })

    /** Whoever added a file can remove it; otherwise it takes delete:customers. */
    .delete('/:id', c => {
        const id = idParam(c.req.param('id'), 'File');
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const access = await loadAccess(tx, c.var.user);
            const row = await loadAttachment(tx, id);
            requirePermission(access, row.created_by_user_id === c.var.user.userId ? 'write:customers' : 'delete:customers');
            await tx.deleteFrom('customer_attachment').where('id', '=', uuid(id)).execute();
            await deleteFiles([row.storage_key]);
            return c.body(null, 204);
        });
    });
