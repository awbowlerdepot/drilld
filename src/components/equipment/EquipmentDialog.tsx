import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    EQUIPMENT_KINDS,
    EQUIPMENT_KIND_LABELS,
    VOLUME_CLASSES,
    VOLUME_LABELS,
    equipmentCreateSchema,
    type DrillPressDetails,
    type EquipmentCreate,
    type EquipmentDto,
    type EquipmentKind,
    type EquipmentStatus,
    type VolumeClass
} from '../../../shared/api/equipment'

interface EquipmentDialogProps {
    /** Null to add a machine. */
    machine: EquipmentDto | null
    onSave: (input: EquipmentCreate) => Promise<void>
    onClose: () => void
}

const STATUSES: { value: EquipmentStatus; label: string }[] = [
    { value: 'IN_SERVICE', label: 'In service' },
    { value: 'OUT_OF_SERVICE', label: 'Out of service' },
    { value: 'RETIRED', label: 'Retired' }
]
const NONE = 'NONE'

/**
 * Add or edit a machine. A drill press also records its column, jig and
 * readout, and how hard the shop runs it, which sets its maintenance intervals.
 */
export const EquipmentDialog = ({ machine, onSave, onClose }: EquipmentDialogProps) => {
    const [kind, setKind] = useState<EquipmentKind>(machine?.kind ?? 'DRILL_PRESS')
    const [name, setName] = useState(machine?.name ?? '')
    const [manufacturer, setManufacturer] = useState(machine?.manufacturer ?? '')
    const [model, setModel] = useState(machine?.model ?? '')
    const [serialNumber, setSerialNumber] = useState(machine?.serialNumber ?? '')
    const [purchasedOn, setPurchasedOn] = useState(machine?.purchasedOn ?? '')
    const [status, setStatus] = useState<EquipmentStatus>(machine?.status ?? 'IN_SERVICE')
    const [volume, setVolume] = useState<VolumeClass>(machine?.volume ?? 'STANDARD')
    const [details, setDetails] = useState<Partial<DrillPressDetails>>(machine?.details ?? {})
    const [notes, setNotes] = useState(machine?.notes ?? '')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const press = kind === 'DRILL_PRESS'

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const input = { kind, name, manufacturer, model, serialNumber, purchasedOn, status, volume, details: press ? details : {}, notes }
        const parsed = equipmentCreateSchema.safeParse(input)
        if (!parsed.success) {
            setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])))
            return
        }
        setSaving(true)
        try {
            await onSave(input)
            onClose()
        } catch (err) {
            setErrors({ form: (err as Error).message })
            setSaving(false)
        }
    }

    const text = (id: string, label: string, value: string, set: (value: string) => void, props: React.ComponentProps<typeof Input> = {}) => (
        <Field data-invalid={!!errors[id]}>
            <FieldLabel htmlFor={`equipment-${id}`}>{label}</FieldLabel>
            <Input id={`equipment-${id}`} value={value} onChange={event => { set(event.target.value); setErrors(prev => ({ ...prev, [id]: '' })) }} {...props} />
            {errors[id] && <FieldError>{errors[id]}</FieldError>}
        </Field>
    )
    const choice = <T extends string>(id: string, label: string, value: T | null | undefined, options: { value: T; label: string }[], set: (value: T | null) => void, allowNone = false) => (
        <Field>
            <FieldLabel htmlFor={`equipment-${id}`}>{label}</FieldLabel>
            <Select value={value ?? NONE} onValueChange={v => set(v === NONE ? null : v as T)}>
                <SelectTrigger id={`equipment-${id}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                    {allowNone && <SelectItem value={NONE}>Not set</SelectItem>}
                    {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </Field>
    )

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <form className="grid gap-5" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{machine ? `Edit ${machine.name}` : 'Add equipment'}</DialogTitle>
                        <DialogDescription>
                            {machine ? 'Changing how hard it runs updates the standard maintenance intervals.' : 'A drill press gets the standard drill press maintenance tasks, scaled to how hard you run it.'}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {machine ? (
                                <Field><FieldLabel>Type</FieldLabel><p className="text-sm">{EQUIPMENT_KIND_LABELS[kind]}</p></Field>
                            ) : choice('kind', 'Type', kind, EQUIPMENT_KINDS.map(k => ({ value: k, label: EQUIPMENT_KIND_LABELS[k] })), v => v && setKind(v))}
                            {text('name', 'Name', name, setName, { placeholder: press ? 'e.g. Main drill press' : undefined, autoFocus: !machine })}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {text('manufacturer', 'Make', manufacturer, setManufacturer, { placeholder: press ? 'Jet' : undefined })}
                            {text('model', 'Model', model, setModel, { placeholder: press ? 'JMD-18' : undefined })}
                            {text('serialNumber', 'Serial number', serialNumber, setSerialNumber)}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {text('purchasedOn', 'Purchased (optional)', purchasedOn, setPurchasedOn, { type: 'date' })}
                            {choice('status', 'Status', status, STATUSES, v => v && setStatus(v))}
                        </div>
                        {press && (
                            <>
                                <Field>
                                    <FieldLabel htmlFor="equipment-volume">How hard it runs</FieldLabel>
                                    <Select value={volume} onValueChange={v => setVolume(v as VolumeClass)}>
                                        <SelectTrigger id="equipment-volume"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {VOLUME_CLASSES.map(v => <SelectItem key={v} value={v}>{VOLUME_LABELS[v].label}: {VOLUME_LABELS[v].description}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FieldDescription>Busier shops get shorter maintenance intervals.</FieldDescription>
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {choice('column', 'Column', details.column, [{ value: 'ROUND', label: 'Round column (mill-drill)' }, { value: 'SQUARE', label: 'Square column / heavy mill' }], v => setDetails(d => ({ ...d, column: v })), true)}
                                    {choice('jig', 'Jig', details.jig, [{ value: 'VACUUM', label: 'Vacuum' }, { value: 'CLAMP', label: 'Mechanical clamp' }], v => setDetails(d => ({ ...d, jig: v })), true)}
                                    {choice('vertical', 'Readout: up/down', details.verticalReadout, [{ value: 'UP_POSITIVE', label: 'Up is +' }, { value: 'DOWN_POSITIVE', label: 'Down is +' }], v => setDetails(d => ({ ...d, verticalReadout: v })), true)}
                                    {choice('horizontal', 'Readout: left/right', details.horizontalReadout, [{ value: 'RIGHT_POSITIVE', label: 'Right is +' }, { value: 'LEFT_POSITIVE', label: 'Left is +' }], v => setDetails(d => ({ ...d, horizontalReadout: v })), true)}
                                </div>
                            </>
                        )}
                        <Field>
                            <FieldLabel htmlFor="equipment-notes">Notes (optional)</FieldLabel>
                            <Textarea id="equipment-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={2} />
                        </Field>
                    </FieldGroup>
                    {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : machine ? 'Save' : 'Add equipment'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
