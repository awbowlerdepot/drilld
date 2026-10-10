import { z } from 'zod';
import { gripStyleSchema } from './customers';
import { drillSheetSpecSchema, type DrillSheetSpec } from './drillSheetSpec';

/**
 * Drill sheets API contract, shared by the API Lambda (amplify/api) and the
 * frontend (src/services). A drill sheet is the bowler's fit; its content
 * lives in revisions. A draft revision is edited in place until it is
 * approved or drilled; after that, saving starts a new draft revision.
 */

const optionalUuid = z.string().uuid().nullish().transform(value => value ?? null);

/** Body of POST /customers/:customerId/drill-sheets: the sheet and its first draft. */
export const drillSheetCreateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    gripStyle: gripStyleSchema,
    /** Where the fitting happened. */
    locationID: optionalUuid,
    /** Without spec.delivery, the customer's current delivery is copied in. */
    spec: drillSheetSpecSchema.default({}),
    revisionNotes: z.string().trim().max(2000).nullish().transform(value => value || null)
});

/** Body of PATCH /drill-sheets/:id. */
export const drillSheetUpdateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    gripStyle: gripStyleSchema,
    archived: z.boolean()
}).partial();

/**
 * Body of PUT /drill-sheets/:id/draft. Saves the current draft in place, or
 * starts a new draft revision when the current one is locked.
 */
export const drillSheetDraftSchema = z.object({
    spec: drillSheetSpecSchema,
    revisionNotes: z.string().trim().max(2000).nullish().transform(value => value || null),
    locationID: optionalUuid,
    /**
     * The revision the client was editing. When given and no longer current
     * (someone else saved meanwhile), the save is refused with 409.
     */
    basedOnRevisionID: z.string().uuid().nullish()
});

export type DrillSheetCreate = z.input<typeof drillSheetCreateSchema>;
export type DrillSheetUpdate = z.input<typeof drillSheetUpdateSchema>;
export type DrillSheetDraft = z.input<typeof drillSheetDraftSchema>;

/** A revision's state: a draft can be edited; approved or drilled revisions are locked. */
export interface DrillSheetRevisionSummaryDto {
    id: string;
    version: number;
    locationID: string | null;
    createdByUserID: string;
    createdByName: string | null;
    /** Who last saved it (a draft is edited in place). */
    updatedByUserID: string | null;
    updatedByName: string | null;
    revisionNotes: string | null;
    approvedByUserID: string | null;
    approvedByName: string | null;
    approvedAt: string | null;
    /** Used on at least one work order. */
    drilled: boolean;
    /** A draft: not approved and not drilled. */
    editable: boolean;
    /** The sheet's current revision. */
    isCurrent: boolean;
    /** A draft that was discarded (no longer current, never approved or drilled). */
    discarded: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DrillSheetRevisionDto extends DrillSheetRevisionSummaryDto {
    specSchemaVersion: number;
    spec: DrillSheetSpec;
}

export interface DrillSheetDto {
    id: string;
    customerID: string;
    name: string;
    gripStyle: z.infer<typeof gripStyleSchema>;
    archived: boolean;
    currentRevision: DrillSheetRevisionDto | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Whether a sheet has a thumb hole. A "Two-handed (no thumb)" sheet never
 * does (no thumb, no thumb spans), whatever its spec says; a bowler can have
 * one alongside a sheet with a thumb for a spare ball.
 */
export const sheetHasThumb = (gripStyle: z.infer<typeof gripStyleSchema>, spec: { holes: { thumb: { enabled: boolean } } }) =>
    gripStyle !== 'TWO_HANDED_NO_THUMB' && spec.holes.thumb.enabled;
