import type { BallLayout, LayoutSystem } from '../../shared/api/ballLayouts'
import type { LayoutNumbers } from '../../shared/layout/ballLayout'
import { format32 } from './Fractions'

export const LAYOUT_SYSTEM_LABELS: Record<LayoutSystem, string> = {
    PIN_BUFFER: 'VLS / pin buffer',
    DUAL_ANGLE: 'Dual Angle',
    TWO_LS: '2LS'
}

/** Inches to the nearest 32nd, as shops write it: "4-3/4", "1-3/4+". */
export const layoutInches = (inches: number) => format32(Math.round(inches * 32))
/** Degrees, to the half degree. */
export const layoutDegrees = (degrees: number) => `${Math.round(degrees * 2) / 2}°`

/** A layout as entered and as it's said: "5 x 4 x 2" (VLS), "60° x 4 x 30°" (Dual Angle), "5 x 3-1/2 x 4" (2LS: pin to PAP x PSA to PAP x pin to COG). */
export const describeLayout = (layout: BallLayout) => {
    switch (layout.system) {
        case 'DUAL_ANGLE': return `${layoutDegrees(layout.drillingAngle)} x ${format32(layout.pinToPap32)} x ${layoutDegrees(layout.valAngle)}`
        case 'TWO_LS': return `${format32(layout.pinToPap32)} x ${format32(layout.psaToPap32)} x ${format32(layout.pinToCog32)}`
        default: return `${format32(layout.pinToPap32)} x ${format32(layout.psaToPap32)} x ${format32(layout.pinBuffer32)}`
    }
}

/** Calculated numbers in one system: "5 x 4-31/32 x 1-3/4+". */
export const describeNumbers = (system: LayoutSystem, n: LayoutNumbers) => {
    switch (system) {
        case 'DUAL_ANGLE': return `${layoutDegrees(n.drillingAngle)} x ${layoutInches(n.pinToPap)} x ${layoutDegrees(n.valAngle)}`
        case 'TWO_LS': return `${layoutInches(n.pinToPap)} x ${layoutInches(n.psaToPap)} x ${layoutInches(n.pinToCog)}`
        default: return `${layoutInches(n.pinToPap)} x ${layoutInches(n.psaToPap)} x ${layoutInches(n.pinBuffer)}`
    }
}

/**
 * The layout systems for a bowler. 2LS measures from the center of the bridge,
 * so it applies only to bowlers who don't use their thumb; they get all three.
 * (A layout already in 2LS keeps it.)
 */
export const systemsFor = (usesThumb: boolean, current?: LayoutSystem): LayoutSystem[] =>
    usesThumb && current !== 'TWO_LS' ? ['PIN_BUFFER', 'DUAL_ANGLE'] : ['PIN_BUFFER', 'DUAL_ANGLE', 'TWO_LS']

/** The other systems a layout can be read in, for this bowler. */
export const otherSystems = (system: LayoutSystem, usesThumb: boolean): LayoutSystem[] =>
    systemsFor(usesThumb, system).filter(s => s !== system)
