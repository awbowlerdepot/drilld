import { useState } from 'react'
import { drillSheetCreateSchema } from '../../../shared/api/drillSheets'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer } from '../../types'

interface NewDrillSheetDialogProps {
    customer: Customer
    onCreate: (sheet: { name: string; gripStyle: Customer['preferredGripStyle'] }) => Promise<void>
    onClose: () => void
}

const GRIP_STYLES: { value: Customer['preferredGripStyle']; label: string }[] = [
    { value: 'FINGERTIP', label: 'Fingertip' },
    { value: 'CONVENTIONAL', label: 'Conventional' },
    { value: 'TWO_HANDED_NO_THUMB', label: 'Two-handed (no thumb)' }
]

/** Names a new drill sheet; the measurements are entered in the editor. */
export const NewDrillSheetDialog = ({ customer, onCreate, onClose }: NewDrillSheetDialogProps) => {
    const defaultGrip = customer.preferredGripStyle
    const [name, setName] = useState(GRIP_STYLES.find(g => g.value === defaultGrip)?.label ?? '')
    const [gripStyle, setGripStyle] = useState(defaultGrip)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = drillSheetCreateSchema.safeParse({ name, gripStyle })
        if (!result.success) {
            setError(result.error.issues[0]?.message ?? 'Check the name')
            return
        }
        setSaving(true)
        try {
            await onCreate({ name: result.data.name, gripStyle })
        } catch (err) {
            setError((err as Error).message)
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent>
                <form className="grid gap-4" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>New drill sheet</DialogTitle>
                        <DialogDescription>For {customer.firstName} {customer.lastName}. You'll enter the measurements next.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field data-invalid={!!error}>
                            <FieldLabel htmlFor="sheet-name">Name</FieldLabel>
                            <Input id="sheet-name" autoFocus value={name} onChange={e => { setName(e.target.value); setError(null) }} />
                            {error && <FieldError>{error}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="sheet-grip">Grip</FieldLabel>
                            <Select value={gripStyle} onValueChange={value => setGripStyle(value as Customer['preferredGripStyle'])}>
                                <SelectTrigger id="sheet-grip"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {GRIP_STYLES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create and open'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
