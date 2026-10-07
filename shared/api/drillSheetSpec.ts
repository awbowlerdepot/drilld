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

/**
 * A finger insert: a copy of a grip catalog choice (docs/data-model.md,
 * "Grip catalog"), kept on the sheet so it reads the same if the catalog
 * changes. gripSizeId is null for an insert entered by hand ("Other"). Its
 * od64 is the hole's O.D. Color isn't here; it's picked on the work order.
 */
export const insertSchema = z.object({
    gripSizeId: z.string().uuid().nullish(),
    manufacturer: z.string().trim().min(1).max(50),     // 'VISE', 'TURBO', 'JOPO', or free text for Other
    line: z.string().trim().max(100),
    size64: size64.nullish(),
    label: z.string().trim().max(20).nullish(),          // the manufacturer's size label: '8.5', '13/16'
    od64: size64,
    installStyle: z.string().trim().max(50).nullish()    // which way it installs: 'Power Lift', 'Perfect Oval Mesh'
}).strict();

/** Finger insert sizes for a vacu: O.D. − 1/64" (one bit smaller) up to O.D. + 1/16". */
export const VACU_BIT_RANGE = { below: 1, above: 4 } as const;

/**
 * Vacu: the top of a finger insert hole drilled with a different bit than the
 * O.D. Standard is O.D. + 1/16" at 1" deep; a performance fit may use
 * 1/2"–1-1/2" in 1/16" steps.
 */
export const vacuSchema = z.object({
    bit64: size64,
    depth32: z.number().int().min(16).max(48).refine(depth => depth % 2 === 0, 'Vacu depth is in 1/16" steps')
}).strict();

/** The old insert shape (before the grip catalog), read as an "Other" insert. */
const legacyInsertSchema = z.object({
    manufacturer: z.string(),
    insertSize64: z.number().nullish(),
    type: z.string().nullish(),
    model: z.string().nullish(),
    color: z.string().nullish()
}).strict();

export const thumbHardwareKindSchema = z.enum(['THUMB_INSERT', 'THUMB_SLUG', 'INTERCHANGEABLE_THUMB']);

/**
 * Thumb hardware: a thumb insert, a slug/solid, or an interchangeable system
 * (VISE IT, Switch Grip, Twist), copied from the grip catalog (gripSizeId
 * null = "Other"). Its od64 is the hole's O.D. (a collar bit for
 * interchangeable systems). A thumb insert also sets the hole size; a slug or
 * inner has the thumb hole drilled into it, with at least 1/8" of wall.
 */
export const thumbHardwareSchema = z.object({
    gripSizeId: z.string().uuid().nullish(),
    manufacturer: z.string().trim().min(1).max(50),
    line: z.string().trim().max(100),
    kind: thumbHardwareKindSchema,
    size64: size64.nullish(),            // insert grip size, slug size, or IT slug / interchangeable piece size
    label: z.string().trim().max(20).nullish(),
    od64: size64,
    collar: z.boolean().default(false)
}).strict();

/** The old slug shape (before the grip catalog), read as an "Other" piece. */
const legacySlugSchema = z.object({
    manufacturer: z.string().nullish(),
    type: z.string().nullish(),
    size64: z.number().nullish(),
    interchangeable: z.boolean().nullish(),
    notes: z.string().nullish()
}).strict();

const upgradeLegacySlug = (hole: unknown) => {
    if (!hole || typeof hole !== 'object' || !('slug' in hole)) return hole;
    const { slug, ...rest } = hole as Record<string, unknown>;
    const legacy = legacySlugSchema.safeParse(slug);
    if (slug == null || !legacy.success) return rest;
    const od = typeof rest.outsideDiameter64 === 'number' ? rest.outsideDiameter64 : legacy.data.size64 ?? 96;
    return {
        ...rest,
        outsideDiameter64: od,
        notes: [rest.notes, legacy.data.notes].filter(Boolean).join('\n') || null,
        hardware: {
            gripSizeId: null,
            manufacturer: legacy.data.manufacturer || 'Other',
            line: legacy.data.type ?? '',
            kind: legacy.data.interchangeable ? 'INTERCHANGEABLE_THUMB' : 'THUMB_SLUG',
            size64: legacy.data.size64 ?? null,
            label: null,
            od64: od,
            collar: false
        }
    };
};

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

export const thumbHoleSchema = z.preprocess(upgradeLegacySlug, z.object({
    enabled: z.boolean().default(true),
    ...holeFields,
    oval: thumbOvalSchema.nullish(),
    hardware: thumbHardwareSchema.nullish()
}).strict()
    .refine(hole => !hole.hardware || !hole.outsideDiameter64 || hole.outsideDiameter64 === hole.hardware.od64, {
        message: 'The O.D. comes from the thumb hardware',
        path: ['outsideDiameter64']
    }));

/** Reads a hole saved with the old insert shape as an "Other" insert, using the hole's size and O.D. */
const upgradeLegacyInsert = (hole: unknown) => {
    if (!hole || typeof hole !== 'object') return hole;
    const { insert, size64: holeSize, outsideDiameter64 } = hole as Record<string, unknown>;
    const legacy = legacyInsertSchema.safeParse(insert);
    if (!legacy.success) return hole;
    const od = typeof outsideDiameter64 === 'number' ? outsideDiameter64 : 62;
    return {
        ...hole,
        outsideDiameter64: od,
        insert: {
            gripSizeId: null,
            manufacturer: legacy.data.manufacturer,
            line: [legacy.data.type, legacy.data.model].filter(Boolean).join(' '),
            size64: legacy.data.insertSize64 ?? (typeof holeSize === 'number' ? holeSize : null),
            label: null,
            od64: od,
            installStyle: null
        }
    };
};

export const fingerHoleSchema = z.preprocess(upgradeLegacyInsert, z.object({
    ...holeFields,
    insert: insertSchema.nullish(),
    vacu: vacuSchema.nullish(),
    fingerOval: fingerOvalSchema.nullish()
}).strict()
    .refine(hole => !hole.fingerOval || !hole.size64 || hole.fingerOval.width64 > hole.size64, {
        message: 'The oval width bit must be larger than the hole size',
        path: ['fingerOval', 'width64']
    })
    .refine(hole => !hole.insert || !hole.outsideDiameter64 || hole.outsideDiameter64 === hole.insert.od64, {
        message: 'The O.D. comes from the insert',
        path: ['outsideDiameter64']
    })
    .refine(hole => !hole.vacu || !!hole.insert, { message: 'Vacu is only for finger insert holes', path: ['vacu'] })
    .refine(hole => !hole.vacu || !hole.insert
        || (hole.vacu.bit64 >= hole.insert.od64 - VACU_BIT_RANGE.below && hole.vacu.bit64 <= hole.insert.od64 + VACU_BIT_RANGE.above), {
        message: 'The vacu bit must be from one bit under the O.D. to 1/16" over',
        path: ['vacu', 'bit64']
    }));

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
