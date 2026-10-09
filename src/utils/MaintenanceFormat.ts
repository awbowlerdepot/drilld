import type { MaintenanceTaskDto } from '../../shared/api/equipment'

/** "Every day", "Every 2 weeks", "Every 3 months", "Every year", plus "or 100 balls". */
export const describeInterval = (task: Pick<MaintenanceTaskDto, 'intervalDays' | 'intervalBalls'>) => {
    const days = task.intervalDays
    const byDays = !days ? null
        : days === 1 ? 'every day'
            : days % 365 === 0 ? (days === 365 ? 'every year' : `every ${days / 365} years`)
                : days >= 28 && days % 30 <= 2 && Math.round(days / 30) > 0 ? `every ${Math.round(days / 30) === 1 ? 'month' : `${Math.round(days / 30)} months`}`
                    : days % 7 === 0 ? (days === 7 ? 'every week' : `every ${days / 7} weeks`)
                        : `every ${days} days`
    const byBalls = task.intervalBalls ? `every ${task.intervalBalls} balls` : null
    const text = [byDays, byBalls].filter(Boolean).join(' or ')
    return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Oct 9" or "Oct 9, 2027" (not this year). */
export const formatDay = (date: string | null) => {
    if (!date) return '—'
    const d = new Date(`${date.slice(0, 10)}T12:00:00Z`)
    const sameYear = d.getUTCFullYear() === new Date().getFullYear()
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' })
}
