// The drill bits a pro shop actually has, in 64ths of an inch. The bit
// picker offers these instead of every possible 64th.

/** Standard bits: 1/2" through 1-1/8" in 1/64" steps. */
export const FINE_BITS: number[] = Array.from({ length: 72 - 32 + 1 }, (_, i) => 32 + i)

/** Larger standard bits: 1-1/4", 1-3/8", 1-1/2". */
export const LARGE_BITS: number[] = [80, 88, 96]

export interface HardwareBit {
    size64: number
    /** Whose interchangeable hardware the bit is for. */
    system: string
}

/**
 * Bits for interchangeable thumb hardware. Each has a preset collar that sets
 * the depth: VISE IT in four sizes, and JoPo and Turbo at 1-1/2".
 */
export const HARDWARE_BITS: HardwareBit[] = [
    { size64: 76, system: 'VISE IT' },
    { size64: 84, system: 'VISE IT' },
    { size64: 92, system: 'VISE IT' },
    { size64: 100, system: 'VISE IT' },
    { size64: 96, system: 'JoPo / Turbo' }
]

/** Every size the shop has a bit for. */
export const ALL_BIT_SIZES: Set<number> = new Set([...FINE_BITS, ...LARGE_BITS, ...HARDWARE_BITS.map(bit => bit.size64)])
