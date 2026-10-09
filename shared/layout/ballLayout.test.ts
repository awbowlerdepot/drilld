import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BALL_RADIUS, QUARTER_ROUND, arc, fromReference, papPoint, project, solveLayout, valAngleFromBuffer, valFoot } from './ballLayout.ts';

const near = (actual: number, expected: number, tolerance: number, label: string) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual.toFixed(4)} vs ${expected} (±${tolerance})`);

const pap = { papOver: 5 + 3 / 8, papUp: 0.5 };

test('a 27″ ball: a quarter of the way round is 6¾″', () => {
    near(QUARTER_ROUND, 6.75, 1e-12, 'quarter');
    near(BALL_RADIUS, 4.2972, 1e-4, 'radius');
});

// MoRich's Dual Angle guide, "Pin and PSA distances to PAP for different Drilling Angles"
// (PSA 6¾″ from the pin). Its 90° row is exact; the others were measured by hand,
// to about ⅛″ with a few near ¼″, so they're checked to that.
test('PSA to PAP matches the MoRich chart', () => {
    const pins = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5];
    const chart: Record<number, number[]> = {
        90: [6.75, 6.75, 6.75, 6.75, 6.75, 6.75, 6.75, 6.75, 6.75, 6.75],
        70: [6.375, 6.25, 6.125, 6, 5.875, 5.75, 5.625, 5.5, 5.375, 5.25],
        50: [6.125, 5.75, 5.5, 5.25, 5, 4.75, 4.5, 4.375, 4.25, 4],
        30: [5.875, 5.375, 5, 4.625, 4.125, 3.875, 3.5, 3.125, 3, 2.75],
        10: [5.75, 5.25, 4.75, 4.25, 3.75, 3.375, 2.875, 2.5, 2, 1.5]
    };
    for (const [angle, row] of Object.entries(chart)) {
        row.forEach((expected, i) => {
            const solved = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: Number(angle), pinToPap: pins[i], valAngle: 40 }, pap);
            near(solved.psaToPap, expected, Number(angle) === 90 ? 1e-9 : 0.22, `${angle}° pin ${pins[i]}`);
        });
    }
});

test('VAL angle and pin buffer: sin(buffer/R) = sin(pin to PAP/R) × sin(VAL angle), not flat geometry', () => {
    near(valAngleFromBuffer(5, 2), 29.26, 0.01, '5 x 2 buffer');
    assert.ok(valAngleFromBuffer(5, 2) - (Math.asin(2 / 5) * 180) / Math.PI > 5, 'differs from flat geometry by more than 5°');
    near(valAngleFromBuffer(5, 5), 90, 1e-9, 'buffer = pin to PAP');
    assert.throws(() => valAngleFromBuffer(4, 5));
});

test('pin buffer → Dual Angle → pin buffer round trips', () => {
    for (const [d, p, b] of [[5, 4, 2], [4, 4, 2], [5.5, 5, 4], [3.5, 4, 1], [2, 6, 0.5], [6, 3, 5]]) {
        const first = solveLayout({ system: 'PIN_BUFFER', pinToPap: d, psaToPap: p, pinBuffer: b }, pap);
        near(first.pinToPap, d, 1e-9, 'pin to PAP');
        near(first.psaToPap, p, 1e-9, 'PSA to PAP');
        near(first.pinBuffer, b, 1e-9, 'buffer');
        const back = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: first.drillingAngle, pinToPap: d, valAngle: first.valAngle }, pap);
        near(back.psaToPap, p, 1e-9, 'PSA to PAP back');
        near(back.pinBuffer, b, 1e-9, 'buffer back');
    }
});

test('a layout that can\'t exist on this ball is refused, with the range that can', () => {
    // With the MB 6¾″ from the pin and the pin 3½″ from the PAP, the PSA is at least 3¼″ from the PAP.
    assert.throws(() => solveLayout({ system: 'PIN_BUFFER', pinToPap: 3.5, psaToPap: 3, pinBuffer: 1 }, pap), /3\.250″ to 10\.250″/);
});

test('the numbers don\'t depend on where the PAP is, or on the MB distance only through the drilling angle', () => {
    const a = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: 50, pinToPap: 5, valAngle: 30 }, { papOver: 4, papUp: -0.5 });
    const b = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: 50, pinToPap: 5, valAngle: 30 }, { papOver: 6, papUp: 1 });
    near(a.psaToPap, b.psaToPap, 1e-9, 'PSA to PAP');
    near(a.pinBuffer, b.pinBuffer, 1e-9, 'buffer');
    const shortMb = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: 50, pinToPap: 5, valAngle: 30 }, { ...pap, pinToPsa: 6 });
    near(shortMb.pinToPsa, 6, 1e-12, 'pin to PSA used');
    assert.ok(Math.abs(shortMb.psaToPap - a.psaToPap) > 0.1, 'a 6″ MB moves the PSA');
});

test('the PAP is where the PAP numbers say, the pin above it on the grip side of the VAL', () => {
    const s = solveLayout({ system: 'PIN_BUFFER', pinToPap: 5, psaToPap: 4, pinBuffer: 2 }, pap);
    const p = fromReference(s.pap);
    near(p.over, pap.papOver, 1e-9, 'PAP over');
    near(p.up, pap.papUp, 1e-9, 'PAP up');
    const pin = project(s.pap, s.pin);
    assert.ok(pin.y > 0 && pin.x < 0, 'pin up and toward the grip from the PAP');
});

test('seen from the ball (pin facing you, MB straight below), a right-hander\'s PAP is right of the pin-MB line', () => {
    for (const drillingAngle of [10, 45, 90]) {
        const s = solveLayout({ system: 'DUAL_ANGLE', drillingAngle, pinToPap: 4, valAngle: 40 }, pap);
        // Turn the view so the MB is straight below the pin: the PAP's angle from "down", counterclockwise, is the drilling angle.
        const psa = project(s.pin, s.psa), papAt = project(s.pin, s.pap);
        const down = Math.atan2(psa.y, psa.x);
        const papAngle = ((Math.atan2(papAt.y, papAt.x) - down) * 180) / Math.PI;
        near(((papAngle % 360) + 360) % 360, drillingAngle, 1e-6, `drilling ${drillingAngle}°`);
    }
});

test('papPoint and fromReference are inverses', () => {
    const p = fromReference(papPoint(5.375, -0.75));
    near(p.over, 5.375, 1e-12, 'over');
    near(p.up, -0.75, 1e-12, 'up');
});

test('the pin buffer runs square from the pin to the VAL', () => {
    const s = solveLayout({ system: 'PIN_BUFFER', pinToPap: 5, psaToPap: 4, pinBuffer: 2 }, pap);
    near(arc(s.pin, valFoot(s.pap, s.pin)), 2, 1e-9, 'pin to VAL');
});

test('60° x 4″ x 30° Dual Angle is 4 x 5 x 1¾ in VLS (MB 6¾″ from the pin), not flat geometry\'s 4 x 5⅞ x 2', () => {
    const s = solveLayout({ system: 'DUAL_ANGLE', drillingAngle: 60, pinToPap: 4, valAngle: 30 }, pap);
    near(s.psaToPap, 4.977, 0.001, 'PSA to PAP');
    near(s.pinBuffer, 1.773, 0.001, 'pin buffer');
});

test('2LS (pin to PAP x pin to COG x PSA to PAP, PAP from the bridge) places the pin where the two arcs cross', () => {
    const twoHander = { papOver: 5, papUp: 1 };
    const vls = solveLayout({ system: 'PIN_BUFFER', pinToPap: 5, psaToPap: 3.5, pinBuffer: 2 }, twoHander);
    const twoLs = solveLayout({ system: 'TWO_LS', pinToPap: 5, pinToCog: vls.pinToCog, psaToPap: 3.5 }, twoHander);
    near(arc(twoLs.pin, vls.pin), 0, 1e-9, 'same pin');
    near(arc(twoLs.psa, vls.psa), 0, 1e-9, 'same PSA');
    near(twoLs.pinBuffer, 2, 1e-9, 'its pin buffer');
    near(twoLs.pinToCog, vls.pinToCog, 1e-9, 'pin to COG');
});

test('2LS: arcs that don\'t cross are refused (the Lightning Arc rule)', () => {
    // PAP 5″ over and 1″ up is 5.05″ from the bridge on the ball (5.10″ flat); a pin 2″ from the PAP is at least 3.05″ from the bridge.
    assert.throws(() => solveLayout({ system: 'TWO_LS', pinToPap: 2, pinToCog: 1, psaToPap: 5 }, { papOver: 5, papUp: 1 }), /3\.050″ to 7\.050″ from the center of grip/);
});

test('Storm\'s 2LS example 5 x 4 x 3½ (PAP 5″ over, 1″ up from the bridge)', () => {
    const s = solveLayout({ system: 'TWO_LS', pinToPap: 5, pinToCog: 4, psaToPap: 3.5 }, { papOver: 5, papUp: 1 });
    near(s.pinToPap, 5, 1e-9, 'pin to PAP');
    near(s.pinToCog, 4, 1e-9, 'pin to COG');
    near(s.psaToPap, 3.5, 1e-9, 'PSA to PAP');
    assert.ok(fromReference(s.pin).up > 0, 'pin on the fingers\' side');
});
