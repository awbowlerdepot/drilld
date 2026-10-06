import { z } from 'zod';

/**
 * Customers API contract, shared by the API Lambda (amplify/api) and the
 * frontend (src/services). Field names are camelCase; the API maps them to
 * the database's snake_case columns.
 */

export const dominantHandSchema = z.enum(['LEFT', 'RIGHT']);
export const gripStyleSchema = z.enum(['CONVENTIONAL', 'FINGERTIP', 'TWO_HANDED_NO_THUMB']);

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);

/** Body of POST /customers. */
export const customerCreateSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    email: z.string().trim().email('Enter a valid email address').max(254).nullish().or(z.literal('')).transform(value => value || null),
    phone: optionalText(40),
    dominantHand: dominantHandSchema,
    preferredGripStyle: gripStyleSchema,
    usesThumb: z.boolean(),
    notes: optionalText(5000),
    homeLocationID: z.string().uuid().nullish().transform(value => value ?? null)
});

/** Body of PATCH /customers/:id: any subset of the create fields. */
export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreate = z.input<typeof customerCreateSchema>;
export type CustomerUpdate = z.input<typeof customerUpdateSchema>;

/** A customer as returned by the API. */
export interface CustomerDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dominantHand: z.infer<typeof dominantHandSchema>;
    preferredGripStyle: z.infer<typeof gripStyleSchema>;
    usesThumb: boolean;
    notes: string | null;
    homeLocationID: string | null;
    createdAt: string;
    updatedAt: string;
}
