import { z } from 'zod';
import { locationAddressSchema, locationHoursSchema, type LocationAddress, type LocationHours } from './locationHours';

/**
 * Locations API contract (physical pro shops). Field names follow the
 * frontend's Location type; the API maps them to the location table.
 */

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);

export const equipmentItemSchema = z.object({
    name: z.string().trim().min(1).max(100),
    model: z.string().trim().max(100),
    manufacturer: z.string().trim().max(100).optional(),
    serialNumber: z.string().trim().max(100).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'needs_repair'])
}).strict();

const isTimeZone = (value: string) => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
    } catch {
        return false;
    }
};

const websiteSchema = z.string().trim().max(300).nullish().transform(value => value || null)
    .refine(value => !value || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value), 'Enter a web address starting with https://');
const emailSchema = z.string().trim().max(254).nullish().transform(value => value || null)
    .refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Enter a valid email');

/** Body of POST /locations. */
export const locationCreateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    address: locationAddressSchema.nullish().transform(value => value ?? null),
    phone: optionalText(40),
    email: emailSchema,
    website: websiteSchema,
    timezone: z.string().refine(isTimeZone, 'Pick a time zone'),
    /** Weekly hours, special dates and temporary closure (shared/api/locationHours.ts). */
    hours: locationHoursSchema.nullish().transform(value => value ?? null),
    equipment: z.array(equipmentItemSchema).max(50).default([]),
    /** Overrides of company settings (validated by the frontend's LocationSettingsOverrides shape). */
    settingsOverrides: z.record(z.unknown()).default({}),
    active: z.boolean().default(true)
});

/** Body of PATCH /locations/:id: any subset of the create fields. */
export const locationUpdateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    address: locationAddressSchema.nullable(),
    phone: optionalText(40),
    email: emailSchema,
    website: websiteSchema,
    timezone: z.string().refine(isTimeZone, 'Pick a time zone'),
    hours: locationHoursSchema.nullable(),
    equipment: z.array(equipmentItemSchema).max(50),
    settingsOverrides: z.record(z.unknown()),
    active: z.boolean()
}).partial();

export type LocationCreate = z.input<typeof locationCreateSchema>;
export type LocationUpdate = z.input<typeof locationUpdateSchema>;
export type EquipmentItemDto = z.infer<typeof equipmentItemSchema>;

/** A location as returned by the API. */
export interface LocationDto {
    id: string;
    companyID: string;
    name: string;
    address: LocationAddress | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    timezone: string;
    hours: LocationHours | null;
    equipment: EquipmentItemDto[];
    settingsOverrides: Record<string, unknown>;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
