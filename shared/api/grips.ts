import { z } from 'zod';

/**
 * Grip catalog API contract: manufacturer lines of finger inserts, slugs and
 * thumb hardware, and what each location carries (docs/data-model.md,
 * "Grip catalog"). Sizes are 64ths of an inch.
 */

export const gripManufacturerSchema = z.enum(['VISE', 'TURBO', 'JOPO']);
export const gripKindSchema = z.enum(['FINGER_INSERT', 'FINGER_SLUG', 'THUMB_INSERT', 'THUMB_SLUG', 'INTERCHANGEABLE_THUMB']);

export type GripManufacturer = z.infer<typeof gripManufacturerSchema>;
export type GripKind = z.infer<typeof gripKindSchema>;

export interface GripSizeDto {
    id: string;
    /** The grip size (finger/thumb hole), or the slug size, in 64ths. */
    size64: number;
    /** The manufacturer's label: '8.5', '61', '1/6', '13/16'. */
    label: string;
    /** The O.D. bit(s) in 64ths; the first is the default. */
    od64Choices: number[];
    /** Drilled with a preset-collar hardware bit. */
    collar: boolean;
}

export interface GripLineDto {
    id: string;
    manufacturer: GripManufacturer;
    name: string;
    kind: GripKind;
    /** Picked on the work order, not the drill sheet. */
    colors: string[];
    /**
     * The ways the insert installs, picked on the drill sheet. A two-way insert
     * has two (VISE P/O: Power Lift or Oval); empty when there's no choice.
     */
    installStyles: string[];
    sizes: GripSizeDto[];
}

/** GET/PUT /locations/:locationId/grip-stock: the catalog sizes a location carries. */
export const gripStockSchema = z.object({
    gripSizeIds: z.array(z.string().uuid()).max(2000)
});

export type GripStock = z.infer<typeof gripStockSchema>;
