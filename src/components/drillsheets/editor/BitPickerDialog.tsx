import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ALL_BIT_SIZES, FINE_BITS, HARDWARE_BITS, LARGE_BITS } from '../../../utils/DrillBits'
import { format64 } from '../../../utils/Fractions'
import type { BitPickerRequest } from './pickers'

interface BitPickerDialogProps {
    request: BitPickerRequest
    onClose: () => void
}

const choice = 'rounded-lg border font-mono transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-background hover:bg-muted'

/** Picks a drill bit from the sizes the shop has: standard bits, then interchangeable-hardware bits. */
export const BitPickerDialog = ({ request, onClose }: BitPickerDialogProps) => {
    const [value, setValue] = useState<number | null>(request.value)
    const [hardware, setHardware] = useState<string | null>(null)

    const set = (next: number | null) => {
        request.onSet(next)
        onClose()
    }

    const bitButton = (size: number, key: string, options: { label?: ReactNode; system?: string; className?: string } = {}) => {
        const selected = value === size && hardware === (options.system ?? null)
        return (
            <button key={key} type="button" role="radio" aria-checked={selected}
                aria-label={`${format64(size)} inch${options.system ? `, ${options.system} collar bit` : ''}`}
                className={cn(choice, 'h-10 text-xs', selected ? chosen : unchosen, options.className)}
                onClick={() => { setValue(size); setHardware(options.system ?? null) }}>
                {options.label ?? format64(size)}
            </button>
        )
    }

    const standard = (
        <section className="space-y-2" key="standard">
            <h3 className="text-sm font-medium text-gray-600">Standard bits</h3>
            <div role="radiogroup" aria-label="Standard bits, 1/2 to 1-1/8" className="grid grid-cols-8 gap-1.5">
                {/* Eighths in bold, as landmarks. */}
                {FINE_BITS.map(size => bitButton(size, `fine-${size}`, { className: size % 8 === 0 ? 'font-semibold' : undefined }))}
            </div>
            <div role="radiogroup" aria-label="Large bits" className="grid grid-cols-3 gap-1.5">
                {LARGE_BITS.map(size => bitButton(size, `large-${size}`, { className: 'h-11 text-sm' }))}
            </div>
        </section>
    )

    const interchangeable = (
        <section className="space-y-2" key="hardware">
            <h3 className="text-sm font-medium text-gray-600">Interchangeable hardware · preset collar</h3>
            <div role="radiogroup" aria-label="Interchangeable hardware bits" className="grid grid-cols-5 gap-1.5">
                {HARDWARE_BITS.map(bit => bitButton(bit.size64, `hw-${bit.system}-${bit.size64}`, {
                    system: bit.system,
                    className: 'h-auto py-1.5 text-sm',
                    label: <span className="flex flex-col items-center leading-tight">{format64(bit.size64)}<span className="font-sans text-[11px] opacity-80">{bit.system}</span></span>
                }))}
            </div>
        </section>
    )

    const unusual = request.value !== null && !ALL_BIT_SIZES.has(request.value)

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{request.title}</DialogTitle>
                    {request.description && <DialogDescription>{request.description}</DialogDescription>}
                </DialogHeader>

                <output className="rounded-lg bg-blue-50 py-3 text-center font-mono text-4xl font-semibold text-primary">
                    {value ? `${format64(value)}″` : '—'}
                    {hardware && <span className="ml-2 font-sans text-base font-medium">{hardware} collar</span>}
                </output>
                {unusual && (
                    <p className="text-xs text-amber-700">{format64(request.value!)}″ isn't one of the shop's bits; pick one to change it.</p>
                )}

                {request.hardwareFirst ? [interchangeable, standard] : [standard, interchangeable]}

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => set(null)}>Clear</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={!value} onClick={() => set(value)}>Set {value ? `${format64(value)}″` : ''}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
