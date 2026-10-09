import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { locationHoursSchema } from '../../../../shared/api/locationHours'
import type { Location } from '../../../types'
import { WEEKDAYS, WEEKDAY_LABELS, emptyHours, localNow, type LocationHours, type Weekday } from '../../../utils/LocationHours'
import { DayHoursRow } from './DayHoursRow'
import { SpecialHoursEditor } from './SpecialHoursEditor'

interface LocationHoursTabProps {
    location: Location
    canEdit: boolean
    onSave: (hours: LocationHours) => Promise<void>
}

const WORKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

/**
 * A location's opening hours: each weekday (with split hours for a lunch
 * break, or past midnight), special dates like holidays, and "temporarily
 * closed". These are what get synced to listings.
 */
export const LocationHoursTab = ({ location, canEdit, onSave }: LocationHoursTabProps) => {
    const saved = location.hours ?? emptyHours()
    const [hours, setHours] = useState<LocationHours>(saved)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const dirty = JSON.stringify(hours) !== JSON.stringify(saved)
    const today = localNow(location.timezone || 'America/Denver').date

    const setDay = (day: Weekday, intervals: LocationHours['weekly'][Weekday]) => {
        setHours(prev => ({ ...prev, weekly: { ...prev.weekly, [day]: intervals } }))
        setMessage(null)
    }
    const copyTo = (from: Weekday, days: Weekday[]) =>
        setHours(prev => ({ ...prev, weekly: { ...prev.weekly, ...Object.fromEntries(days.map(day => [day, prev.weekly[from]])) } }))

    const save = async () => {
        const parsed = locationHoursSchema.safeParse(hours)
        if (!parsed.success) {
            const issue = parsed.error.issues[0]
            setError(`${issue.path.filter(p => typeof p === 'string').join(' ')}: ${issue.message}`)
            return
        }
        setError(null)
        setSaving(true)
        try {
            await onSave(parsed.data)
            setMessage('Hours saved.')
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid gap-6">
            <section className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">Weekly hours</h2>
                    <label className="flex items-center gap-2 text-sm">
                        <Switch checked={hours.temporarilyClosed} disabled={!canEdit}
                            onCheckedChange={checked => setHours(prev => ({ ...prev, temporarilyClosed: checked }))} />
                        Temporarily closed
                    </label>
                </div>
                {hours.temporarilyClosed && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Listings will show the shop as temporarily closed until you turn this off.</p>
                )}
                <fieldset disabled={!canEdit} className="rounded-lg border border-border px-3">
                    {WEEKDAYS.map(day => (
                        <DayHoursRow key={day} label={WEEKDAY_LABELS[day].long} intervals={hours.weekly[day]} onChange={intervals => setDay(day, intervals)}
                            actions={day === 'monday' && canEdit ? (
                                <span className="flex gap-1">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => copyTo('monday', WORKDAYS)}>Copy to weekdays</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => copyTo('monday', [...WEEKDAYS])}>Copy to all</Button>
                                </span>
                            ) : undefined} />
                    ))}
                </fieldset>
            </section>

            <section className="grid gap-2">
                <h2 className="text-base font-semibold">Holidays and special dates</h2>
                <p className="text-sm text-gray-500">These replace the weekly hours on that date, here and on your listings.</p>
                <fieldset disabled={!canEdit}>
                    <SpecialHoursEditor special={hours.special} today={today} onChange={special => setHours(prev => ({ ...prev, special }))} />
                </fieldset>
            </section>

            {canEdit && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    {message && !dirty && <p role="status" className="text-sm text-green-800">{message}</p>}
                    <div className="ml-auto flex gap-2">
                        {dirty && <Button type="button" variant="ghost" onClick={() => { setHours(saved); setError(null) }}>Discard</Button>}
                        <Button type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save hours'}</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
