import { createContext, useContext } from 'react'
import type { LengthPickerRequest, NumberPickerRequest, PickerBase } from '../../pickers/pickerRequests'
import type { Insert, ThumbHardware } from './editorTypes'

export type { LengthPickerRequest, NumberPickerRequest }

// Tapping a value on the drill sheet opens a picker dialog. Components ask
// for one through usePicker(); PickerHost renders it.

/** A drill bit size in 64ths, from the shop's bits (src/utils/DrillBits). */
export interface BitPickerRequest extends PickerBase<number> {
    kind: 'bit64'
    /** List the interchangeable-hardware (collar) bits first, e.g. for a thumb O.D. */
    hardwareFirst?: boolean
}

/** A finger insert from the grip catalog (what the location carries first), or one entered by hand. */
export interface InsertPickerRequest extends PickerBase<Insert> {
    kind: 'insert'
    /** The location whose stock is offered first. */
    locationId?: string
}

/** Thumb hardware from the grip catalog: a thumb insert, slug, or interchangeable system. */
export interface ThumbHardwarePickerRequest extends PickerBase<ThumbHardware> {
    kind: 'thumbHardware'
    locationId?: string
}

export type PickerRequest = LengthPickerRequest | BitPickerRequest | NumberPickerRequest | InsertPickerRequest | ThumbHardwarePickerRequest

export const PickerContext = createContext<((request: PickerRequest) => void) | null>(null)

export const usePicker = () => {
    const open = useContext(PickerContext)
    if (!open) throw new Error('usePicker must be used inside PickerHost')
    return open
}
