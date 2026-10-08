import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { paperSheetReadingSchema, type PaperSheetReading } from '../../shared/api/paperReading';

// Reads a photo or scan of a paper drill sheet with Claude. The model only
// transcribes; converting to units and applying shop conventions happen in
// code, and a person reviews the result before anything is saved.
//
// Two ways to reach Claude, chosen by PAPER_READER_MODEL:
// - Anthropic's API (a claude-* model id), with the key from Secrets Manager
//   (ANTHROPIC_KEY_SECRET, JSON { "apiKey": ... }). Processed in the US.
// - Amazon Bedrock in this account (a global./us. inference profile id), once
//   the account has access to a model strong enough for handwriting.

export const PAPER_READER_MODEL = process.env.PAPER_READER_MODEL ?? 'claude-opus-5-5';
const ANTHROPIC_KEY_SECRET = process.env.ANTHROPIC_KEY_SECRET ?? 'drilld/anthropic-api-key';
const onBedrock = /^(global|us|eu|apac)\./.test(PAPER_READER_MODEL);

let anthropic: Promise<Anthropic> | null = null;

/** The Anthropic client, with the key read once per container. */
const anthropicClient = () => {
    anthropic ??= new SecretsManagerClient({})
        .send(new GetSecretValueCommand({ SecretId: ANTHROPIC_KEY_SECRET }))
        .then(secret => {
            const apiKey = (JSON.parse(secret.SecretString ?? '{}') as { apiKey?: string }).apiKey;
            if (!apiKey) throw new Error(`Secret ${ANTHROPIC_KEY_SECRET} has no apiKey`);
            return new Anthropic({ apiKey });
        })
        .catch(error => {
            anthropic = null;
            throw error;
        });
    return anthropic;
};

const INSTRUCTIONS = `You are reading a photo or scan of a bowling pro shop's paper drill sheet: a printed form, filled in by hand, that records how a bowler's ball is drilled.

Transcribe exactly what is written into the fields of the output. Do not convert, round, or interpret measurements: copy fractions and numbers as written ("4 11/16", "4-3/16", "57/64", ".060", "45°"). Write "X" where a box is crossed out with an X (it means no pitch). Use null for blank fields and for fields this form doesn't have.

Layout (as printed, finger holes at the top, thumb hole at the bottom):
- leftFinger / rightFinger are the finger hole circles on the left and right of the page; thumb is the bottom circle. In inCircle, write everything written inside the circle, top to bottom; if a line is drawn across the circle, separate the parts with " / " (e.g. "31/32 / 6"). In beside, write anything written right next to or above that circle (e.g. "Lift", "VG", ".030").
- leftSpan / rightSpan are the measurements on the lines or boxes between the thumb and each finger hole. If a second value was added later (different ink or squeezed underneath), put it in alternate; put labels written with the value (e.g. "T-C") in annotation.
- bridge is the small value between the two finger holes, usually a fraction like 1/4.
- Pitch: each hole has boxes. Put a value in reverse or forward when the printed label next to that box says Reverse Pitch or Forward Pitch, and in left or right for the sideways boxes, by the direction their arrow points. Some forms (Ultimate) have unlabeled crosshairs with values at the ends of the arms: use up, down, left and right for those, by which arm the value is at.
- oval: Degree of Oval and Width (or an Oval Info box).
- inserts: the Insert / Style / Size table near the bottom of the form (Motiv, Storm), rows Thumb, Middle Finger, Ring Finger. Read every entry, even single words like "Lift", "Slug", "Oval", "IT", and any size written there. Hardware or slug sizes written elsewhere for the thumb go in the thumb row too.
- A number by itself in a finger hole circle (e.g. "7.5", "5.5", "6") is an insert size: copy it as written.
- template.brand: the company whose form this is, from the logo or printed name (Motiv, Storm, Ultimate, Innovative). OTHER for another company, UNKNOWN if no brand is visible.
- hand, grip, twoHanded: from the checked boxes or marked circles; null if none is marked.

Handwriting: when a value is crossed out and replaced, use the replacement and list the change in corrections. List every field you are not sure of in uncertain, with the reason (e.g. "hard to tell 3/8 from 5/8"). Prefer a best reading plus an uncertain entry over leaving a readable field blank.`;

export interface SheetImage {
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
    base64: string;
}

const contentFor = (image: SheetImage) => [
    image.mediaType === 'application/pdf'
        ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: image.base64 } }
        : { type: 'image' as const, source: { type: 'base64' as const, media_type: image.mediaType, data: image.base64 } },
    { type: 'text' as const, text: 'Transcribe this drill sheet.' }
];

const check = (stopReason: string | null, parsed: PaperSheetReading | null | undefined) => {
    if (stopReason === 'refusal') throw new Error('The sheet could not be read (the model declined)');
    if (stopReason === 'max_tokens') throw new Error('The sheet could not be read (the answer was cut off)');
    if (!parsed) throw new Error('The sheet could not be read (no structured answer)');
    return parsed;
};

/**
 * Transcribes one sheet. `hints` are the company's own conventions and past
 * corrections, which help with how this shop writes things.
 */
export const readPaperSheet = async (image: SheetImage, hints?: string): Promise<PaperSheetReading> => {
    const system = hints ? `${INSTRUCTIONS}\n\n${hints}\nUse these to read this shop's handwriting, but always transcribe what this sheet actually says.` : INSTRUCTIONS;
    const format = zodOutputFormat(paperSheetReadingSchema);

    if (onBedrock) {
        const response = await new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? 'us-west-1' }).messages.parse({
            model: PAPER_READER_MODEL,
            max_tokens: 16000,
            output_config: { format },
            system,
            messages: [{ role: 'user', content: contentFor(image) }]
        });
        return check(response.stop_reason, response.parsed_output);
    }

    const response = await (await anthropicClient()).beta.messages.parse({
        model: PAPER_READER_MODEL,
        max_tokens: 16000,
        // If the model declines, the API retries on its default fallback model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        inference_geo: 'us',
        output_config: { effort: 'high', format },
        system,
        messages: [{ role: 'user', content: contentFor(image) }]
    });
    return check(response.stop_reason, response.parsed_output);
};
