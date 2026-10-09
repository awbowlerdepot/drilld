/**
 * Where a drill sheet's holes sit on the ball, for drawing the grip (the 3D
 * view). Same frame as ballLayout.ts: the center of grip at (0, 0, 1), the
 * centerline up and down through it (x = 0), fingers up, a right-hander's
 * middle finger on the left. Distances are arcs on the 27″ ball.
 *
 * Drawing needs center-to-center distances. A center-to-center span is used
 * as is; any other span type has the two holes' radii added, its ends being
 * the edges that face each other (full: the grip holes; cut-to-cut and fit:
 * the drilled holes). This is for the drawing only: spans are never
 * converted or stored this way.
 *
 * - The centerline runs through the thumb and the bridge center (midway
 *   between the finger centers); the center of grip is halfway between the
 *   thumb and the bridge center. Without a thumb (two-handers), the center of
 *   grip is the bridge center.
 * - Holes are aimed by their pitch: the hole's axis passes the ball's center
 *   offset by the pitch (thumb: forward is toward the fingers; fingers:
 *   forward is toward the palm; lateral right is to the right as seen).
 * - Ovals are the slot the bit leaves as it's moved: a thumb oval stretches
 *   evenly both ways from the pilot along its angle from horizontal (a
 *   right-hander's tilts up-left to down-right, a left-hander's mirrored); a
 *   finger oval only widens, away from the bridge.
 */
import { BALL_RADIUS, REFERENCE, UP, add, arc, cross, dot, move, scale, toward, turn, unit, type Vec } from './ballLayout.ts';

const R = BALL_RADIUS;

export type SpanKind = 'centerToCenter' | 'cutToCut' | 'outerToCut' | 'full' | 'fit';

/** One thumb–finger span as recorded, inches; whichever types the sheet has. */
export type RecordedSpan = Partial<Record<SpanKind, number>>;

export interface HoleInput {
    /** The grip hole's diameter (the insert's or the hole itself), inches. */
    size: number;
    /** The drilled hole's diameter when it holds an insert or hardware, inches. */
    outside?: number | null;
    depth?: number | null;
    /** Inches: forward (negative = reverse), lateral (right positive, as seen). */
    forward?: number | null;
    lateral?: number | null;
    /** Oval: how much wider than the pilot (`size`), inches; and for a thumb, its angle from horizontal (degrees). */
    oval?: { elongation: number; angle?: number } | null;
}

export interface GripInput {
    hand: 'RIGHT' | 'LEFT';
    thumb: HoleInput | null;
    middle: HoleInput;
    ring: HoleInput;
    thumbToMiddle: RecordedSpan;
    thumbToRing: RecordedSpan;
    /** Edge to edge between the finger holes, inches. */
    bridge: number | null;
}

export interface PlacedHole {
    name: 'thumb' | 'middle' | 'ring';
    /** Where the hole meets the surface (unit vector). */
    center: Vec;
    /** Into the ball, along the hole. */
    axis: Vec;
    /** Grip hole and drilled hole radii, inches. */
    radius: number;
    outsideRadius: number;
    depth: number;
    /** An oval: the bit's center moves along `direction` (a surface direction at the center) from `from` to `to` inches. */
    oval: { direction: Vec; from: number; to: number } | null;
}

export interface PlacedGrip {
    holes: PlacedHole[];
    bridgeCenter: Vec;
    /** What was used for each span, and what was assumed. */
    notes: string[];
}

const SPAN_ORDER: SpanKind[] = ['centerToCenter', 'cutToCut', 'outerToCut', 'full', 'fit'];
const SPAN_LABEL: Record<SpanKind, string> = { centerToCenter: 'center-to-center', cutToCut: 'cut-to-cut', outerToCut: 'outer-to-cut', full: 'full', fit: 'fit' };
const DEFAULT_CENTERS = 4.75;
const DEFAULT_BRIDGE = 0.25;

/** Thumb center to finger center for drawing, from the span the sheet has. */
const centers = (span: RecordedSpan, thumb: HoleInput, finger: HoleInput, label: string, notes: string[]) => {
    const kind = SPAN_ORDER.find(k => span[k] != null);
    if (!kind) {
        notes.push(`No ${label} span on the sheet: drawn at ${DEFAULT_CENTERS}″ center to center.`);
        return DEFAULT_CENTERS;
    }
    const value = span[kind]!;
    const drilled = (h: HoleInput) => (h.outside ?? h.size) / 2;
    const extra = kind === 'centerToCenter' ? 0
        : kind === 'full' ? thumb.size / 2 + finger.size / 2
            : kind === 'fit' ? drilled(thumb)
                : drilled(thumb) + drilled(finger);
    notes.push(`${label}: from the ${SPAN_LABEL[kind]} span.`);
    return value + extra;
};

