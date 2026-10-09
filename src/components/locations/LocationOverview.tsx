import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { Location } from '../../types'
import { formatAddress, isCompleteAddress } from '../../utils/LocationAddress'
import { formatIntervals, hoursOn, localNow } from '../../utils/LocationHours'
import { WeeklyHoursTable } from './hours/WeeklyHoursTable'

/** The location at a glance: contact details, hours, and what listings still need. */
export const LocationOverview = ({ location }: { location: Location }) => {
    const here = localNow(location.timezone || 'America/Denver')
    const today = here.date
    const upcoming = (location.hours?.special ?? []).filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
    const missing = [
        !isCompleteAddress(location.address) && 'a full address',
        !location.phone && 'a phone number',
        !location.hours && 'opening hours'
    ].filter(Boolean)

    const row = (icon: React.ReactNode, text: React.ReactNode) => (
        <p className="flex items-start gap-2 text-sm text-gray-700">{icon}<span className="min-w-0 break-words">{text}</span></p>
    )

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <section className="grid content-start gap-2">
                <h2 className="text-base font-semibold">Contact</h2>
                {row(<MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" />, formatAddress(location.address) || <span className="text-gray-400">No address</span>)}
                {row(<Phone className="mt-0.5 size-4 shrink-0 text-gray-400" />, location.phone || <span className="text-gray-400">No phone</span>)}
                {location.email && row(<Mail className="mt-0.5 size-4 shrink-0 text-gray-400" />, location.email)}
                {location.website && row(<Globe className="mt-0.5 size-4 shrink-0 text-gray-400" />, <a className="text-primary hover:underline" href={location.website} target="_blank" rel="noreferrer">{location.website}</a>)}
                <p className="text-xs text-gray-500">Time zone: {location.timezone}</p>
            </section>
            <section className="grid content-start gap-2">
                <h2 className="text-base font-semibold">Hours</h2>
                {location.hours ? (
                    <>
                        {location.hours.temporarilyClosed && <p className="text-sm font-medium text-amber-900">Temporarily closed</p>}
                        <WeeklyHoursTable hours={location.hours} today={here.weekday} />
                        {upcoming.length > 0 && (
                            <>
                                <h3 className="mt-2 text-sm font-semibold text-gray-700">Holidays and special dates</h3>
                                <table className="w-full max-w-sm text-sm">
                                    <tbody>
                                        {upcoming.map(s => (
                                            <tr key={s.date} className="border-b border-gray-100 align-top last:border-0">
                                                <th scope="row" className="py-1.5 pr-4 text-left font-medium text-gray-700">
                                                    {new Date(`${s.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                    {s.note && <span className="block text-xs font-normal text-gray-500">{s.note}</span>}
                                                </th>
                                                <td className="py-1.5 text-right tabular-nums text-gray-800">
                                                    {s.closed ? <span className="text-gray-500">Closed</span> : formatIntervals(hoursOn(location.hours!, s.date).intervals)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </>
                ) : <p className="text-sm text-gray-400">Not set</p>}
            </section>
            {missing.length > 0 && location.active && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 md:col-span-2">
                    For listings (Google, Facebook, Apple Maps, Yelp), add {missing.join(', ')}.
                </p>
            )}
        </div>
    )
}
