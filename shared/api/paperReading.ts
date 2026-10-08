// zod/v4 (shipped inside zod 3.25): the Anthropic SDK turns it into the output JSON schema.
import { z } from 'zod/v4';

/**
 * What the AI reading of a paper drill sheet returns: a faithful
 * transcription of what's written, field by field, as the shop wrote it
 * ("4 11/16", "X", "31/32 over 6"). It does no unit conversion and no
 * interpretation of shop shorthand: that's done in code
 * (src/utils/PaperSheetImport.ts), with the template and the company's own
 * conventions, and confirmed by a person before anything is saved.
 */

export const PAPER_TEMPLATES = ['MOTIV', 'STORM', 'ULTIMATE', 'INNOVATIVE', 'OTHER', 'UNKNOWN'] as const;
export type PaperTemplate = typeof PAPER_TEMPLATES[number];

const written = z.string().nullable();

/** A hole as drawn: everything written inside the circle, and anything written right next to it. */
const holeReading = z.object({
    /** Inside the circle, top to bottom; a line drawn across the circle is written " / " (e.g. "31/32 / 6"). */
    inCircle: written,
    /** Next to or above the circle, e.g. "Lift", "VG", ".030". */
    beside: written
});

/**
 * One hole's pitch boxes, by what the printed form says they are. Boxes the
 * form labels Reverse/Forward go in reverse/forward; the lateral boxes go in
 * left/right by their arrow. Unlabeled crosshairs (Ultimate) go by arm: up,
 * down, left, right. "X" means crossed out (no pitch); null means blank or no box.
 */
const pitchReading = z.object({
    reverse: written,
    forward: written,
    left: written,
    right: written,
    up: written,
    down: written
});

const spanReading = z.object({
    value: written,
    /** Anything written with it, e.g. "T-C". */
    annotation: written,
    /** A second value written later (another ink, or squeezed underneath), e.g. "4 12/32". */
    alternate: written
});

const insertRow = z.object({ style: written, size: written });

export const paperSheetReadingSchema = z.object({
    template: z.object({
        brand: z.enum(PAPER_TEMPLATES),
        /** Printed title or logo text, e.g. "MOTIV BOWLING DRILL SPECS". */
        printed: written
    }),
    bowler: z.object({
        /** The name as written, best reading. */
        name: written,
        firstName: written,
        lastName: written,
        phone: written,
        email: written,
        date: written
    }),
    hand: z.enum(['LEFT', 'RIGHT']).nullable(),
    grip: z.enum(['FINGERTIP', 'CONVENTIONAL', 'NO_THUMB']).nullable(),
    twoHanded: z.boolean().nullable(),
    /** The finger hole on the left of the page. */
    leftFinger: holeReading,
    rightFinger: holeReading,
    thumb: holeReading,
    bridge: written,
    /** The span drawn to the left finger hole. */
    leftSpan: spanReading,
    rightSpan: spanReading,
    leftFingerPitch: pitchReading,
    rightFingerPitch: pitchReading,
    thumbPitch: pitchReading,
    oval: z.object({ degree: written, width: written }),
    inserts: z.object({ thumb: insertRow, middle: insertRow, ring: insertRow }),
    layout: written,
    pap: written,
    ball: z.object({ name: written, weight: written, serial: written }),
    notes: written,
    /** Values crossed out and replaced, e.g. "name: 'Cabel' crossed out, 'Coble' written". */
    corrections: z.array(z.string()),
    /** Fields that were hard to read, and why. */
    uncertain: z.array(z.object({ field: z.string(), reason: z.string() }))
});

export type PaperSheetReading = z.infer<typeof paperSheetReadingSchema>;

/** One value the reviewer corrected: where, what the reader read, and what the sheet actually says. */
export interface ReadingCorrection {
    field: string;
    read: string;
    corrected: string;
}

const flatten = (value: unknown, path: string, out: Map<string, string>) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, inner] of Object.entries(value)) flatten(inner, path ? `${path}.${key}` : key, out);
    } else if (!Array.isArray(value)) {
        out.set(path, value == null ? '' : String(value));
    }
};

/** The values that differ between the reading and the reviewer's corrected copy (lists are ignored). */
export const readingCorrections = (read: PaperSheetReading, corrected: PaperSheetReading): ReadingCorrection[] => {
    const before = new Map<string, string>();
    const after = new Map<string, string>();
    flatten(read, '', before);
    flatten(corrected, '', after);
    return [...after].filter(([field, value]) => (before.get(field) ?? '') !== value)
        .map(([field, value]) => ({ field, read: before.get(field) ?? '', corrected: value }));
};
