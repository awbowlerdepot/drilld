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

/** A layout as entered: "5 x 4 x 2", "60° x 4 x 30°". */
export const describeLayout = (layout: BallLayout) => layout.system === 'DUAL_ANGLE'
    ? `${layoutDegrees(layout.drillingAngle)} x ${format32(layout.pinToPap32)} x ${layoutDegrees(layout.valAngle)}`
    : `${format32(layout.pinToPap32)} x ${format32(layout.psaToPap32)} x ${format32(layout.pinBuffer32)}`

/** Calculated numbers in one system: "5 x 4-31/32 x 1-3/4+". */
export const describeNumbers = (system: 'PIN_BUFFER' | 'DUAL_ANGLE', n: LayoutNumbers) => system === 'DUAL_ANGLE'
    ? `${layoutDegrees(n.drillingAngle)} x ${layoutInches(n.pinToPap)} x ${layoutDegrees(n.valAngle)}`
    : `${layoutInches(n.pinToPap)} x ${layoutInches(n.psaToPap)} x ${layoutInches(n.pinBuffer)}`
