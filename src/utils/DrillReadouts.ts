// Drill press readouts for a drill sheet: where each hole's pitch puts the
// center, and where each oval cut goes. Rules in docs/data-model.md
// ("Thumb oval cuts are calculated", "Finger ovals only widen", "Pitch on the readout").

/** Position in inches, physical directions: up and right are positive. */
export interface Offset {
    vertical: number;
    horizontal: number;
}

export type HoleKind = 'THUMB' | 'FINGER';
export type ScreenSide = 'LEFT' | 'RIGHT';
export type Hand = 'LEFT' | 'RIGHT';

/** The sign the press readout shows when the hole moves up / right on the ball. */
export interface PressReadout {
    verticalReadout: 'UP_POSITIVE' | 'DOWN_POSITIVE';
    horizontalReadout: 'RIGHT_POSITIVE' | 'LEFT_POSITIVE';
}

export interface Pitch32 {
    forward32?: number | null;
    lateral32?: number | null;
}

/** Most a single cut may take: 1/32". */
const MAX_CUT = 1 / 32;

/** Whole cuts needed for a distance, so none exceeds 1/32" (tolerant of float error). */
const cutCount = (distance: number) => Math.ceil(distance / MAX_CUT - 1e-9);

/**
 * The hole's pitch as a position. Pitches are measured from the center of the
 * grip, so reverse is down for the thumb and up for the fingers. Lateral is the
 * same for every hole: left on the sheet is left on the press.
 */
export const pitchCenter = (kind: HoleKind, pitch: Pitch32): Offset => {
    const forward = (pitch.forward32 ?? 0) / 32;
    return {
        vertical: kind === 'THUMB' ? forward : -forward,
        horizontal: (pitch.lateral32 ?? 0) / 32
    };
};

/**
 * Thumb oval cuts, as offsets from the pitch center in drilling order. The
 * elongation (width bit − starting bit) is split evenly on both sides of the
 * center, along the angle from horizontal. A right-hander's oval runs from
 * up-left to down-right, a left-hander's from up-right to down-left. Cuts
 * start at the farthest up position, work in through the center, then out to
 * the farthest down position.
 */
export const thumbOvalCuts = (oval: { pilotHole64: number; width64: number; angleDegrees: number }, hand: Hand): Offset[] => {
    const side = (oval.width64 - oval.pilotHole64) / 64 / 2;
    if (side <= 0) return [];
    const count = cutCount(side);
    const cut = side / count;
    const radians = (oval.angleDegrees * Math.PI) / 180;
    const up: Offset = {
        vertical: Math.sin(radians),
        horizontal: (hand === 'RIGHT' ? -1 : 1) * Math.cos(radians)
    };
    const at = (distance: number): Offset => ({ vertical: up.vertical * distance, horizontal: up.horizontal * distance });

    const cuts: Offset[] = [];
    for (let step = count; step >= 1; step--) cuts.push(at(step * cut));
    for (let step = 1; step <= count; step++) cuts.push(at(-step * cut));
    return cuts;
};

/**
 * Finger oval cuts, as offsets from the pitch center in drilling order. A
 * finger hole only widens, all of it away from the bridge: the left hole moves
 * left and the right hole moves right, stepping out from the center.
 */
export const fingerOvalCuts = (oval: { size64: number; width64: number }, side: ScreenSide): Offset[] => {
    const extra = (oval.width64 - oval.size64) / 64;
    if (extra <= 0) return [];
    const count = cutCount(extra);
    const cut = extra / count;
    const direction = side === 'LEFT' ? -1 : 1;
    return Array.from({ length: count }, (_, index) => ({ vertical: 0, horizontal: direction * (index + 1) * cut }));
};

/** A physical position as this press's readout shows it. */
export const toReadout = (position: Offset, press: PressReadout): Offset => ({
    vertical: press.verticalReadout === 'UP_POSITIVE' ? position.vertical : -position.vertical,
    horizontal: press.horizontalReadout === 'RIGHT_POSITIVE' ? position.horizontal : -position.horizontal
});

export const addOffsets = (a: Offset, b: Offset): Offset => ({
    vertical: a.vertical + b.vertical,
    horizontal: a.horizontal + b.horizontal
});

/** Which finger is in which screen hole: a right-hander's middle finger is the left hole. */
export const fingerSide = (finger: 'middle' | 'ring', hand: Hand): ScreenSide =>
    (finger === 'middle') === (hand === 'RIGHT') ? 'LEFT' : 'RIGHT';
