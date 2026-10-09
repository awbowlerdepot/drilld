// Requests for the measurement pickers: a length in 32nds the way shops
// measure it, or a plain number. Used by the drill sheet (through usePicker)
// and by any form that enters measurements the same way.

export interface PickerBase<T> {
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

/** A plain number: degrees, mph, RPM. */
export interface NumberPickerRequest extends PickerBase<number> {
    kind: 'number'
    unit: string
    min: number
    max: number
    step: number
}

