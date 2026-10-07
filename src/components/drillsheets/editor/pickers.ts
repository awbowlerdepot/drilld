import { createContext, useContext } from 'react'

// Tapping a value on the drill sheet opens a picker dialog. Components ask
// for one through usePicker(); PickerHost renders it.

interface PickerBase<T> {
    title: string
    description?: string
    value: T | null
    /** Called with the new value, or null when cleared. */
    onSet: (value: T | null) => void
}

/** A length in 32nds: whole inches, a 1/16 grid and a "+" (1/32) toggle. */
export interface LengthPickerRequest extends PickerBase<number> {
    kind: 'length32'
    wholes: number[]
    /** For signed values such as pitch: the two directions, negative first. */
    directions?: [string, string]
}

/** A drill bit size in 64ths. */
export interface BitPickerRequest extends PickerBase<number> {
    kind: 'bit64'
    wholes: number[]
}

/** A plain number: degrees, mph, RPM. */
export interface NumberPickerRequest extends PickerBase<number> {
    kind: 'number'
    unit: string
    min: number
    max: number
    step: number
}

export type PickerRequest = LengthPickerRequest | BitPickerRequest | NumberPickerRequest

export const PickerContext = createContext<((request: PickerRequest) => void) | null>(null)

export const usePicker = () => {
    const open = useContext(PickerContext)
    if (!open) throw new Error('usePicker must be used inside PickerHost')
    return open
}
