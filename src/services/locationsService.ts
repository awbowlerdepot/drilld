import type { LocationCreate, LocationDto, LocationUpdate } from '../../shared/api/locations'
import type { Location, LocationSettingsOverrides } from '../types'
import { apiRequest } from './apiClient'

/** API location → the frontend's Location (nulls become absent fields). */
const toLocation = (dto: LocationDto): Location => ({
    id: dto.id,
    companyID: dto.companyID,
    name: dto.name,
    address: dto.address ?? undefined,
    phone: dto.phone ?? undefined,
    email: dto.email ?? undefined,
    website: dto.website ?? undefined,
    timezone: dto.timezone,
    hours: dto.hours ?? undefined,
    settingsOverrides: dto.settingsOverrides as LocationSettingsOverrides,
    active: dto.active,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
})

type LocationFields = Omit<Location, 'id' | 'companyID' | 'createdAt' | 'updatedAt'>

/** Only the fields present in the input are sent, so a partial update never clears other fields. */
const toRequest = (location: Partial<LocationFields>): LocationUpdate => {
    const request: LocationUpdate = {}
    if ('name' in location) request.name = location.name
    if ('address' in location) request.address = location.address ?? null
    if ('phone' in location) request.phone = location.phone || null
    if ('email' in location) request.email = location.email || null
    if ('website' in location) request.website = location.website || null
    if ('timezone' in location) request.timezone = location.timezone
    if ('hours' in location) request.hours = location.hours ?? null
    if ('settingsOverrides' in location) request.settingsOverrides = (location.settingsOverrides ?? {}) as Record<string, unknown>
    if ('active' in location) request.active = location.active
    return request
}

export const locationsService = {
    list: async () => (await apiRequest<LocationDto[]>('GET', '/locations')).map(toLocation),
    create: async (location: LocationFields) => {
        const request = { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...toRequest(location) }
        return toLocation(await apiRequest<LocationDto>('POST', '/locations', request as LocationCreate))
    },
    update: async (id: string, changes: Partial<LocationFields>) =>
        toLocation(await apiRequest<LocationDto>('PATCH', `/locations/${id}`, toRequest(changes)))
}
