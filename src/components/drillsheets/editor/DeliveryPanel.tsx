import { Button } from '@/components/ui/button'
import type { Delivery } from '../../../../shared/api/delivery'
import { format32 } from '../../../utils/Fractions'
import { DetailRow } from './DetailRow'
import { usePicker, type NumberPickerRequest } from './pickers'
import type { SheetEditProps } from './editorTypes'

interface DeliveryPanelProps extends SheetEditProps {
    customerName: string
    /** The customer's current delivery, to refresh this fitting's copy from. */
    customerDelivery: Delivery | undefined
}

type NumberField = 'axisTiltDegrees' | 'axisRotationDegrees' | 'speedMph' | 'revRateRpm'

const NUMBER_FIELDS: { key: NumberField; label: string; format: (v: number) => string; picker: Omit<NumberPickerRequest, 'kind' | 'title' | 'value' | 'onSet'> }[] = [
    { key: 'axisTiltDegrees', label: 'Tilt', format: v => `${v}°`, picker: { unit: 'Degrees', min: 0, max: 90, step: 0.1 } },
    { key: 'axisRotationDegrees', label: 'Rotation', format: v => `${v}°`, picker: { unit: 'Degrees', min: 0, max: 90, step: 0.1 } },
    { key: 'speedMph', label: 'Speed', format: v => `${v} mph`, picker: { unit: 'mph', min: 0.1, max: 40, step: 0.1 } },
    { key: 'revRateRpm', label: 'Rev rate', format: v => `${v} RPM`, picker: { unit: 'RPM', min: 1, max: 1000, step: 1 } }
]

/** The bowler's delivery as of this fitting: a copy of the customer's, editable here. */
export const DeliveryPanel = ({ spec, edit, readOnly, hand, customerName, customerDelivery }: DeliveryPanelProps) => {
    const open = usePicker()
    const delivery = spec.delivery ?? {}

    const setField = <K extends keyof Delivery>(key: K, value: Delivery[K]) =>
        edit(draft => { draft.delivery = { ...draft.delivery, [key]: value } })

    return (
        <article aria-label="Delivery" className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-5">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[17px] font-semibold">Delivery</h2>
                    <p className="text-sm text-gray-600">{hand === 'RIGHT' ? 'Right' : 'Left'}-handed · copied from {customerName}'s profile at this fitting</p>
                </div>
                {!readOnly && customerDelivery && (
                    <Button variant="outline" size="sm" onClick={() => edit(draft => { draft.delivery = { ...customerDelivery } })}>
                        Refresh from profile
                    </Button>
                )}
            </header>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
                {NUMBER_FIELDS.map(field => {
                    const value = delivery[field.key]
                    return (
                        <DetailRow key={field.key} readOnly={readOnly} label={field.label} value={value != null ? field.format(value) : null}
                            onClick={() => open({
                                kind: 'number', title: field.label, ...field.picker, value: value ?? null,
                                onSet: next => setField(field.key, next)
                            })} />
                    )
                })}
                <DetailRow readOnly={readOnly} label="PAP over" value={delivery.papOver32 != null ? format32(delivery.papOver32) : null}
                    onClick={() => open({
                        kind: 'length32', title: 'PAP: over', description: 'Inches from the center line', wholes: [3, 4, 5, 6, 7],
                        value: delivery.papOver32 ?? null, onSet: next => setField('papOver32', next)
                    })} />
                <DetailRow readOnly={readOnly} label="PAP up/down"
                    value={delivery.papUp32 != null ? (delivery.papUp32 === 0 ? '0' : `${format32(Math.abs(delivery.papUp32))} ${delivery.papUp32 > 0 ? 'up' : 'down'}`) : null}
                    onClick={() => open({
                        kind: 'length32', title: 'PAP: up or down', directions: ['Down', 'Up'], wholes: [0, 1, 2],
                        value: delivery.papUp32 ?? null, onSet: next => setField('papUp32', next)
                    })} />
            </div>
        </article>
    )
}
