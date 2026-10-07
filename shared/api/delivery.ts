import { z } from 'zod';

/**
 * A bowler's delivery. The customer holds the current values; each drill
 * sheet revision keeps a copy (spec.delivery) as of that fitting.
 * PAP is in 32nds of an inch: over from the center line, and up (negative = down).
 */
export const deliverySchema = z.object({
    axisTiltDegrees: z.number().min(0).max(90).multipleOf(0.1).nullish(),
    axisRotationDegrees: z.number().min(0).max(90).multipleOf(0.1).nullish(),
    papOver32: z.number().int().min(0).max(320).nullish(),
    papUp32: z.number().int().min(-160).max(160).nullish(),
    speedMph: z.number().positive().max(40).multipleOf(0.1).nullish(),
    revRateRpm: z.number().int().positive().max(1000).nullish()
}).strict();

export type Delivery = z.infer<typeof deliverySchema>;

/** A delivery with every field present (null when not recorded), as the API returns it. */
export type DeliveryDto = { [K in keyof Delivery]-?: NonNullable<Delivery[K]> | null };
