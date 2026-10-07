import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { BEVEL_AMOUNTS, BEVEL_TOOLS, type Bevel, type BevelAmount } from '../../../utils/Bevel'
import { format32 } from '../../../utils/Fractions'

interface BevelDialogProps {
    title: string
    bevel: Bevel | null | undefined
    /** The company's standard amount, used when the sheet doesn't set one. */
    standard: BevelAmount
    onSet: (bevel: Bevel | null) => void
    onClose: () => void
}

const choice = 'min-h-10 rounded-lg border px-3 text-sm transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-white hover:bg-muted'

/** Widths from the wall out: 1/32" to 1/4". */
const WIDTHS = Array.from({ length: 8 }, (_, i) => i + 1)

/**
 * Sets a hole's bevel (the top edge, finished at the bench): the standard, or
 * an amount, a different amount on the palm / hinge side, a width from the
 * wall out, and the tool.
 */
export const BevelDialog = ({ title, bevel, standard, onSet, onClose }: BevelDialogProps) => {
    const [amount, setAmount] = useState<BevelAmount | null>(bevel?.amount ?? null)
    const [palmSide, setPalmSide] = useState<BevelAmount | null>(bevel?.palmSide ?? null)
    const [width32, setWidth32] = useState<number | null>(bevel?.width32 ?? null)
    const [tools, setTools] = useState<Bevel['tools']>(bevel?.tools ?? [])
    const [notes, setNotes] = useState(bevel?.notes ?? '')
    const standardLabel = BEVEL_AMOUNTS.find(a => a.key === standard)!.label

    const save = () => {
        onSet(amount === null ? null : {
            amount,
            palmSide: palmSide && palmSide !== amount ? palmSide : null,
            width32,
            tools,
            notes: notes.trim() || null
        })
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-lg">
                <form className="grid gap-4" onSubmit={e => { e.preventDefault(); save() }}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>The top edge of the hole, finished at the bench.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Amount</FieldLabel>
                            <div role="radiogroup" aria-label="Amount" className="flex flex-wrap gap-1.5">
                                <button type="button" role="radio" aria-checked={amount === null} onClick={() => setAmount(null)}
                                    className={cn(choice, amount === null ? chosen : unchosen)}>Standard ({standardLabel})</button>
                                {BEVEL_AMOUNTS.map(a => (
                                    <button key={a.key} type="button" role="radio" aria-checked={amount === a.key} onClick={() => setAmount(a.key)}
                                        className={cn(choice, amount === a.key ? chosen : unchosen)}>{a.label}</button>
                                ))}
                            </div>
                        </Field>

                        {amount !== null && (
                            <>
                                <Field>
                                    <FieldLabel>Palm / hinge side</FieldLabel>
                                    <div role="radiogroup" aria-label="Palm side" className="flex flex-wrap gap-1.5">
                                        <button type="button" role="radio" aria-checked={!palmSide || palmSide === amount} onClick={() => setPalmSide(null)}
                                            className={cn(choice, !palmSide || palmSide === amount ? chosen : unchosen)}>Same all around</button>
                                        {BEVEL_AMOUNTS.filter(a => a.key !== amount).map(a => (
                                            <button key={a.key} type="button" role="radio" aria-checked={palmSide === a.key} onClick={() => setPalmSide(a.key)}
                                                className={cn(choice, palmSide === a.key ? chosen : unchosen)}>{a.label}</button>
                                        ))}
                                    </div>
                                </Field>
                                <Field>
                                    <FieldLabel>Width from the wall</FieldLabel>
                                    <div role="radiogroup" aria-label="Width" className="flex flex-wrap gap-1.5">
                                        <button type="button" role="radio" aria-checked={width32 === null} onClick={() => setWidth32(null)}
                                            className={cn(choice, width32 === null ? chosen : unchosen)}>Not set</button>
                                        {WIDTHS.map(w => (
                                            <button key={w} type="button" role="radio" aria-checked={width32 === w} onClick={() => setWidth32(w)}
                                                className={cn(choice, 'font-mono', width32 === w ? chosen : unchosen)}>{format32(w)}″</button>
                                        ))}
                                    </div>
                                </Field>
                                <Field>
                                    <FieldLabel>Tools</FieldLabel>
                                    <div role="group" aria-label="Tools" className="flex flex-wrap items-center gap-1.5">
                                        {BEVEL_TOOLS.map(t => {
                                            const on = tools.includes(t.key)
                                            return (
                                                <button key={t.key} type="button" aria-pressed={on}
                                                    onClick={() => setTools(on ? tools.filter(k => k !== t.key) : [...tools, t.key])}
                                                    className={cn(choice, on ? chosen : unchosen)}>{t.label}</button>
                                            )
                                        })}
                                        <span className="text-xs text-gray-500">{tools.length ? 'Pick any combination' : 'None picked: any tool'}</span>
                                    </div>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="bevel-notes">Notes</FieldLabel>
                                    <Input id="bevel-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                                </Field>
                            </>
                        )}
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Set bevel</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
