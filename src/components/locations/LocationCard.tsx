import { MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Location } from '../../types'
import { formatAddress } from '../../utils/LocationAddress'
import { todaysHours } from '../../utils/LocationHours'
import { LocationOpenBadge } from './LocationOpenBadge'

/** A location in the list: open now, today's hours, address and phone. Tap to open it. */
export const LocationCard = ({ location, onOpen }: { location: Location; onOpen: () => void }) => {
    const today = todaysHours(location)
    return (
        <button type="button" onClick={onOpen}
            className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-primary">
            <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-gray-900">{location.name}</span>
                {!location.active && <Badge variant="outline">Inactive</Badge>}
            </span>
            {location.active && (
                <span className="flex flex-wrap items-center gap-2 text-sm">
                    <LocationOpenBadge location={location} />
                    {today && <span className="text-gray-600">Today {today}</span>}
                </span>
            )}
            {location.address && (
                <span className="flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" /> {formatAddress(location.address)}
                </span>
            )}
            {location.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="size-4 text-gray-400" aria-hidden="true" /> {location.phone}
                </span>
            )}
        </button>
    )
}
