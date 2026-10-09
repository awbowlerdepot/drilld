import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { NumberPickerRequest } from './pickerRequests'

interface NumberPickerDialogProps {
    request: NumberPickerRequest
    onClose: () => void
}

/** Enters a plain number (degrees, mph, RPM) within a range. */
export const NumberPickerDialog = ({ request, onClose }: NumberPickerDialogProps) => {
    const [text, setText] = useState(request.value === null ? '' : String(request.value))
    const value = Number(text)
    const invalid = text.trim() === '' || !Number.isFinite(value) || value < request.min || value > request.max
        || Math.abs(Math.round(value / request.step) * request.step - value) > 1e-9

    const set = (next: number | null) => {
        request.onSet(next)
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent>
                <form className="grid gap-4" onSubmit={e => { e.preventDefault(); if (!invalid) set(value) }}>
                    <DialogHeader>
                        <DialogTitle>{request.title}</DialogTitle>
                        {request.description && <DialogDescription>{request.description}</DialogDescription>}
                    </DialogHeader>
                    <Field data-invalid={text !== '' && invalid}>
                        <FieldLabel htmlFor="number-picker">{request.unit}</FieldLabel>
                        <Input id="number-picker" autoFocus inputMode="decimal" className="h-12 font-mono text-2xl"
                            value={text} onChange={e => setText(e.target.value)} />
                        {text !== '' && invalid && (
                            <FieldError>Enter {request.min}–{request.max}{request.step < 1 ? `, in steps of ${request.step}` : ', a whole number'}</FieldError>
                        )}
                    </Field>
                    <DialogFooter className="sm:justify-between">
                        <Button type="button" variant="ghost" className="text-destructive" onClick={() => set(null)}>Clear</Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={invalid}>Set</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
