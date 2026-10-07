import type { DrillSheetSpec } from '../../../../shared/api/drillSheetSpec'
import type { Hand } from '../../../utils/DrillReadouts'

/** What every part of the drill sheet editor gets: the working spec and how to change it. */
export interface SheetEditProps {
    spec: DrillSheetSpec
    /** Changes a copy of the spec in place. */
    edit: (mutate: (draft: DrillSheetSpec) => void) => void
    /** Viewing only: values can't be tapped. */
    readOnly: boolean
    /** The bowler's hand: a right-hander's middle finger is the left hole. */
    hand: Hand
    /** Where the sheet is being edited; its grip stock is offered first. */
    locationId?: string
}

export type Finger = 'middle' | 'ring'
export type FingerHole = DrillSheetSpec['holes']['middle']
export type Insert = NonNullable<FingerHole['insert']>
export type Vacu = NonNullable<FingerHole['vacu']>
export type ThumbHardware = NonNullable<DrillSheetSpec['holes']['thumb']['hardware']>
export type Span = DrillSheetSpec['spans']['thumbToMiddle']

export type SpanType = 'full32' | 'cutToCut32' | 'outerToCut32' | 'centerToCenter32' | 'fit32'

export const SPAN_TYPES: { key: SpanType; short: string; label: string; description: string }[] = [
    { key: 'full32', short: 'F', label: 'Full', description: 'gripping edge to gripping edge' },
    { key: 'cutToCut32', short: 'C', label: 'Cut-to-cut', description: 'drilled edge to drilled edge' },
    { key: 'outerToCut32', short: 'O', label: 'Outer-to-cut', description: 'thumb hardware edge to finger cut' },
    { key: 'centerToCenter32', short: 'H', label: 'Center to center', description: 'CNC' },
    { key: 'fit32', short: 'Fit', label: 'Fit', description: 'finger center to thumb cut' }
]

/** The finger in each screen hole for this hand. */
export const fingersBySide = (hand: Hand): { left: Finger; right: Finger } =>
    hand === 'RIGHT' ? { left: 'middle', right: 'ring' } : { left: 'ring', right: 'middle' }

export const spanKey = (finger: Finger): 'thumbToMiddle' | 'thumbToRing' => (finger === 'middle' ? 'thumbToMiddle' : 'thumbToRing')

export const fingerName = (finger: Finger) => (finger === 'middle' ? 'Middle' : 'Ring')
