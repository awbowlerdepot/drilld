// US holidays shops commonly close or change hours for, to add to a
// location's special hours in one tap (and so listings show them).

const iso = (year: number, month: number, day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** The nth (1-based) weekday (0 = Sunday) of a month; n = -1 for the last. */
const nthWeekday = (year: number, month: number, weekday: number, n: number) => {
    if (n > 0) {
        const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
        return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7)
    }
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const last = new Date(Date.UTC(year, month - 1, lastDay)).getUTCDay()
    return iso(year, month, lastDay - ((last - weekday + 7) % 7))
}

/** Easter Sunday (Anonymous Gregorian algorithm). */
const easter = (year: number) => {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    return iso(year, month, ((h + l - 7 * m + 114) % 31) + 1)
}

const holidaysIn = (year: number) => [
    { date: iso(year, 1, 1), name: "New Year's Day" },
    { date: easter(year), name: 'Easter' },
    { date: nthWeekday(year, 5, 1, -1), name: 'Memorial Day' },
    { date: iso(year, 7, 4), name: 'Independence Day' },
    { date: nthWeekday(year, 9, 1, 1), name: 'Labor Day' },
    { date: nthWeekday(year, 11, 4, 4), name: 'Thanksgiving' },
    { date: iso(year, 12, 24), name: 'Christmas Eve' },
    { date: iso(year, 12, 25), name: 'Christmas' },
    { date: iso(year, 12, 31), name: "New Year's Eve" }
]

/** The next twelve months of holidays from `today` (YYYY-MM-DD). */
export const upcomingHolidays = (today: string) => {
    const year = Number(today.slice(0, 4))
    return [...holidaysIn(year), ...holidaysIn(year + 1)].filter(h => h.date >= today).slice(0, 9)
}
