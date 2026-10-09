import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SpecialHours } from '../../../../shared/api/locationHours'
import { upcomingHolidays } from '../../../utils/Holidays'
import { DayHoursRow } from './DayHoursRow'

interface SpecialHoursEditorProps {
    special: SpecialHours[]
    /** Today at the location (YYYY-MM-DD): past dates are tucked away. */
    today: string
    onChange: (special: SpecialHours[]) => void
}

const formatDate = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/**
 * Dates with different hours: holidays (closed, or short hours) and one-offs
 * like a tournament weekend. Listings show these instead of the weekly hours.
 */
export const SpecialHoursEditor = ({ special, today, onChange }: SpecialHoursEditorProps) => {
    const [newDate, setNewDate] = useState('')
    const [showPast, setShowPast] = useState(false)
    const sorted = [...special].sort((a, b) => a.date.localeCompare(b.date))
    const past = sorted.filter(s => s.date < today)
    const shown = showPast ? sorted : sorted.filter(s => s.date >= today)
    const holidays = upcomingHolidays(today).filter(h => !special.some(s => s.date === h.date))

    const add = (date: string, note: string | null) => {
        if (!date || special.some(s => s.date === date)) return
        onChange([...special, { date, closed: true, intervals: [], note }])
        setNewDate('')
    }
    const update = (date: string, change: Partial<SpecialHours>) =>
        onChange(special.map(s => (s.date === date ? { ...s, ...change } : s)))

    return (
        <div className="grid gap-3">
            {shown.length === 0 ? (
                <p className="text-sm text-gray-500">No special dates coming up.</p>
            ) : (
                <div className="rounded-lg border border-border px-3">
                    {shown.map(s => (
                        <div key={s.date} className="grid gap-1 border-b border-gray-100 py-2 last:border-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">{formatDate(s.date)}</span>
                                <Input aria-label={`Note for ${s.date}`} placeholder="Note, e.g. Christmas" value={s.note ?? ''} className="h-8 w-48"
                                    onChange={event => update(s.date, { note: event.target.value || null })} />
                                <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" aria-label={`Remove ${s.date}`}
                                    onClick={() => onChange(special.filter(other => other.date !== s.date))}><X /></Button>
                            </div>
                            <DayHoursRow label={s.closed ? 'Closed' : 'Open'} intervals={s.closed ? [] : s.intervals}
                                onChange={intervals => update(s.date, { closed: intervals.length === 0, intervals })} />
                        </div>
                    ))}
                </div>
            )}
            {past.length > 0 && (
                <button type="button" className="justify-self-start text-xs text-gray-500 underline" onClick={() => setShowPast(!showPast)}>
                    {showPast ? 'Hide past dates' : `Show ${past.length} past ${past.length === 1 ? 'date' : 'dates'}`}
                </button>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <Input type="date" aria-label="Date" value={newDate} min={today} className="h-8 w-44" onChange={event => setNewDate(event.target.value)} />
                <Button type="button" variant="outline" size="sm" disabled={!newDate} onClick={() => add(newDate, null)}>
                    <Plus data-icon="inline-start" /> Add date
                </Button>
            </div>
            {holidays.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-gray-500">Holidays:</span>
                    {holidays.map(h => (
                        <button key={h.date} type="button" onClick={() => add(h.date, h.name)}
                            className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs text-gray-700 hover:bg-muted">
                            + {h.name} <span className="text-gray-400">{formatDate(h.date).replace(/, \d{4}$/, '')}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
