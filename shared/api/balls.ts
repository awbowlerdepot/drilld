import { z } from 'zod';

/**
 * Balls API contract: the BowlerIQ catalog (Drilld's synced copy), and a
 * company's physical balls. A physical ball is a catalog ball (one id per
 * colorway) at a weight, made unique by its serial number, and registered in
 * a platform-wide registry so its history follows it between shops. Other
 * shops only ever see anonymous facts about it (docs/data-model.md, Balls).
 */

export interface CatalogWeightDto {
    weightLbs: number;
    /** Inches. */
    rg: number | null;
    differential: number | null;
    massBias: number | null;
}

/**
 * A ball model (one colorway), as shown when picking a ball: from the BowlerIQ
 * catalog, or typed in by the shop because the catalog doesn't have it.
 */
export interface CatalogBallDto {
    id: string;
    /** 'shop': typed in by this company (older balls BowlerIQ doesn't publish). */
    source: 'catalog' | 'shop';
    /** The BowlerIQ brand; null for a shop entry with a brand BowlerIQ doesn't have. */
    brandId: string | null;
    brandName: string;
    name: string;
    color: string | null;
    /** null for a shop entry (not known). */
    status: 'current' | 'retired' | null;
    releaseDate: string | null;
    imageUrl: string | null;
    coverstock: { name: string | null; material: string | null; type: string | null } | null;
    core: { name: string | null; type: string | null } | null;
    finish: string | null;
    weights: CatalogWeightDto[];
    /** No longer published by BowlerIQ: kept for balls already registered, hidden when picking. */
    removed: boolean;
}

export interface CatalogBrandDto {
    id: string;
    name: string;
    ballCount: number;
}

/** GET /catalog/status. */
export interface CatalogStatusDto {
    ballCount: number;
    lastRunAt: string | null;
}

/** Anonymous history of a physical ball, across every shop that has worked on it. */
export interface BallHistoryDto {
    drillCount: number;
    plugCount: number;
    lastWorkedMonth: string | null;
}

export const serialSchema = z.string().trim().max(50).nullish()
    .transform(value => (value ? value.replace(/\s+/g, '').toUpperCase() : null));
const inches = z.number().min(0).max(10).nullish().transform(value => value ?? null);
const ounces = z.number().min(0).max(10).nullish().transform(value => value ?? null);
const optionalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')]).nullish().transform(value => value || null);

const optionalText = z.string().trim().max(100).nullish().transform(value => value || null);

/** A ball the catalog doesn't have, typed in by the shop. */
export const shopBallModelSchema = z.object({
    /** The BowlerIQ brand, when it's one of theirs (keeps serial matching across shops). */
    brandId: z.string().uuid().nullish().transform(value => value ?? null),
    /** Ignored when brandId is given (the catalog's name is used). */
    brandName: z.string().trim().min(1, 'Enter the brand').max(100),
    name: z.string().trim().min(1, 'Enter the ball\'s name').max(100),
    color: optionalText,
    coverstock: optionalText,
    core: optionalText
}).strict();

/**
 * Body of POST /balls: register a bowler's ball. The ball is one of: a
 * catalog ball, a ball the shop typed in before, or a new one typed in now.
 */
export const ballRegisterSchema = z.object({
    catalogBallId: z.string().uuid().nullish(),
    shopModelId: z.string().uuid().nullish(),
    newModel: shopBallModelSchema.nullish(),
    weightLbs: z.number().int().min(6).max(16),
    /** Optional; without one the ball can't be matched at another shop. Spaces are dropped and it's upper-cased. */
    serialNumber: serialSchema,
    /** The API also requires a real customer id (mock data uses short ids). */
    customerId: z.string().min(1, 'Pick the bowler'),
    /** Pin to CG, inches. */
    pinDistance: inches,
    /** Ounces. */
    topWeight: ounces,
    purchaseDate: optionalDate,
    notes: z.string().trim().max(2000).nullish().transform(value => value || null)
}).strict().refine(value => [value.catalogBallId, value.shopModelId, value.newModel].filter(Boolean).length === 1,
    { message: 'Pick the ball', path: ['catalogBallId'] });

/** Body of PATCH /balls/:id. The ball itself (catalog ball, weight, serial) is fixed once registered. */
export const ballUpdateSchema = z.object({
    pinDistance: inches,
    topWeight: ounces,
    status: z.enum(['ACTIVE', 'RETIRED', 'DAMAGED']),
    purchaseDate: optionalDate,
    notes: z.string().trim().max(2000).nullish().transform(value => value || null)
}).partial().strict();

/** Body of POST /balls/:id/transfer: the ball now belongs to another bowler. */
export const ballTransferSchema = z.object({ customerId: z.string().min(1, 'Pick the bowler') }).strict();

export type BallRegister = z.input<typeof ballRegisterSchema>;
export type ShopBallModel = z.input<typeof shopBallModelSchema>;
export type BallUpdate = z.input<typeof ballUpdateSchema>;
export type BallStatus = 'ACTIVE' | 'RETIRED' | 'DAMAGED';

/** A company's ball. `id` is the company's record; `ballId` the registry entry. */
export interface BallDto {
    id: string;
    ballId: string;
    catalogBall: CatalogBallDto;
    weightLbs: number;
    serialNumber: string | null;
    pinDistance: number | null;
    topWeight: number | null;
    status: BallStatus;
    purchaseDate: string | null;
    notes: string | null;
    owner: { customerId: string; name: string; since: string } | null;
    createdAt: string;
    updatedAt: string;
}

/** GET /balls/:id: the ball, its owners over time, and its anonymous history. */
export interface BallDetailDto extends BallDto {
    owners: { customerId: string; name: string; from: string; to: string | null }[];
    history: BallHistoryDto;
}

/** GET /balls/lookup?brandId&serial: what's known about a serial before registering it. */
export interface BallLookupDto {
    /** Registered at some shop (this one or another). */
    registered: boolean;
    /** The catalog ball it's registered as; null when it isn't a catalog ball. */
    catalogBall: CatalogBallDto | null;
    weightLbs: number | null;
    history: BallHistoryDto | null;
    /** This company's record of it, if it has one. */
    companyBallId: string | null;
}
