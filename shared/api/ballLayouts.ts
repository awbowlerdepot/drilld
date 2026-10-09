import { z } from 'zod';
import { LayoutError, QUARTER_ROUND, solveLayout, type LayoutInput, type SolvedLayout } from '../layout/ballLayout';

/**
 * Ball layouts: how a ball was laid out for one drilling, in the system the
 * driller worked in. Distances in 32nds of an inch (as measured along the
 * surface), angles in degrees. The other systems' numbers are calculated
 * (shared/layout/ballLayout.ts), never stored.
 *
 * - PIN_BUFFER: Storm's pin buffer / VLS numbers, pin to PAP × PSA to PAP × pin buffer ("5 x 4 x 2").
 * - DUAL_ANGLE: MoRich's Dual Angle, drilling angle × pin to PAP × VAL angle ("50° x 5 x 30°").
 * - TWO_LS: Storm's 2LS for two-handed bowlers, pin to PAP × PSA to PAP × pin to COG ("5 x 3-1/2 x 4"); the
 *   center of grip is the center of the bridge, and the PAP is measured from it.
 */

export const layoutSystems = ['PIN_BUFFER', 'DUAL_ANGLE', 'TWO_LS'] as const;
export type LayoutSystem = (typeof layoutSystems)[number];

const MAX_32 = QUARTER_ROUND * 32; // 6¾″
const inches32 = (max: number) => z.number().int().min(0).max(max);

const pap = z.object({
    /** From the reference point along the midline, toward the PAP side. */
    over32: inches32(320),
    /** Up from the midline; negative = down. */
    up32: z.number().int().min(-160).max(160)
}).strict();

const common = {
    pinToPap32: inches32(MAX_32).min(1, 'Pin to PAP is more than 0'),
    pap,
    /** The bowler's hand, as drilled (the layout is drawn mirrored for a left-hander). */
    hand: z.enum(['RIGHT', 'LEFT']),
    /** Pin to PSA on this ball as used: the MB's distance, or 6¾″ (216) through the CG. */
    psaDistance32: z.number().int().min(1).max(432),
    layoutSchemaVersion: z.literal(1)
};

const pinBufferNumbers = {
    psaToPap32: inches32(432),
    pinBuffer32: inches32(MAX_32)
};

export const ballLayoutSchema = z.discriminatedUnion('system', [
    z.object({ system: z.literal('PIN_BUFFER'), ...common, ...pinBufferNumbers }).strict(),
    z.object({ system: z.literal('TWO_LS'), ...common, pinToCog32: inches32(432), psaToPap32: inches32(432) }).strict(),
    z.object({
        system: z.literal('DUAL_ANGLE'), ...common,
        drillingAngle: z.number().min(0).max(180).multipleOf(0.5),
        valAngle: z.number().min(0).max(90).multipleOf(0.5)
    }).strict()
]).superRefine((layout, ctx) => {
    try {
        solveBallLayout(layout);
    } catch (err) {
        if (!(err instanceof LayoutError)) throw err;
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err.message, path: [layout.system === 'DUAL_ANGLE' ? 'drillingAngle' : layout.system === 'TWO_LS' ? 'pinToCog32' : 'psaToPap32'] });
    }
});

export type BallLayout = z.infer<typeof ballLayoutSchema>;

/** Where the layout's PAP is measured from: the center of grip, or the center of the bridge (2LS). */
export const papReference = (system: LayoutSystem) => (system === 'TWO_LS' ? 'BRIDGE_CENTER' : 'GRIP_CENTER');

/** The layout placed on the ball, with its numbers in every system (inches, degrees). */
export const solveBallLayout = (layout: BallLayout): SolvedLayout => {
    const input: LayoutInput = layout.system === 'DUAL_ANGLE'
        ? { system: 'DUAL_ANGLE', drillingAngle: layout.drillingAngle, pinToPap: layout.pinToPap32 / 32, valAngle: layout.valAngle }
        : layout.system === 'TWO_LS'
            ? { system: 'TWO_LS', pinToPap: layout.pinToPap32 / 32, pinToCog: layout.pinToCog32 / 32, psaToPap: layout.psaToPap32 / 32 }
            : { system: 'PIN_BUFFER', pinToPap: layout.pinToPap32 / 32, psaToPap: layout.psaToPap32 / 32, pinBuffer: layout.pinBuffer32 / 32 };
    return solveLayout(input, { papOver: layout.pap.over32 / 32, papUp: layout.pap.up32 / 32, pinToPsa: layout.psaDistance32 / 32 });
};

/** Body of POST /balls/:id/layouts and PATCH /ball-layouts/:id. */
export const ballLayoutWriteSchema = z.object({
    drilledOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
    layout: ballLayoutSchema,
    notes: z.string().trim().max(2000).nullish().transform(value => value || null)
}).strict();

export type BallLayoutWrite = z.input<typeof ballLayoutWriteSchema>;

/** One drilling's layout of a company's ball. */
export interface BallLayoutDto {
    id: string;
    /** The company's ball. */
    companyBallId: string;
    drilledOn: string;
    layout: BallLayout;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}
