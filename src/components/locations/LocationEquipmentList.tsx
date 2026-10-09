import type { Location } from '../../types'

const CONDITION: Record<string, string> = { excellent: 'Excellent', good: 'Good', fair: 'Fair', needs_repair: 'Needs repair' }

/** The location's equipment as recorded so far. Equipment records with scheduled maintenance replace this next. */
export const LocationEquipmentList = ({ location }: { location: Location }) => {
    const equipment = location.equipmentInfo?.equipment ?? []
    return (
        <div className="grid gap-3">
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                Equipment records with scheduled maintenance are coming next. What's listed here will move over.
            </p>
            {equipment.length === 0 ? (
                <p className="text-sm text-gray-500">No equipment recorded.</p>
            ) : (
                <ul className="grid gap-2">
                    {equipment.map((item, index) => (
                        <li key={index} className="rounded-lg border border-border px-3 py-2 text-sm">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="block text-gray-600">{[item.manufacturer, item.model, item.serialNumber && `S/N ${item.serialNumber}`, CONDITION[item.condition]].filter(Boolean).join(' · ')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
