import { addOffsets, toReadout, type Offset, type PressReadout } from '../../../utils/DrillReadouts'
import { formatDecimal } from '../../../utils/Fractions'

interface OvalReadoutTableProps {
    label: string
    /** The hole's pitch center, physical (up and right positive). */
    center: Offset
    /** Each cut's offset from the center, in drilling order. */
    cuts: Offset[]
    /** Where the center row goes among the cuts (0 = before the first cut). */
    centerIndex: number
    press: PressReadout
    note: string
}

/** Calculated drill press readout positions for a hole's oval cuts, in drilling order. */
export const OvalReadoutTable = ({ label, center, cuts, centerIndex, press, note }: OvalReadoutTableProps) => {
    const rows: { key: string; step: string; position: Offset; offset: Offset | null }[] = cuts.map((cut, index) => ({
        key: `cut-${index}`, step: String(index + 1), position: addOffsets(center, cut), offset: cut
    }))
    rows.splice(centerIndex, 0, { key: 'center', step: 'center', position: center, offset: null })

    const signed = (value: number) => formatDecimal(value, { signed: true })

    return (
        <div className="space-y-1.5">
            <table aria-label={label} className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-gray-50 text-sm">
                <thead>
                    <tr className="text-left text-gray-500">
                        <th className="px-2 py-1.5 font-medium">#</th>
                        <th className="px-2 py-1.5 font-medium">Vertical readout</th>
                        <th className="px-2 py-1.5 font-medium">Horizontal readout</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const position = toReadout(row.position, press)
                        const offset = row.offset && toReadout(row.offset, press)
                        const isCenter = row.offset === null
                        return (
                            <tr key={row.key} className={isCenter ? 'border-t border-border text-gray-500' : 'border-t border-border'}>
                                <td className="px-2 py-1.5 text-gray-500">{isCenter ? <span className="text-xs">center</span> : row.step}</td>
                                <td className="px-2 py-1.5 font-mono">
                                    <span className={isCenter ? '' : 'font-semibold text-gray-900'}>{signed(position.vertical)}</span>
                                    {offset && <span className="block text-xs text-gray-500">{signed(offset.vertical)}</span>}
                                </td>
                                <td className="px-2 py-1.5 font-mono">
                                    <span className={isCenter ? '' : 'font-semibold text-gray-900'}>{signed(position.horizontal)}</span>
                                    {offset && <span className="block text-xs text-gray-500">{signed(offset.horizontal)}</span>}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <p className="text-xs text-gray-500">{note}</p>
        </div>
    )
}
