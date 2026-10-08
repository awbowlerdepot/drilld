import type { Customer } from '../types'

const norm = (value: string) => value.trim().toLowerCase()

/** Customers who might be this bowler: same last name, or same first name and a similar last name. */
export const likelyMatches = (customers: Customer[], firstName: string, lastName: string) => {
    const first = norm(firstName)
    const last = norm(lastName)
    if (!last && !first) return []
    return customers
        .filter(c => (last && norm(c.lastName) === last) || (first && norm(c.firstName) === first && last && norm(c.lastName).slice(0, 3) === last.slice(0, 3)))
        .sort((a, b) => Number(norm(b.firstName) === first) - Number(norm(a.firstName) === first))
        .slice(0, 5)
}
