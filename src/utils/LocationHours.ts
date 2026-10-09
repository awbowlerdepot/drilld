// Reading a location's hours: open right now (in the location's time zone),
// today's hours, and a one-line weekly summary. Hours are structured
// (shared/api/locationHours.ts): per weekday a list of HH:MM intervals, plus
// special dates and "temporarily closed". A close at or before the open
// time runs past midnight.

import { WEEKDAYS, type HoursInterval, type LocationHours, type Weekday } from '../../shared/api/locationHours'

export { WEEKDAYS }
export type { HoursInterval, LocationHours, Weekday }

export const WEEKDAY_LABELS: Record<Weekday, { short: string; long: string }> = {
    monday: { short: 'Mon', long: 'Monday' },
    tuesday: { short: 'Tue', long: 'Tuesday' },
    wednesday: { short: 'Wed', long: 'Wednesday' },
    thursday: { short: 'Thu', long: 'Thursday' },
    friday: { short: 'Fri', long: 'Friday' },
    saturday: { short: 'Sat', long: 'Saturday' },
    sunday: { short: 'Sun', long: 'Sunday' }
}

const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))

/** "09:00" → "9 AM", "21:30" → "9:30 PM", "00:00" → "12 AM". */
export const formatTime = (value: string) => {
    const hour = Number(value.slice(0, 2))
    const minute = value.slice(3)
    const h12 = hour % 12 === 0 ? 12 : hour % 12
    return `${h12}${minute === '00' ? '' : `:${minute}`} ${hour < 12 ? 'AM' : 'PM'}`
}

/** "9 AM – 9 PM", "Closed". */
export const formatIntervals = (intervals: HoursInterval[]) =>
    intervals.length === 0 ? 'Closed' : intervals.map(i => `${formatTime(i.open)} – ${formatTime(i.close)}`).join(', ')

/** The date (YYYY-MM-DD), weekday and minutes past midnight of `now` in a time zone. */
export const localNow = (timeZone: string, now: Date = new Date()) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).map(part => [part.type, part.value]))
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        weekday: parts.weekday.toLowerCase() as Weekday,
        minutes: Number(parts.hour) * 60 + Number(parts.minute)
    }
}

const addDays = (date: string, days: number) => {
    const d = new Date(`${date}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}
const weekdayOf = (date: string): Weekday => WEEKDAYS[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7]

/** The hours that apply on a date: a special date's hours, or the weekday's. */
export const hoursOn = (hours: LocationHours, date: string): { intervals: HoursInterval[]; special: LocationHours['special'][number] | null } => {
    const special = hours.special.find(s => s.date === date) ?? null
    if (special) return { intervals: special.closed ? [] : special.intervals, special }
    return { intervals: hours.weekly[weekdayOf(date)], special: null }
}

export type OpenState = 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED' | 'NO_HOURS' | 'INACTIVE'

/**
 * Whether the location is open now, and a short label: "Open · closes 9 PM",
 * "Closed · opens 10 AM", "Closed · opens Tue 10 AM", "Closed today · Christmas".
 */
export const openStatus = (location: { hours?: LocationHours | null; timezone?: string; active: boolean }, now: Date = new Date()): { state: OpenState; label: string } => {
    if (!location.active) return { state: 'INACTIVE', label: 'Inactive' }
    const hours = location.hours
    if (!hours || (WEEKDAYS.every(day => hours.weekly[day].length === 0) && hours.special.length === 0)) {
        return { state: 'NO_HOURS', label: 'Hours not set' }
    }
    if (hours.temporarilyClosed) return { state: 'TEMPORARILY_CLOSED', label: 'Temporarily closed' }

    const here = localNow(location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, now)
    // Still open from yesterday's past-midnight interval?
    for (const interval of hoursOn(hours, addDays(here.date, -1)).intervals) {
        const open = toMinutes(interval.open)
        const close = toMinutes(interval.close)
        if (close <= open && here.minutes < close) return { state: 'OPEN', label: `Open · closes ${formatTime(interval.close)}` }
    }
    const today = hoursOn(hours, here.date)
    for (const interval of today.intervals) {
        const open = toMinutes(interval.open)
        const close = toMinutes(interval.close)
        const pastMidnight = close <= open
        if (here.minutes >= open && (pastMidnight || here.minutes < close)) {
            return { state: 'OPEN', label: `Open · closes ${formatTime(interval.close)}` }
        }
    }
    const laterToday = today.intervals.map(i => i.open).filter(open => toMinutes(open) > here.minutes).sort()[0]
    if (laterToday) return { state: 'CLOSED', label: `Closed · opens ${formatTime(laterToday)}` }
    // The next day with hours, within two weeks.
    for (let days = 1; days <= 14; days++) {
        const date = addDays(here.date, days)
        const next = hoursOn(hours, date).intervals.map(i => i.open).sort()[0]
        if (next) {
            const when = days === 1 ? 'tomorrow' : WEEKDAY_LABELS[weekdayOf(date)].short
            const reason = today.special?.closed ? ` · ${today.special.note ?? 'closed today'}` : ''
            return { state: 'CLOSED', label: `Closed${reason} · opens ${when} ${formatTime(next)}` }
        }
    }
    return { state: 'CLOSED', label: 'Closed' }
}

/** Today's hours at the location: "9 AM – 9 PM", "Closed", "Closed (Christmas)". */
export const todaysHours = (location: { hours?: LocationHours | null; timezone?: string }, now: Date = new Date()) => {
    if (!location.hours) return null
    const here = localNow(location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, now)
    const { intervals, special } = hoursOn(location.hours, here.date)
    return `${formatIntervals(intervals)}${special?.note ? ` (${special.note})` : ''}`
}

/** Days with the same hours grouped: "Mon–Thu 9 AM – 9 PM · Fri–Sat 9 AM – 10 PM · Sun Closed". */
export const weeklySummary = (hours: LocationHours) => {
    const groups: { from: Weekday; to: Weekday; text: string }[] = []
    for (const day of WEEKDAYS) {
        const text = formatIntervals(hours.weekly[day])
        const last = groups[groups.length - 1]
        if (last && last.text === text) last.to = day
        else groups.push({ from: day, to: day, text })
    }
    return groups.map(g => `${WEEKDAY_LABELS[g.from].short}${g.from === g.to ? '' : `–${WEEKDAY_LABELS[g.to].short}`} ${g.text}`).join(' · ')
}

/** Empty hours: closed every day. */
export const emptyHours = (): LocationHours => ({
    weekly: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    special: [],
    temporarilyClosed: false
})
