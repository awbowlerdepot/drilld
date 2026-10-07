import { useState, type ReactNode } from 'react'
import { BitPickerDialog } from './BitPickerDialog'
import { GripPickerDialog } from './GripPickerDialog'
import { LengthPickerDialog } from './LengthPickerDialog'
import { NumberPickerDialog } from './NumberPickerDialog'
import { PickerContext, type PickerRequest } from './pickers'

/** Provides usePicker() to the drill sheet and renders the open picker dialog. */
export const PickerHost = ({ children }: { children: ReactNode }) => {
    const [request, setRequest] = useState<PickerRequest | null>(null)
    const close = () => setRequest(null)

    return (
        <PickerContext.Provider value={setRequest}>
            {children}
            {request?.kind === 'length32' && <LengthPickerDialog request={request} onClose={close} />}
            {request?.kind === 'bit64' && <BitPickerDialog request={request} onClose={close} />}
            {request?.kind === 'number' && <NumberPickerDialog request={request} onClose={close} />}
            {(request?.kind === 'insert' || request?.kind === 'thumbHardware') && <GripPickerDialog request={request} onClose={close} />}
        </PickerContext.Provider>
    )
}