/** The hole's axis into the ball: toward the center, offset by the pitch. */
const aim = (center: Vec, hole: HoleInput, thumb: boolean, flip: number): Vec => {
    const up = toward(center, UP);
    const right = unit(cross(up, center));
    const forward = (hole.forward ?? 0) * (thumb ? 1 : -1);
    const lateral = (hole.lateral ?? 0) * flip;
    const target = add(scale(right, lateral / R), scale(up, forward / R));
    return unit(add(scale(center, -1), target));
};

/** The oval's slot at a hole's center (see the file comment). */
const ovalOf = (center: Vec, h: HoleInput, thumb: boolean, flip: number): PlacedHole['oval'] => {
    if (!h.oval || h.oval.elongation <= 0) return null;
    const up = toward(center, UP);
    const right = unit(cross(up, center));
    if (thumb) {
        const a = ((h.oval.angle ?? 0) * Math.PI) / 180;
        // Right-hander: up-left to down-right; left-hander: up-right to down-left.
        const direction = unit(add(scale(right, Math.cos(a)), scale(up, -flip * Math.sin(a))));
        return { direction, from: -h.oval.elongation / 2, to: h.oval.elongation / 2 };
    }
    // A finger widens away from the bridge: the left hole to the left, the right hole to the right.
    return { direction: scale(right, center[0] < 0 ? -1 : 1), from: 0, to: h.oval.elongation };
};

/** Places the thumb and finger holes from a drill sheet (see the file comment). */
export const placeGrip = (input: GripInput): PlacedGrip => {
    const notes: string[] = [];
    // Laid out for a right-hander, then mirrored for a left-hander.
    const flip = input.hand === 'LEFT' ? -1 : 1;
    const bridge = input.bridge ?? DEFAULT_BRIDGE;
    if (input.bridge == null) notes.push(`No bridge on the sheet: drawn at ${DEFAULT_BRIDGE}″.`);
    const fingerGap = bridge + input.middle.size / 2 + input.ring.size / 2;

    let thumbAt: Vec | null = null, middleAt: Vec, ringAt: Vec, bridgeAt: Vec;
    if (input.thumb) {
        const t = input.thumb;
        const dM = centers(input.thumbToMiddle, t, input.middle, 'Thumb to middle', notes);
        const dR = centers(input.thumbToRing, t, input.ring, 'Thumb to ring', notes);
        const T: Vec = [0, 0, 1];
        const U = toward(T, UP);
        const a = dM / R, b = dR / R, w = fingerGap / R;
        const cosA = (Math.cos(w) - Math.cos(a) * Math.cos(b)) / (Math.sin(a) * Math.sin(b));
        const A = Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
        // Split the angle at the thumb so the bridge center lands on the centerline.
        const place = (left: number) => {
            const m = move(T, turn(U, T, left), dM), r = move(T, turn(U, T, left - A), dR);
            return { m, r, b: unit(add(m, r)) };
        };
        let lo = 0, hi = A;
        for (let i = 0; i < 60; i++) {
            const mid = (lo + hi) / 2;
            if (place(mid).b[0] < 0) hi = mid; else lo = mid;
        }
        const placed = place((lo + hi) / 2);
        // Turn the ball so the center of grip (halfway between the thumb and the bridge center) is at the reference point.
        const grip = unit(add(T, placed.b));
        const angle = Math.atan2(grip[1], grip[2]);
        const rotate = (v: Vec): Vec => [v[0], v[1] * Math.cos(angle) - v[2] * Math.sin(angle), v[1] * Math.sin(angle) + v[2] * Math.cos(angle)];
        thumbAt = rotate(T); middleAt = rotate(placed.m); ringAt = rotate(placed.r); bridgeAt = rotate(placed.b);
    } else {
        notes.push('No thumb: the center of grip is the bridge center.');
        bridgeAt = REFERENCE;
        middleAt = move(REFERENCE, [-1, 0, 0], fingerGap / 2);
        ringAt = move(REFERENCE, [1, 0, 0], fingerGap / 2);
    }

    const mirror = (v: Vec): Vec => [v[0] * flip, v[1], v[2]];
    const hole = (name: PlacedHole['name'], at: Vec, h: HoleInput, isThumb: boolean): PlacedHole => {
        const center = mirror(at);
        return {
            name, center, axis: aim(center, h, isThumb, 1),
            radius: h.size / 2, outsideRadius: (h.outside ?? h.size) / 2,
            depth: h.depth ?? (isThumb ? 2.75 : 2),
            oval: ovalOf(center, h, isThumb, flip)
        };
    };
    const holes = [hole('middle', middleAt, input.middle, false), hole('ring', ringAt, input.ring, false)];
    if (thumbAt && input.thumb) holes.unshift(hole('thumb', thumbAt, input.thumb, true));
    return { holes, bridgeCenter: mirror(bridgeAt), notes };
};

/** Center-to-center arc between two placed holes, inches (for checks). */
export const holeDistance = (a: PlacedHole, b: PlacedHole) => arc(a.center, b.center);
/** How far a placed hole's axis misses the ball's center, inches (its pitch). */
export const pitchOf = (h: PlacedHole) => R * Math.sqrt(Math.max(0, 1 - dot(h.axis, scale(h.center, -1)) ** 2));
