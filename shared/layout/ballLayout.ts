/**
 * Ball layout geometry. Every layout system describes the same points on a
 * sphere (the ball's pin and PSA/MB, the bowler's PAP and grip) with
 * different numbers, so they convert exactly with spherical trigonometry.
 * Layout tapes measure along the surface: every distance here is an arc, in
 * inches, on a 27″ ball (radius 4.297″, a quarter of the way round 6¾″).
 *
 * The frame is a right-hander's, looking at the grip with the fingers up: x to
 * the right (toward the PAP), y up (the fingers), z out of the ball toward
 * you. The grip reference point (the center of grip, or the center of the
 * bridge for 2LS) is (0, 0, 1). The midline is the great circle through it
 * across (y = 0); the centerline runs up and down through it (x = 0). A
 * left-hander's layout is the mirror image: same numbers, x flipped when drawn.
 *
 * Definitions (MoRich Dual Angle Layout Technique; Storm's pin buffer system):
 * - PAP: `over` along the midline from the reference point, then `up` square to it.
 * - VAL (vertical axis line): the line through the PAP square to the midline.
 * - Pin to PAP: the distance from the pin to the PAP.
 * - VAL angle: at the PAP, between the VAL (upward) and the line to the pin,
 *   opening toward the grip. The pin sits above the PAP, on the grip side of the VAL.
 * - Pin buffer: the pin's distance from the VAL.
 * - Drilling angle: at the pin, between the line to the PSA (the MB of an
 *   asymmetric ball; 6¾″ from the pin through the CG on a symmetric one) and
 *   the line to the PAP. Seen from the ball's marks (pin facing you, MB
 *   straight below it), a right-hander's PAP is to the right of the pin-MB line.
 * - PSA to PAP: the distance from the PSA to the PAP.
 * - Pin to COG: the distance from the pin to the center of grip (Storm's 2LS,
 *   for two-handers: the center of grip is the center of the bridge, and the
 *   PAP is measured from it). 2LS places the pin where the arc from the PAP
 *   crosses the arc from the COG (the Lightning Arc), on the fingers' side.
 */

export const BALL_CIRCUMFERENCE = 27;
export const BALL_RADIUS = BALL_CIRCUMFERENCE / (2 * Math.PI);
/** A quarter of the way round: a symmetric ball's PSA from the pin, and the bowler's track from the PAP. */
export const QUARTER_ROUND = BALL_CIRCUMFERENCE / 4;

export type Vec = readonly [number, number, number];

const R = BALL_RADIUS;
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const unit = (a: Vec): Vec => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const UP: Vec = [0, 1, 0];
export const REFERENCE: Vec = [0, 0, 1];

/** Surface distance between two points, inches. */
export const arc = (a: Vec, b: Vec) => R * Math.acos(clamp1(dot(a, b)));
/** The direction along the surface at `from` toward `to`. */
export const toward = (from: Vec, to: Vec): Vec => unit(add(to, scale(from, -dot(to, from))));
/** The point `inches` along the surface from `from` in direction `dir`. */
export const move = (from: Vec, dir: Vec, inches: number): Vec => add(scale(from, Math.cos(inches / R)), scale(dir, Math.sin(inches / R)));
/** Turns a surface direction at `at` counterclockwise (seen from outside the ball) by `degrees`. */
export const turn = (dir: Vec, at: Vec, degrees: number): Vec => add(scale(dir, Math.cos(rad(degrees))), scale(cross(at, dir), Math.sin(rad(degrees))));
/** The counterclockwise angle (seen from outside) at `at` from direction `a` to direction `b`, −180 to 180. */
const angleBetween = (at: Vec, a: Vec, b: Vec) => deg(Math.atan2(dot(cross(a, b), at), dot(a, b)));

/** The PAP: `over` along the midline from the reference point (toward the PAP side), then `up`. Inches. */
export const papPoint = (over: number, up: number): Vec => {
    const o = over / R, u = up / R;
    return [Math.cos(u) * Math.sin(o), Math.sin(u), Math.cos(u) * Math.cos(o)];
};

