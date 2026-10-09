import { cn } from '@/lib/utils'
import { formatTime, weeklyGroups, type LocationHours, type Weekday } from '../../../utils/LocationHours'

interface WeeklyHoursTableProps {
    hours: LocationHours
    /** Highlighted (today at the location). */
    today?: Weekday
}

/** The weekly hours as a table: days with the same hours share a row; each opening on its own line. */
export const WeeklyHoursTable = ({ hours, today }: WeeklyHoursTableProps) => (
    <table className="w-full max-w-sm text-sm">
        <tbody>
            {weeklyGroups(hours).map(group => {
                const isToday = !!today && group.weekdays.includes(today)
                return (
                    <tr key={group.days} className={cn('border-b border-gray-100 align-top last:border-0', isToday && 'font-semibold text-gray-900')}>
                        <th scope="row" className={cn('py-1.5 pr-4 text-left font-medium', isToday ? 'text-primary' : 'text-gray-700')}>
                            {group.days}
                            {isToday && <span className="ml-1.5 text-xs font-normal text-primary">today</span>}
                        </th>
                        <td className="py-1.5 text-right tabular-nums text-gray-800">
                            {group.intervals.length === 0 ? <span className="text-gray-500">Closed</span> : group.intervals.map((interval, i) => (
                                <span key={i} className="block">{formatTime(interval.open)} – {formatTime(interval.close)}</span>
                            ))}
                        </td>
                    </tr>
                )
            })}
        </tbody>
    </table>
)
