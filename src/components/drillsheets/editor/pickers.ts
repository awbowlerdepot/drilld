import { createContext, useContext } from 'react'
import type { Insert } from './editorTypes'

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
    /** The direction of the box that was tapped (0 = the first, negative one), preselected. */
    direction?: 0 | 1
}

/** A drill bit size in 64ths, from the shop's bits (src/utils/DrillBits). */
export interface BitPickerRequest extends PickerBase<number> {
    kind: 'bit64'
    /** List the interchangeable-hardware (collar) bits first, e.g. for a thumb O.D. */
    hardwareFirst?: boolean
}

/** A plain number: degrees, mph, RPM. */
export interface NumberPickerRequest extends PickerBase<number> {
    kind: 'number'
    unit: string
    min: number
    max: number
    step: number
}

/** A finger insert from the grip catalog (what the location carries first), or one entered by hand. */
export interface InsertPickerRequest extends PickerBase<Insert> {
    kind: 'insert'
    /** The location whose stock is offered first. */
    locationId?: string
}

export type PickerRequest = LengthPickerRequest | BitPickerRequest | NumberPickerRequest | InsertPickerRequest

export const PickerContext = createContext<((request: PickerRequest) => void) | null>(null)

export const usePicker = () => {
    const open = useContext(PickerContext)
    if (!open) throw new Error('usePicker must be used inside PickerHost')
    return open
}
