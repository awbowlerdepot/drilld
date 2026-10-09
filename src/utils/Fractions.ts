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

/**
 * Inches from what a shop writes: "4 11/16", "4-3/16", "3/8", "4", ".060",
 * "096" (thousandths without the point), "4 12/32″". Null if it isn't a number.
 */
export const parseInches = (raw: string | null): number | null => {
    if (raw == null) return null
    const text = raw.trim().replace(/["″”'°]/g, '').replace(/\s+/g, ' ')
    if (!text) return null
    // "X" (crossed out on a sheet) means zero.
    if (/^[xX×]$/.test(text)) return 0
    let match = /^(\d+)\s*[- ]\s*(\d+)\/(\d+)$/.exec(text)
    if (match) return Number(match[1]) + Number(match[2]) / Number(match[3])
    match = /^(\d+)\/(\d+)$/.exec(text)
    if (match) return Number(match[1]) / Number(match[2])
    match = /^0?\.(\d+)$/.exec(text)
    if (match) return Number(`0.${match[1]}`)
    // Thousandths written without the point, as on oval widths: "060", "096".
    match = /^0(\d{2})$/.exec(text)
    if (match) return Number(match[1]) / 1000
    match = /^\d+(\.\d+)?$/.exec(text)
    if (match) return Number(text)
    return null
}
