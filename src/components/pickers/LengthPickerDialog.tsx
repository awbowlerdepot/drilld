import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { format32, join32, sixteenthLabel, split32 } from '../../utils/Fractions'
import type { LengthPickerRequest } from './pickerRequests'

interface LengthPickerDialogProps {
    request: LengthPickerRequest
    onClose: () => void
}

const choice = 'h-12 rounded-lg border font-mono text-lg font-medium transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-background hover:bg-muted'

/**
 * Picks a length the way shops measure it: whole inches, sixteenths, and a
 * "+" for an extra 1/32. Signed values (pitch) also pick a direction.
 */
export const LengthPickerDialog = ({ request, onClose }: LengthPickerDialogProps) => {
    // Tapping a direction's box (e.g. Reverse) preselects that direction, and the
    // current value is shown only if it points that way. Otherwise a new pitch has
    // no direction until one is picked, so it's never set the wrong way by accident.
    const initialNegative = request.direction !== undefined ? request.direction === 0
        : request.value === null ? null : request.value < 0
    const sameDirection = request.value !== null && (!request.directions || (request.value < 0) === initialNegative)
    const initial = sameDirection && request.value !== null ? split32(Math.abs(request.value)) : null
    const [whole, setWhole] = useState(initial?.whole ?? request.wholes[0])
    const [sixteenths, setSixteenths] = useState(initial?.sixteenths ?? 0)
    const [plus, setPlus] = useState(initial?.plus ?? false)
    const [negative, setNegative] = useState<boolean | null>(initialNegative)

    const magnitude = join32(whole, sixteenths, plus)
    const value = request.directions && negative ? -magnitude : magnitude
    const direction = request.directions && negative !== null ? ` ${request.directions[negative ? 0 : 1]}` : ''
    const needsDirection = !!request.directions && negative === null

    const set = (next: number | null) => {
        request.onSet(next)
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{request.title}</DialogTitle>
                    {request.description && <DialogDescription>{request.description}</DialogDescription>}
                </DialogHeader>

                <output className="flex items-baseline justify-center gap-2 rounded-lg bg-blue-50 py-3 font-mono text-4xl font-semibold text-primary">
                    {format32(magnitude)}″<span className="text-xl font-medium">{direction}</span>
                </output>

                {request.directions && (
                    <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-2">
                        {request.directions.map((label, index) => (
                            <button key={label} type="button" role="radio" aria-checked={negative === (index === 0)}
                                className={cn(choice, 'font-sans text-base', negative === (index === 0) ? chosen : unchosen)}
                                onClick={() => setNegative(index === 0)}>
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">Inches</span>
                    <div role="radiogroup" aria-label="Whole inches" className="grid grid-cols-5 gap-2">
                        {request.wholes.map(option => (
                            <button key={option} type="button" role="radio" aria-checked={whole === option}
                                className={cn(choice, whole === option ? chosen : unchosen)}
                                onClick={() => setWhole(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">Fraction</span>
                    <div role="radiogroup" aria-label="Sixteenths" className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 16 }, (_, option) => (
                            <button key={option} type="button" role="radio" aria-checked={sixteenths === option}
                                className={cn(choice, 'text-base', sixteenths === option ? chosen : unchosen)}
                                onClick={() => setSixteenths(option)}>
                                {sixteenthLabel(option)}
                            </button>
                        ))}
                    </div>
                    <button type="button" aria-pressed={plus}
                        className={cn(choice, 'flex w-full items-center justify-center gap-3', plus ? chosen : unchosen)}
                        onClick={() => setPlus(!plus)}>
                        + <span className="font-sans text-sm">plus 1/32″</span>
                    </button>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => set(null)}>Clear</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={needsDirection} onClick={() => set(value)}>
                            {needsDirection ? `Pick ${request.directions![0]} or ${request.directions![1]}` : `Set ${format32(magnitude)}″${direction}`}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
