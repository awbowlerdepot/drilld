import type { LocationAddress } from '../../shared/api/locationHours'

/** "123 Bowling Lane, Wheat Ridge, CO 80033" (empty parts left out). */
export const formatAddress = (address?: LocationAddress | null) => {
    if (!address) return ''
    const cityLine = [address.city, [address.region, address.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    return [address.line1, address.line2, cityLine].filter(Boolean).join(', ')
}

/** Whether the address has what listings need: street, city, state and zip. */
export const isCompleteAddress = (address?: LocationAddress | null) =>
    !!address && !!address.line1 && !!address.city && !!address.region && !!address.postalCode
