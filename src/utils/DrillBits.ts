// The drill bits a pro shop actually has, in 64ths of an inch. The bit
// picker offers these instead of every possible 64th.

/** Standard bits: 1/2" through 1-1/8" in 1/64" steps. */
export const FINE_BITS: number[] = Array.from({ length: 72 - 32 + 1 }, (_, i) => 32 + i)

/** Larger standard bits: 1-1/4", 1-3/8", 1-1/2". */
export const LARGE_BITS: number[] = [80, 88, 96]

export interface HardwareBit {
    size64: number
    /** Whose interchangeable hardware the bit is for (each collar bit is its own tool). */
    system: string
}

/**
 * Bits for interchangeable thumb hardware. Each is its own tool, with a preset
 * collar setting a depth unique to it: one per VISE IT slug size, and Turbo's
 * and JoPo's, which are both 1-1/2" but collared to different depths.
 */
export const HARDWARE_BITS: HardwareBit[] = [
    { size64: 76, system: 'VISE IT 1-1/8″' },
    { size64: 84, system: 'VISE IT 1-1/4″' },
    { size64: 92, system: 'VISE IT 1-3/8″' },
    { size64: 100, system: 'VISE IT 1-1/2″' },
    { size64: 96, system: 'Turbo' },
    { size64: 96, system: 'JoPo' }
]

/**
 * The name of an interchangeable system's collar bit: "VISE IT 1-1/4″ collar
 * bit", "Turbo collar bit", "JoPo collar bit". Each is a different tool.
 */
export const collarBitName = (hardware: { manufacturer: string; size64?: number | null }): string => {
    if (hardware.manufacturer === 'VISE') {
        const bit = HARDWARE_BITS.find(b => b.system.startsWith('VISE IT') && b.size64 === (hardware.size64 ?? 0) + 4)
        return `${bit?.system ?? 'VISE IT'} collar bit`
    }
    if (hardware.manufacturer === 'TURBO') return 'Turbo collar bit'
    if (hardware.manufacturer === 'JOPO') return 'JoPo collar bit'
    return 'Collar bit'
}

/** Every size the shop has a bit for. */
export const ALL_BIT_SIZES: Set<number> = new Set([...FINE_BITS, ...LARGE_BITS, ...HARDWARE_BITS.map(bit => bit.size64)])
