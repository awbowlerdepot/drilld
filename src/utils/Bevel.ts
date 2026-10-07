// Bevel on the top edge of a hole: an amount (light, medium, heavy), maybe a
// different amount on the palm / hinge side, a width from the wall out, and
// the tool. A hole without its own bevel gets the company's standard.

import type { DrillSheetSpec } from '../../shared/api/drillSheetSpec'
import { format32 } from './Fractions'

export type Bevel = NonNullable<DrillSheetSpec['holes']['thumb']['bevel']>
export type BevelAmount = Bevel['amount']

export const BEVEL_AMOUNTS: { key: BevelAmount; label: string }[] = [
    { key: 'LIGHT', label: 'Light' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'HEAVY', label: 'Heavy' }
]

export const BEVEL_TOOLS: { key: NonNullable<Bevel['tool']>; label: string }[] = [
    { key: 'KNIFE', label: 'Bevel knife' },
    { key: 'SANDER', label: 'Bevel sander' }
]

const amountLabel = (amount: BevelAmount) => BEVEL_AMOUNTS.find(a => a.key === amount)!.label

/** "Medium · heavy on the palm side · 1/16″ from the wall · bevel knife", or "Standard (Medium)". */
export const describeBevel = (bevel: Bevel | null | undefined, standard?: BevelAmount): string => {
    if (!bevel) return standard ? `Standard (${amountLabel(standard)})` : 'Standard'
    return [
        amountLabel(bevel.amount),
        bevel.palmSide && bevel.palmSide !== bevel.amount ? `${amountLabel(bevel.palmSide).toLowerCase()} on the palm side` : null,
        bevel.width32 ? `${format32(bevel.width32)}″ from the wall` : null,
        bevel.tool ? BEVEL_TOOLS.find(t => t.key === bevel.tool)!.label.toLowerCase() : null,
        bevel.notes
    ].filter(Boolean).join(' · ')
}
