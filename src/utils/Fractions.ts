// Formatting for drill sheet measurements. Spans, bridge, pitch and depths are
// stored as whole 32nds of an inch, drill bits as whole 64ths (docs/data-model.md, Units).

const MINUS = '−';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** "3/8" for (6, 16); empty for a zero numerator. */
const reduce = (numerator: number, denominator: number): string => {
    if (numerator === 0) return '';
    const divisor = gcd(numerator, denominator);
    return `${numerator / divisor}/${denominator / divisor}`;
};

const joinWholeAndFraction = (whole: number, fraction: string): string => {
    if (!fraction) return `${whole}`;
    return whole === 0 ? fraction : `${whole}-${fraction}`;
};

/**
 * A length in 32nds, the way shops write it: 16ths, plus "+" for an extra
 * 1/32. 141 → "4-3/8+", 140 → "4-3/8", 33 → "1+", 1 → "1/32".
 */
export const format32 = (value: number): string => {
    const magnitude = Math.abs(value);
    const whole = Math.floor(magnitude / 32);
    const remainder = magnitude % 32;
    const text = magnitude === 1
        ? '1/32'
        : joinWholeAndFraction(whole, reduce(Math.floor(remainder / 2), 16)) + (remainder % 2 ? '+' : '');
    return value < 0 ? MINUS + text : text;
};

/** A drill bit size in 64ths: 61 → "61/64", 96 → "1-1/2", 64 → "1". */
export const format64 = (value: number): string =>
    joinWholeAndFraction(Math.floor(value / 64), reduce(value % 64, 64));

/**
 * Inches as a decimal, the way a digital readout shows them, to the
 * thousandth: .022, −.375, 1.250. With `signed`, positive values get a "+".
 */
export const formatDecimal = (inches: number, options: { signed?: boolean } = {}): string => {
    const rounded = Math.round(inches * 1000) / 1000;
    if (rounded === 0) return '0';
    const digits = Math.abs(rounded).toFixed(3).replace(/^0(?=\.)/, '');
    if (rounded < 0) return MINUS + digits;
    return options.signed ? `+${digits}` : digits;
};

/** Whole inches and the remaining 16ths and "+" of a length in 32nds (for the picker). */
export const split32 = (value: number) => ({
    whole: Math.floor(value / 32),
    sixteenths: Math.floor((value % 32) / 2),
    plus: value % 2 === 1
});

export const join32 = (whole: number, sixteenths: number, plus: boolean): number =>
    whole * 32 + sixteenths * 2 + (plus ? 1 : 0);

/** The label for n/16: 0 → "0", 6 → "3/8". */
export const sixteenthLabel = (sixteenths: number): string => reduce(sixteenths, 16) || '0';

/** The label for n/64 within an inch: 0 → "0", 48 → "3/4". */
export const sixtyFourthLabel = (sixtyFourths: number): string => reduce(sixtyFourths, 64) || '0';