/** Where a point is from the grip reference: along the midline (toward the PAP side) and up from it. Inches. */
export const fromReference = (p: Vec) => ({ over: R * Math.atan2(p[0], p[2]), up: R * Math.asin(clamp1(p[1])) });

/** At the PAP: up along the VAL, and across toward the grip. */
const valDirections = (pap: Vec) => {
    const up = toward(pap, UP);
    return { up, grip: unit(cross(pap, up)) };
};

/** The layout numbers, in every system. Inches and degrees. */
export interface LayoutNumbers {
    pinToPap: number;
    /** Pin to the reference point (the center of grip; the center of the bridge for 2LS). */
    pinToCog: number;
    psaToPap: number;
    pinBuffer: number;
    drillingAngle: number;
    valAngle: number;
}

export interface SolvedLayout extends LayoutNumbers {
    pap: Vec;
    pin: Vec;
    psa: Vec;
    /** Pin to PSA used (the ball's MB distance, or 6¾″). */
    pinToPsa: number;
}

export type LayoutInput =
    | { system: 'DUAL_ANGLE'; drillingAngle: number; pinToPap: number; valAngle: number }
    | { system: 'PIN_BUFFER'; pinToPap: number; psaToPap: number; pinBuffer: number }
    | { system: 'TWO_LS'; pinToPap: number; pinToCog: number; psaToPap: number };

export interface LayoutContext {
    /** The PAP from the grip reference point, inches. */
    papOver: number;
    papUp: number;
    /** Pin to PSA on this ball, inches: the MB mark's distance, or 6¾″. */
    pinToPsa?: number;
}

export class LayoutError extends Error {}

/** VAL angle for a pin `pinToPap` from the PAP and `pinBuffer` from the VAL. */
export const valAngleFromBuffer = (pinToPap: number, pinBuffer: number) => {
    if (pinBuffer > pinToPap + 1e-9) throw new LayoutError('The pin buffer can\'t be more than the pin to PAP distance');
    if (pinToPap === 0) return 0;
    return deg(Math.asin(clamp1(Math.sin(pinBuffer / R) / Math.sin(pinToPap / R))));
};

/** Drilling angle for the PAP–pin–PSA triangle with these sides (law of cosines). */
export const drillingAngleFromSides = (pinToPap: number, pinToPsa: number, psaToPap: number) => {
    const a = pinToPap / R, s = pinToPsa / R, p = psaToPap / R;
    const cos = (Math.cos(p) - Math.cos(a) * Math.cos(s)) / (Math.sin(a) * Math.sin(s));
    if (!Number.isFinite(cos) || Math.abs(cos) > 1 + 1e-9) {
        throw new LayoutError(`With the pin ${pinToPap.toFixed(3)}″ from the PAP and the PSA ${pinToPsa.toFixed(3)}″ from the pin, the PSA can be ${(Math.abs(pinToPap - pinToPsa)).toFixed(3)}″ to ${Math.min(pinToPap + pinToPsa, BALL_CIRCUMFERENCE - pinToPap - pinToPsa).toFixed(3)}″ from the PAP`);
    }
    return deg(Math.acos(clamp1(cos)));
};

/**
 * The pin `pinToPap` from the PAP and `pinToCog` from the reference point: where
 * the two arcs cross, on the fingers' side of the line from the reference to the PAP.
 */
const pinFromArcs = (pap: Vec, pinToPap: number, pinToCog: number): Vec => {
    const k = dot(pap, REFERENCE);
    const cd = Math.cos(pinToPap / R), cg = Math.cos(pinToCog / R);
    const a = (cd - k * cg) / (1 - k * k), b = (cg - k * cd) / (1 - k * k);
    const normal = cross(pap, REFERENCE);
    const c2 = (1 - a * a - b * b - 2 * a * b * k) / dot(normal, normal);
    if (!(c2 >= -1e-12)) {
        const papToCog = arc(pap, REFERENCE);
        throw new LayoutError(`With the PAP ${papToCog.toFixed(3)}″ from the center of grip and the pin ${pinToPap.toFixed(3)}″ from the PAP, the pin can be ${Math.abs(papToCog - pinToPap).toFixed(3)}″ to ${(papToCog + pinToPap).toFixed(3)}″ from the center of grip`);
    }
    const base = add(scale(pap, a), scale(REFERENCE, b));
    const offset = scale(normal, Math.sqrt(Math.max(0, c2)));
    const one = add(base, offset), other = add(base, scale(offset, -1));
    return one[1] >= other[1] ? one : other;
};

