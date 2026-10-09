import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REFERENCE, arc, fromReference, move } from './ballLayout.ts';
import { holeDistance, pitchOf, placeGrip, type GripInput } from './gripPlacement.ts';

const near = (actual: number, expected: number, tolerance: number, label: string) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual.toFixed(4)} vs ${expected} (±${tolerance})`);

const base: GripInput = {
    hand: 'RIGHT',
    thumb: { size: 1, forward: 0.25, lateral: 0.125 },
    middle: { size: 0.75, outside: 1.03125, forward: -0.25 },
    ring: { size: 0.75, outside: 1.03125 },
    thumbToMiddle: { centerToCenter: 4.75 },
    thumbToRing: { centerToCenter: 4.5 },
    bridge: 0.25
};

test('holes sit at the recorded center-to-center spans and bridge', () => {
    const g = placeGrip(base);
    const [thumb, middle, ring] = g.holes;
    near(holeDistance(thumb, middle), 4.75, 1e-9, 'thumb to middle');
    near(holeDistance(thumb, ring), 4.5, 1e-9, 'thumb to ring');
    near(holeDistance(middle, ring), 0.25 + 0.375 + 0.375, 1e-9, 'finger centers (bridge + radii)');
});

test('the center of grip is halfway between the thumb and the bridge center, on the centerline', () => {
    const g = placeGrip(base);
    const thumb = g.holes[0];
    near(arc(thumb.center, REFERENCE), arc(g.bridgeCenter, REFERENCE), 1e-9, 'halfway');
    near(fromReference(thumb.center).over, 0, 1e-9, 'thumb on the centerline');
    near(fromReference(g.bridgeCenter).over, 0, 1e-9, 'bridge center on the centerline');
    assert.ok(fromReference(g.bridgeCenter).up > 0 && fromReference(thumb.center).up < 0, 'fingers up, thumb down');
});

test('a right-hander\'s middle finger is on the left; a left-hander\'s on the right', () => {
    assert.ok(fromReference(placeGrip(base).holes[1].center).over < 0);
    assert.ok(fromReference(placeGrip({ ...base, hand: 'LEFT' }).holes[1].center).over > 0);
});

test('other span types add the facing edges\' radii (for drawing only)', () => {
    // Full: grip hole edges facing each other. 4″ + 1/2 (thumb) + 3/8 (finger) = 4.875 center to center.
    const full = placeGrip({ ...base, thumbToMiddle: { full: 4 }, thumbToRing: { fit: 4 } });
    near(holeDistance(full.holes[0], full.holes[1]), 4.875, 1e-9, 'full');
    // Fit: finger center to the thumb's cut edge: + 1/2.
    near(holeDistance(full.holes[0], full.holes[2]), 4.5, 1e-9, 'fit');
    const cut = placeGrip({ ...base, thumbToMiddle: { cutToCut: 4 } });
    near(holeDistance(cut.holes[0], cut.holes[1]), 4 + 0.5 + 1.03125 / 2, 1e-9, 'cut to cut (drilled O.D.)');
    assert.ok(full.notes.some(n => n.includes('full span')));
});

test('a hole\'s axis misses the center by its pitch', () => {
    const g = placeGrip(base);
    near(pitchOf(g.holes[0]), Math.hypot(0.25, 0.125), 1e-3, 'thumb pitch');
    near(pitchOf(g.holes[1]), 0.25, 1e-3, 'middle pitch');
    near(pitchOf(g.holes[2]), 0, 1e-9, 'ring, no pitch');
});

test('no thumb: the fingers straddle the center of grip', () => {
    const g = placeGrip({ ...base, thumb: null });
    assert.equal(g.holes.length, 2);
    near(fromReference(g.holes[0].center).over, -0.5, 1e-9, 'middle');
    near(fromReference(g.holes[1].center).over, 0.5, 1e-9, 'ring');
});

test('ovals: the thumb stretches both ways along its angle (mirrored by hand); a finger widens away from the bridge', () => {
    const oval = { ...base, thumb: { ...base.thumb!, oval: { elongation: 0.1, angle: 20 } }, middle: { ...base.middle, oval: { elongation: 0.0625 } }, ring: { ...base.ring, oval: { elongation: 0.0625 } } };
    const [thumb, middle, ring] = placeGrip(oval).holes;
    near(thumb.oval!.from, -0.05, 1e-12, 'thumb from');
    near(thumb.oval!.to, 0.05, 1e-12, 'thumb to');
    // The oval's higher end: to the left for a right-hander, to the right for a left-hander.
    const topEnd = (h: typeof thumb) => [h.oval!.from, h.oval!.to].map(t => fromReference(move(h.center, h.oval!.direction, t))).sort((x, y) => y.up - x.up)[0];
    assert.ok(topEnd(thumb).over < fromReference(thumb.center).over, 'right-hander: up-left to down-right');
    const lefty = placeGrip({ ...oval, hand: 'LEFT' }).holes[0];
    assert.ok(topEnd(lefty).over > fromReference(lefty.center).over, 'left-hander: up-right to down-left');
    // Fingers: the right-hander's middle (left hole) widens left, the ring (right hole) right.
    assert.ok(fromReference(move(middle.center, middle.oval!.direction, middle.oval!.to)).over < fromReference(middle.center).over, 'middle widens left');
    assert.ok(fromReference(move(ring.center, ring.oval!.direction, ring.oval!.to)).over > fromReference(ring.center).over, 'ring widens right');
    assert.equal(placeGrip(base).holes[0].oval, null);
});
