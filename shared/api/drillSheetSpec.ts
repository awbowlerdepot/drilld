import { z } from 'zod';
import { deliverySchema } from './delivery';

/**
 * Drill sheet spec, version 1 (docs/data-model.md, "spec contents").
 * Stored in drill_sheet_revision.spec; validated on every write and read.
 *
 * Units: spans, bridge, pitch and depths are whole 32nds of an inch
 * (4-3/8"+ = 141); drill bit and hole sizes are whole 64ths; angles are degrees.
 * A draft can be incomplete, so every measurement is optional.
 */
export const SPEC_SCHEMA_VERSION = 1;

const inches32 = (max: number) => z.number().int().positive().max(max);
const size64 = z.number().int().positive().max(192);         // up to 3"
const signed32 = z.number().int().min(-64).max(64);           // pitch, up to 2" either way
const notes = z.string().trim().max(2000).nullish();

/** One span, as each type was measured. Types are never converted into one another. */
const spanFields = {
    full32: inches32(320).nullish(),            // gripping edge to gripping edge
    cutToCut32: inches32(320).nullish(),        // drilled edge to drilled edge, before hardware
    outerToCut32: inches32(320).nullish(),      // outer thumb hardware edge (no inner) to finger drilled edge
    centerToCenter32: inches32(320).nullish(),  // CAD/CNC
    fit32: inches32(320).nullish(),             // finger hole center to thumb cut edge
    notes
};
export const spanSchema = z.object(spanFields).strict();

export const fingerNameSchema = z.enum(['THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY']);

const customSpanSchema = z.object({
    name: z.string().trim().min(1).max(100),
    from: fingerNameSchema,
    to: fingerNameSchema,
    ...spanFields
}).strict();

/** Forward/reverse and lateral pitch. Negative forward = reverse; negative lateral = left. */
export const pitchSchema = z.object({
    forward32: signed32.nullish(),
    lateral32: signed32.nullish()
}).strict();

const bevelSchema = z.object({
    angleDegrees: z.number().min(0).max(90),
    depth32: inches32(64)
}).strict();

const drillingStepSchema = z.object({
    step: z.number().int().positive(),
    bitSize64: size64,
    depth32: inches32(160).nullish(),
    notes
}).strict();

export const insertManufacturerSchema = z.enum(['VISE', 'Turbo', 'JoPo', 'Other']);

const insertSchema = z.object({
    manufacturer: insertManufacturerSchema,
    insertSize64: size64.nullish(),
    type: z.string().trim().max(100).nullish(),
    model: z.string().trim().max(100).nullish(),
    color: z.string().trim().max(50).nullish()
}).strict();

const slugSchema = z.object({
    manufacturer: z.string().trim().max(100).nullish(),
    type: z.string().trim().max(100).nullish(),
    size64: size64.nullish(),
    interchangeable: z.boolean().default(false),
    notes
}).strict();

/**
 * Thumb oval, measured with bits after drilling: the bit that fits the narrow
 * side (pilot) and the wide side (width), and the angle from horizontal
 * (0 = across, 90 = up and down; mirrored for left-handers). Cuts are calculated.
 */
const thumbOvalSchema = z.object({
    angleDegrees: z.number().min(0).max(90),
    pilotHole64: size64,
    width64: size64
}).strict().refine(oval => oval.width64 > oval.pilotHole64, {
    message: 'The width bit must be larger than the pilot',
    path: ['width64']
});

/** Finger oval: only widens, away from the bridge. Height is the hole's bit size. */
const fingerOvalSchema = z.object({
    width64: size64
}).strict();

const holeFields = {
    size64: size64.nullish(),
    outsideDiameter64: size64.nullish(),   // the outer hole drilled for an insert or slug
    depth32: inches32(160).nullish(),
    pitch: pitchSchema.default({}),
    bevel: bevelSchema.nullish(),
    drillingSequence: z.array(drillingStepSchema).max(20).nullish(),
    notes
};

export const thumbHoleSchema = z.object({
    enabled: z.boolean().default(true),
    ...holeFields,
    oval: thumbOvalSchema.nullish(),
    slug: slugSchema.nullish()
}).strict();

export const fingerHoleSchema = z.object({
    ...holeFields,
    insert: insertSchema.nullish(),
    fingerOval: fingerOvalSchema.nullish()
}).strict().refine(hole => !hole.fingerOval || !hole.size64 || hole.fingerOval.width64 > hole.size64, {
    message: 'The oval width bit must be larger than the hole size',
    path: ['fingerOval', 'width64']
});

export const drillSheetSpecSchema = z.object({
    spans: z.object({
        thumbToMiddle: spanSchema.default({}),
        thumbToRing: spanSchema.default({}),
        custom: z.array(customSpanSchema).max(10).default([])
    }).strict().default({}),
    bridge: z.object({
        distance32: z.number().int().min(0).max(64).nullish(),   // edge-to-edge, middle ↔ ring
        notes
    }).strict().default({}),
    holes: z.object({
        thumb: thumbHoleSchema.default({}),
        middle: fingerHoleSchema.default({}),
        ring: fingerHoleSchema.default({}),
        index: fingerHoleSchema.nullish(),
        pinky: fingerHoleSchema.nullish()
    }).strict().default({}),
    fitting: z.object({
        flexibilityDegrees: z.number().int().min(0).max(180).nullish(),
        proFit: z.boolean().default(false),
        cltDegrees: z.number().int().min(0).max(90).nullish()     // only shown when drillSheets.enableClt is on
    }).strict().default({}),
    delivery: deliverySchema.nullish(),
    fittingNotes: notes,
    notes,
    customerPreferences: notes,
    restrictions: z.array(z.string().trim().min(1).max(200)).max(20).default([])
}).strict();

/** A spec as sent by a client (defaults not yet applied). */
export type DrillSheetSpecInput = z.input<typeof drillSheetSpecSchema>;
/** A validated spec, with defaults applied. */
export type DrillSheetSpec = z.output<typeof drillSheetSpecSchema>;