/** Places the pin, PSA and PAP for a layout, and works out its numbers in every system. */
export const solveLayout = (input: LayoutInput, context: LayoutContext): SolvedLayout => {
    const pinToPsa = context.pinToPsa ?? QUARTER_ROUND;
    const { pinToPap } = input;
    if (pinToPap <= 0 || pinToPap > QUARTER_ROUND) throw new LayoutError('Pin to PAP must be more than 0 and at most 6¾″');
    const drillingAngle = input.system === 'DUAL_ANGLE' ? input.drillingAngle : drillingAngleFromSides(pinToPap, pinToPsa, input.psaToPap);

    const pap = papPoint(context.papOver, context.papUp);
    let pin: Vec;
    if (input.system === 'TWO_LS') {
        pin = pinFromArcs(pap, pinToPap, input.pinToCog);
    } else {
        const valAngle = input.system === 'DUAL_ANGLE' ? input.valAngle : valAngleFromBuffer(pinToPap, input.pinBuffer);
        const val = valDirections(pap);
        pin = move(pap, add(scale(val.up, Math.cos(rad(valAngle))), scale(val.grip, Math.sin(rad(valAngle)))), pinToPap);
    }
    // From the pin, the PAP is the drilling angle counterclockwise from the PSA (seen from outside): the PSA is that far clockwise.
    const psa = move(pin, turn(toward(pin, pap), pin, -drillingAngle), pinToPsa);
    return { ...measureLayout(pap, pin, psa), pap, pin, psa, pinToPsa };
};

/** The layout numbers of placed points (the inverse of `solveLayout`). */
export const measureLayout = (pap: Vec, pin: Vec, psa: Vec): LayoutNumbers => {
    const val = valDirections(pap);
    const valNormal = unit(cross(pap, UP));
    const toPin = toward(pap, pin);
    return {
        pinToPap: arc(pin, pap),
        pinToCog: arc(pin, REFERENCE),
        psaToPap: arc(psa, pap),
        pinBuffer: R * Math.asin(Math.abs(clamp1(dot(pin, valNormal)))),
        valAngle: deg(Math.atan2(dot(toPin, val.grip), dot(toPin, val.up))),
        drillingAngle: angleBetween(pin, toward(pin, psa), toward(pin, pap))
    };
};

/** Points along the great-circle arc from `a` to `b`, for drawing. */
export const arcPoints = (a: Vec, b: Vec, steps = 24): Vec[] => {
    const total = arc(a, b);
    if (total < 1e-9) return [a];
    const dir = toward(a, b);
    return Array.from({ length: steps + 1 }, (_, i) => move(a, dir, (total * i) / steps));
};

/** The point on the VAL nearest the pin: the pin buffer runs from the pin to here. */
export const valFoot = (pap: Vec, pin: Vec): Vec => {
    const n = unit(cross(pap, UP));
    return unit(add(pin, scale(n, -dot(pin, n))));
};

/** A point `over` along the midline from the reference point and `up` square to it. Inches. */
export const gripPoint = papPoint;

/** Points along the VAL through the PAP, `inches` each way. */
export const valPoints = (pap: Vec, inches: number, steps = 24): Vec[] => {
    const { up } = valDirections(pap);
    return Array.from({ length: steps + 1 }, (_, i) => move(pap, up, -inches + (2 * inches * i) / steps));
};

/** Azimuthal equidistant projection centered on `center`: distances and angles from it are true. Inches, y up. */
export const project = (center: Vec, p: Vec) => {
    const up = toward(center, UP);
    const right = unit(cross(up, center));
    const d = arc(center, p);
    if (d < 1e-9) return { x: 0, y: 0 };
    const dir = toward(center, p);
    const a = Math.atan2(dot(dir, up), dot(dir, right));
    return { x: d * Math.cos(a), y: d * Math.sin(a) };
};
