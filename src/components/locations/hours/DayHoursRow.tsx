import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { HoursInterval } from '../../../utils/LocationHours'

interface DayHoursRowProps {
    label: string
    intervals: HoursInterval[]
    onChange: (intervals: HoursInterval[]) => void
    /** Shown after the times, e.g. "Copy to weekdays". */
    actions?: React.ReactNode
}

const DEFAULT_INTERVAL: HoursInterval = { open: '09:00', close: '21:00' }

/** One day: open or closed, and its opening times (more than one for a split day). */
export const DayHoursRow = ({ label, intervals, onChange, actions }: DayHoursRowProps) => {
    const open = intervals.length > 0
    const set = (index: number, change: Partial<HoursInterval>) =>
        onChange(intervals.map((interval, i) => (i === index ? { ...interval, ...change } : interval)))

    return (
        <div className="grid gap-2 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[9rem_1fr] sm:items-start">
            <label className="flex items-center gap-2.5 pt-1 text-sm font-medium">
                <Switch checked={open} onCheckedChange={checked => onChange(checked ? [DEFAULT_INTERVAL] : [])} aria-label={`${label} open`} />
                {label}
            </label>
            {open ? (
                <div className="grid gap-1.5">
                    {intervals.map((interval, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-2">
                            <Input type="time" aria-label={`${label} opens`} value={interval.open} className="h-8 w-32"
                                onChange={event => set(index, { open: event.target.value })} />
                            <span className="text-sm text-gray-500">to</span>
                            <Input type="time" aria-label={`${label} closes`} value={interval.close} className="h-8 w-32"
                                onChange={event => set(index, { close: event.target.value })} />
                            {interval.close && interval.close <= interval.open && <span className="text-xs text-gray-500">next day</span>}
                            {intervals.length > 1 && (
                                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove these hours"
                                    onClick={() => onChange(intervals.filter((_, i) => i !== index))}><X /></Button>
                            )}
                            {index === intervals.length - 1 && (
                                <>
                                    {intervals.length < 4 && (
                                        <Button type="button" variant="ghost" size="sm" title="Add another opening, e.g. after a lunch break"
                                            onClick={() => onChange([...intervals, { open: interval.close, close: '21:00' }])}>
                                            <Plus data-icon="inline-start" /> Split
                                        </Button>
                                    )}
                                    {actions}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 pt-1 text-sm text-gray-500">Closed {actions}</div>
            )}
        </div>
    )
}
