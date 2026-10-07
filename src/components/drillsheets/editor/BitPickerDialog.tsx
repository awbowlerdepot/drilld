import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { format64, sixtyFourthLabel } from '../../../utils/Fractions'
import type { BitPickerRequest } from './pickers'

interface BitPickerDialogProps {
    request: BitPickerRequest
    onClose: () => void
}

const choice = 'rounded-lg border font-mono transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-background hover:bg-muted'

/** Picks a drill bit size: whole inches and 64ths. */
export const BitPickerDialog = ({ request, onClose }: BitPickerDialogProps) => {
    const [whole, setWhole] = useState(request.value === null ? request.wholes[0] : Math.floor(request.value / 64))
    const [part, setPart] = useState(request.value === null ? 0 : request.value % 64)
    const value = whole * 64 + part

    const set = (next: number | null) => {
        request.onSet(next)
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{request.title}</DialogTitle>
                    {request.description && <DialogDescription>{request.description}</DialogDescription>}
                </DialogHeader>

                <output className="rounded-lg bg-blue-50 py-3 text-center font-mono text-4xl font-semibold text-primary">
                    {value > 0 ? `${format64(value)}″` : '—'}
                </output>

                <div role="radiogroup" aria-label="Whole inches" className="grid grid-cols-4 gap-2">
                    {request.wholes.map(option => (
                        <button key={option} type="button" role="radio" aria-checked={whole === option}
                            className={cn(choice, 'h-11 text-lg font-medium', whole === option ? chosen : unchosen)}
                            onClick={() => setWhole(option)}>
                            {option}
                        </button>
                    ))}
                </div>

                <div role="radiogroup" aria-label="64ths" className="grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 64 }, (_, option) => (
                        <button key={option} type="button" role="radio" aria-checked={part === option}
                            className={cn(choice, 'h-10 text-xs', part === option ? chosen : unchosen,
                                option % 8 === 0 && part !== option && 'font-semibold')}
                            onClick={() => setPart(option)}>
                            {sixtyFourthLabel(option)}
                        </button>
                    ))}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => set(null)}>Clear</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={value === 0} onClick={() => set(value)}>Set {value > 0 ? `${format64(value)}″` : ''}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
