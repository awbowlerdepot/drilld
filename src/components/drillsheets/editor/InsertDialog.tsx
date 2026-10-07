import { useState } from 'react'
import { insertManufacturerSchema } from '../../../../shared/api/drillSheetSpec'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FingerHole } from './editorTypes'

type Insert = NonNullable<FingerHole['insert']>

interface InsertDialogProps {
    title: string
    insert: Insert | null | undefined
    onSet: (insert: Insert | null) => void
    onClose: () => void
}

const NONE = 'NONE'

/** Sets a finger hole's insert: manufacturer, type, model and color, or none. */
export const InsertDialog = ({ title, insert, onSet, onClose }: InsertDialogProps) => {
    const [manufacturer, setManufacturer] = useState<string>(insert?.manufacturer ?? NONE)
    const [type, setType] = useState(insert?.type ?? '')
    const [model, setModel] = useState(insert?.model ?? '')
    const [color, setColor] = useState(insert?.color ?? '')

    const save = () => {
        onSet(manufacturer === NONE ? null : {
            manufacturer: insertManufacturerSchema.parse(manufacturer),
            insertSize64: insert?.insertSize64 ?? null,
            type: type.trim() || null,
            model: model.trim() || null,
            color: color.trim() || null
        })
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent>
                <form className="grid gap-4" onSubmit={e => { e.preventDefault(); save() }}>
                    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="insert-manufacturer">Manufacturer</FieldLabel>
                            <Select value={manufacturer} onValueChange={setManufacturer}>
                                <SelectTrigger id="insert-manufacturer"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>No insert</SelectItem>
                                    {insertManufacturerSchema.options.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        {manufacturer !== NONE && (
                            <>
                                <Field>
                                    <FieldLabel htmlFor="insert-type">Type</FieldLabel>
                                    <Input id="insert-type" placeholder="e.g. Quad Classic Oval" value={type} onChange={e => setType(e.target.value)} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field>
                                        <FieldLabel htmlFor="insert-model">Model</FieldLabel>
                                        <Input id="insert-model" value={model} onChange={e => setModel(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="insert-color">Color</FieldLabel>
                                        <Input id="insert-color" value={color} onChange={e => setColor(e.target.value)} />
                                    </Field>
                                </div>
                            </>
                        )}
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Set</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
