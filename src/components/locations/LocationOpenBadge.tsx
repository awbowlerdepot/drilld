import { Badge } from '@/components/ui/badge'
import type { Location } from '../../types'
import { openStatus } from '../../utils/LocationHours'

const STYLES = {
    OPEN: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-700',
    TEMPORARILY_CLOSED: 'bg-amber-100 text-amber-900',
    NO_HOURS: 'bg-gray-100 text-gray-500',
    INACTIVE: 'bg-gray-100 text-gray-500'
} as const

/** "Open · closes 9 PM", in the location's own time zone. */
export const LocationOpenBadge = ({ location }: { location: Location }) => {
    const status = openStatus(location)
    return <Badge className={STYLES[status.state]}>{status.label}</Badge>
}
