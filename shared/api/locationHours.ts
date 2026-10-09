import { z } from 'zod';

/**
 * A location's address and opening hours, structured the way listing
 * platforms (Google Business Profile, Facebook, Apple, Yelp) take them, so
 * they can be synced. Times are 24-hour "HH:MM" in the location's time zone.
 */

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = typeof WEEKDAYS[number];

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 09:00');

/** Open from `open` to `close`. A close at or before the open time runs past midnight (22:00–02:00). */
export const hoursIntervalSchema = z.object({ open: time, close: time }).strict()
    .refine(interval => interval.open !== interval.close, { message: 'Opening and closing times are the same', path: ['close'] });

export type HoursInterval = z.infer<typeof hoursIntervalSchema>;

const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

/** Minutes from midnight that an interval covers, on its own day and (past midnight) into the next. */
const span = (interval: HoursInterval): [number, number] => {
    const start = minutes(interval.open);
    const end = minutes(interval.close);
    return [start, end > start ? end : end + 24 * 60];
};

/** A day's intervals: sorted, not overlapping. An empty list means closed. */
const dayIntervalsSchema = z.array(hoursIntervalSchema).max(4)
    .refine(list => {
        const spans = list.map(span).sort((a, b) => a[0] - b[0]);
        return spans.every((s, i) => i === 0 || s[0] >= spans[i - 1][1]);
    }, 'Times overlap');

export const weeklyHoursSchema = z.object({
    monday: dayIntervalsSchema.default([]),
    tuesday: dayIntervalsSchema.default([]),
    wednesday: dayIntervalsSchema.default([]),
    thursday: dayIntervalsSchema.default([]),
    friday: dayIntervalsSchema.default([]),
    saturday: dayIntervalsSchema.default([]),
    sunday: dayIntervalsSchema.default([])
}).strict();

/** Different hours on one date: closed (a holiday), or open with these intervals. */
export const specialHoursSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
    closed: z.boolean(),
    intervals: dayIntervalsSchema.default([]),
    /** "Christmas", "Tournament weekend". */
    note: z.string().trim().max(100).nullish().transform(value => value || null)
}).strict().refine(special => special.closed || special.intervals.length > 0, {
    message: 'Add the hours, or mark it closed', path: ['intervals']
});

/** "9:00 AM - 9:00 PM", "Closed", "By Appointment": the free-text hours used before. */
const LEGACY_RANGE = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i;
const to24 = (hour: string, minute: string | undefined, meridiem: string) => {
    const h = (Number(hour) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
    return `${String(h).padStart(2, '0')}:${minute ?? '00'}`;
};

/** Reads the old free-text hours ({ monday: '9:00 AM - 9:00 PM' }) as weekly hours; anything else is closed. */
const upgradeLegacyHours = (hours: unknown) => {
    if (!hours || typeof hours !== 'object' || 'weekly' in hours) return hours;
    const legacy = hours as Record<string, unknown>;
    if (!WEEKDAYS.some(day => typeof legacy[day] === 'string')) return hours;
    const weekly = Object.fromEntries(WEEKDAYS.map(day => {
        const match = typeof legacy[day] === 'string' ? LEGACY_RANGE.exec((legacy[day] as string).trim()) : null;
        return [day, match ? [{ open: to24(match[1], match[2], match[3]), close: to24(match[4], match[5], match[6]) }] : []];
    }));
    return { weekly, special: [], temporarilyClosed: false };
};

export const locationHoursSchema = z.preprocess(upgradeLegacyHours, z.object({
    weekly: weeklyHoursSchema.default({}),
    special: z.array(specialHoursSchema).max(200).default([])
        .refine(list => new Set(list.map(s => s.date)).size === list.length, 'One entry per date'),
    /** Closed until further notice (shown on listings as temporarily closed). */
    temporarilyClosed: z.boolean().default(false)
}).strict());

export type WeeklyHours = z.infer<typeof weeklyHoursSchema>;
export type SpecialHours = z.infer<typeof specialHoursSchema>;
export type LocationHours = z.infer<typeof locationHoursSchema>;

/** A postal address, as listing platforms take it. */
export const locationAddressSchema = z.preprocess(
    // The address used to be one line of text.
    address => (typeof address === 'string' ? { line1: address } : address),
    z.object({
        line1: z.string().trim().max(200).default(''),
        line2: z.string().trim().max(200).nullish().transform(value => value || null),
        city: z.string().trim().max(100).default(''),
        /** State or province. */
        region: z.string().trim().max(100).default(''),
        postalCode: z.string().trim().max(20).default(''),
        country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Two-letter country code').default('US')
    }).strict()
);

export type LocationAddress = z.infer<typeof locationAddressSchema>;
