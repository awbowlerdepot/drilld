import { z } from 'zod';

/**
 * Customer attachments API contract: files on a bowler's profile, mainly
 * photos and scans of their paper drill sheets. Uploading takes three steps:
 * POST /customers/:id/attachments (returns a short-lived upload URL), PUT the
 * file to that URL, then POST /attachments/:id/complete.
 */

/** Phone photos and scans. HEIC isn't accepted: browsers can't show it (iPhones send JPEG to a web page). */
export const ATTACHMENT_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_KINDS = ['DRILL_SHEET', 'OTHER'] as const;
export const ATTACHMENT_ROTATIONS = [0, 90, 180, 270] as const;

export type AttachmentContentType = typeof ATTACHMENT_CONTENT_TYPES[number];
export type AttachmentKind = typeof ATTACHMENT_KINDS[number];
export type AttachmentRotation = typeof ATTACHMENT_ROTATIONS[number];

const rotationSchema = z.number().int().refine(
    (value): value is AttachmentRotation => (ATTACHMENT_ROTATIONS as readonly number[]).includes(value),
    'Rotation is 0, 90, 180 or 270'
);

/** Body of POST /customers/:customerId/attachments. */
export const attachmentCreateSchema = z.object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(ATTACHMENT_CONTENT_TYPES, { errorMap: () => ({ message: 'Attach a photo (JPEG, PNG or WebP) or a PDF' }) }),
    sizeBytes: z.number().int().positive().max(ATTACHMENT_MAX_BYTES, 'Files can be up to 25 MB'),
    kind: z.enum(ATTACHMENT_KINDS).default('DRILL_SHEET')
}).strict();

/** Body of PATCH /attachments/:id. */
export const attachmentUpdateSchema = z.object({
    label: z.string().trim().max(200).nullable().transform(value => value || null),
    kind: z.enum(ATTACHMENT_KINDS),
    rotation: rotationSchema
}).partial().strict();

export type AttachmentCreate = z.input<typeof attachmentCreateSchema>;
export type AttachmentUpdate = z.input<typeof attachmentUpdateSchema>;

/** An attachment as the API returns it. */
export interface AttachmentDto {
    id: string;
    customerID: string;
    fileName: string;
    contentType: AttachmentContentType;
    sizeBytes: number;
    kind: AttachmentKind;
    label: string | null;
    rotation: AttachmentRotation;
    createdByUserID: string;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
    /** A short-lived URL to view the file (about 15 minutes). */
    viewUrl: string;
}

/** Response of POST /customers/:customerId/attachments. */
export interface AttachmentUploadDto {
    id: string;
    /** PUT the file here, with the same Content-Type, within 15 minutes. */
    uploadUrl: string;
}
