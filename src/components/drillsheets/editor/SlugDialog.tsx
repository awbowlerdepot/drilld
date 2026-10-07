import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { DrillSheetSpec } from '../../../../shared/api/drillSheetSpec'

type Slug = NonNullable<DrillSheetSpec['holes']['thumb']['slug']>

interface SlugDialogProps {
    slug: Slug | null | undefined
    onSet: (slug: Slug | null) => void
    onClose: () => void
}

/** Sets the thumb hardware (slug): manufacturer, type, interchangeable, notes; or removes it. */
export const SlugDialog = ({ slug, onSet, onClose }: SlugDialogProps) => {
    const [manufacturer, setManufacturer] = useState(slug?.manufacturer ?? '')
    const [type, setType] = useState(slug?.type ?? '')
    const [interchangeable, setInterchangeable] = useState(slug?.interchangeable ?? false)
    const [notes, setNotes] = useState(slug?.notes ?? '')

    const save = () => {
        onSet({
            manufacturer: manufacturer.trim() || null,
            type: type.trim() || null,
            size64: slug?.size64 ?? null,
            interchangeable,
            notes: notes.trim() || null
        })
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent>
                <form className="grid gap-4" onSubmit={e => { e.preventDefault(); save() }}>
                    <DialogHeader><DialogTitle>Thumb hardware</DialogTitle></DialogHeader>
                    <FieldGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="slug-manufacturer">Manufacturer</FieldLabel>
                                <Input id="slug-manufacturer" placeholder="e.g. Turbo" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="slug-type">Type</FieldLabel>
                                <Input id="slug-type" placeholder="e.g. Switch Grip" value={type} onChange={e => setType(e.target.value)} />
                            </Field>
                        </div>
                        <Field orientation="horizontal">
                            <Switch id="slug-interchangeable" checked={interchangeable} onCheckedChange={setInterchangeable} />
                            <FieldLabel htmlFor="slug-interchangeable">Interchangeable</FieldLabel>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="slug-notes">Notes</FieldLabel>
                            <Textarea id="slug-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="sm:justify-between">
                        <Button type="button" variant="ghost" className="text-destructive" onClick={() => { onSet(null); onClose() }}>
                            No hardware
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Set</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
