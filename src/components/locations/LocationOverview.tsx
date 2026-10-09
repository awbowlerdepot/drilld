import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { Location } from '../../types'
import { formatAddress, isCompleteAddress } from '../../utils/LocationAddress'
import { formatIntervals, hoursOn, localNow, weeklySummary } from '../../utils/LocationHours'

/** The location at a glance: contact details, hours, and what listings still need. */
export const LocationOverview = ({ location }: { location: Location }) => {
    const today = localNow(location.timezone || 'America/Denver').date
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
                        <p className="text-sm text-gray-700">{weeklySummary(location.hours)}</p>
                        {upcoming.length > 0 && (
                            <ul className="grid gap-0.5 text-sm text-gray-600">
                                {upcoming.map(s => (
                                    <li key={s.date}>
                                        {new Date(`${s.date}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                        {s.note ? ` (${s.note})` : ''}: {formatIntervals(hoursOn(location.hours!, s.date).intervals)}
                                    </li>
                                ))}
                            </ul>
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
