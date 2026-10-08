import { z } from 'zod';
import { ATTACHMENT_CONTENT_TYPES, ATTACHMENT_MAX_BYTES } from './attachments';
import { drillSheetSpecSchema } from './drillSheetSpec';
import { customerCreateSchema, gripStyleSchema } from './customers';
import type { PaperSheetReading, PaperTemplate } from './paperReading';

/**
 * Paper import API contract: pages of paper drill sheets, read by AI, then
 * reviewed and imported as a customer attachment plus a draft drill sheet.
 * Upload is like attachments: POST /paper-imports (returns an upload URL),
 * PUT the file, POST /paper-imports/:id/complete (starts the reading).
 */

export const SPAN_TYPE_KEYS = ['full32', 'cutToCut32', 'outerToCut32', 'centerToCenter32', 'fit32'] as const;
export type SpanTypeKey = typeof SPAN_TYPE_KEYS[number];

export type PaperImportStatus = 'UPLOADING' | 'READING' | 'READ' | 'FAILED' | 'IMPORTED' | 'DISCARDED';

/** Body of POST /paper-imports. */
export const paperImportCreateSchema = z.object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(ATTACHMENT_CONTENT_TYPES, { errorMap: () => ({ message: 'Attach a photo (JPEG, PNG or WebP) or a PDF' }) }),
    sizeBytes: z.number().int().positive().max(ATTACHMENT_MAX_BYTES, 'Files can be up to 25 MB'),
    /** Where it's being imported (recorded on the drill sheet's first revision). */
    locationID: z.string().uuid().nullish().transform(value => value ?? null)
}).strict();

/**
 * Body of POST /paper-imports/:id/import: the reviewed result. Either an
 * existing customer or a new one, and the drill sheet to create.
 */
export const paperImportAcceptSchema = z.object({
    customer: z.union([
        z.object({ id: z.string().uuid() }).strict(),
        z.object({ create: customerCreateSchema }).strict()
    ]),
    sheetName: z.string().trim().min(1, 'Name the drill sheet').max(100),
    gripStyle: gripStyleSchema,
    spanType: z.enum(SPAN_TYPE_KEYS),
    spec: drillSheetSpecSchema
}).strict();

export type PaperImportCreate = z.input<typeof paperImportCreateSchema>;
export type PaperImportAccept = z.input<typeof paperImportAcceptSchema>;

export interface PaperImportDto {
    id: string;
    fileName: string;
    contentType: (typeof ATTACHMENT_CONTENT_TYPES)[number];
    status: PaperImportStatus;
    /** The AI reading, once read. */
    reading: PaperSheetReading | null;
    template: PaperTemplate | null;
    error: string | null;
    readAt: string | null;
    locationID: string | null;
    /** The span type this company last used for this template's sheets, if any. */
    suggestedSpanType: SpanTypeKey | null;
    customerID: string | null;
    drillSheetID: string | null;
    createdByName: string | null;
    createdAt: string;
    /** A short-lived URL to view the page (about 15 minutes). */
    viewUrl: string;
}

/** Response of POST /paper-imports. */
export interface PaperImportUploadDto {
    id: string;
    uploadUrl: string;
}

/** Response of POST /paper-imports/:id/import. */
export interface PaperImportResultDto {
    customerID: string;
    drillSheetID: string;
}
