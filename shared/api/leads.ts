import { z } from 'zod';

/**
 * Leads API contract: early access signups from drilld.io (POST
 * /public/leads), and working them (/leads, platform admins only). The codes
 * match the lead table's check constraints (db/migrations/0012_leads.sql).
 */

/** Choices with the labels the signup form and the Leads screen show. */
export const LEAD_OPTIONS = {
    role: { OWNER: 'Owner', MANAGER: 'Manager', DRILLER: 'Driller / tech', OTHER: 'Other' },
    locationCount: { ONE: '1', TWO_TO_FOUR: '2–4', FIVE_PLUS: '5+' },
    shopType: { BOWLING_CENTER: 'In a bowling center', STANDALONE: 'Standalone', MOBILE: 'Mobile / tournament' },
    ballsPerMonth: { UNDER_25: 'Under 25', '25_TO_75': '25–75', '75_TO_150': '75–150', OVER_150: '150+' },
    drillerCount: { ONE: '1', TWO_TO_THREE: '2–3', FOUR_PLUS: '4+' },
    drillPress: { MANUAL: 'Manual', DIGITAL_READOUT: 'Digital readout', CNC: 'CNC' },
    currentTools: { PAPER: 'Paper', SPREADSHEET: 'Spreadsheet', SOFTWARE: 'Other software', OTHER: 'Other' },
    grips: { VISE: 'VISE', TURBO: 'Turbo', JOPO: 'JoPo', OTHER: 'Other' },
    timeline: { NOW: 'Now', WITHIN_3_MONTHS: 'Within 3 months', LOOKING: 'Just looking' },
    status: {
        NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', DEMO: 'Demo',
        ONBOARDED: 'Onboarded', NOT_A_FIT: 'Not a fit', SPAM: 'Spam'
    }
} as const;

type Options = typeof LEAD_OPTIONS;
const codes = <K extends keyof Options>(key: K) =>
    Object.keys(LEAD_OPTIONS[key]) as [keyof Options[K] & string, ...(keyof Options[K] & string)[]];

const text = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max);

/** Body of POST /public/leads: the drilld.io early access form. */
export const leadSignupSchema = z.object({
    firstName: required(100, 'First name is required'),
    lastName: required(100, 'Last name is required'),
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
    phone: text(40),
    role: z.enum(codes('role')),
    shopName: required(200, 'Shop name is required'),
    city: text(100),
    region: text(100),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).default('US'),
    locationCount: z.enum(codes('locationCount')),
    shopType: z.enum(codes('shopType')).nullish().transform(value => value ?? null),
    ballsPerMonth: z.enum(codes('ballsPerMonth')),
    drillerCount: z.enum(codes('drillerCount')).nullish().transform(value => value ?? null),
    drillPress: z.enum(codes('drillPress')).nullish().transform(value => value ?? null),
    currentTools: z.enum(codes('currentTools')).nullish().transform(value => value ?? null),
    currentSoftware: text(200),
    grips: z.array(z.enum(codes('grips'))).max(4).default([]),
    timeline: z.enum(codes('timeline')).nullish().transform(value => value ?? null),
    painPoint: text(2000),
    heardFrom: text(200),
    marketingConsent: z.boolean().default(false),
    /** Where the signup came from: referrer and utm_* tags. */
    source: z.record(z.string().max(500)).default({}).refine(value => Object.keys(value).length <= 10),
    /** Spam checks: a field people never see (must stay empty), and when the form was opened (ms since epoch). */
    website: z.string().max(200).optional(),
    startedAt: z.number().int().optional()
});

export type LeadSignup = z.input<typeof leadSignupSchema>;
export type LeadStatus = keyof Options['status'];

/** A lead as the Leads screen sees it. */
export interface LeadDto {
    id: string;
    createdAt: string;
    updatedAt: string;
    status: LeadStatus;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: keyof Options['role'];
    shopName: string;
    city: string | null;
    region: string | null;
    country: string;
    locationCount: keyof Options['locationCount'];
    shopType: keyof Options['shopType'] | null;
    ballsPerMonth: keyof Options['ballsPerMonth'];
    drillerCount: keyof Options['drillerCount'] | null;
    drillPress: keyof Options['drillPress'] | null;
    currentTools: keyof Options['currentTools'] | null;
    currentSoftware: string | null;
    grips: (keyof Options['grips'])[];
    timeline: keyof Options['timeline'] | null;
    painPoint: string | null;
    heardFrom: string | null;
    marketingConsent: boolean;
    source: Record<string, string>;
    companyID: string | null;
    noteCount: number;
}

export interface LeadNoteDto {
    id: string;
    createdAt: string;
    authorName: string;
    body: string;
}

/** PATCH /leads/:id */
export const leadUpdateSchema = z.object({ status: z.enum(codes('status')) }).strict();

/** POST /leads/:id/notes */
export const leadNoteCreateSchema = z.object({ body: z.string().trim().min(1, 'Write a note').max(5000) }).strict();

/**
 * How promising a lead looks, 0–100, for sorting: volume, size, timeline and
 * how they work today (paper and spreadsheets are the easiest switch). A
 * calculation, never stored, so the weights can change.
 */
export const leadFitScore = (lead: Pick<LeadDto, 'ballsPerMonth' | 'locationCount' | 'timeline' | 'currentTools' | 'role'>): number => {
    const volume = { UNDER_25: 5, '25_TO_75': 20, '75_TO_150': 30, OVER_150: 35 }[lead.ballsPerMonth];
    const size = { ONE: 10, TWO_TO_FOUR: 20, FIVE_PLUS: 25 }[lead.locationCount];
    const timeline = lead.timeline ? { NOW: 20, WITHIN_3_MONTHS: 12, LOOKING: 3 }[lead.timeline] : 5;
    const tools = lead.currentTools ? { PAPER: 10, SPREADSHEET: 10, SOFTWARE: 6, OTHER: 5 }[lead.currentTools] : 5;
    const decider = lead.role === 'OWNER' || lead.role === 'MANAGER' ? 10 : 4;
    return volume + size + timeline + tools + decider;
};
