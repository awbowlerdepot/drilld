import type { GripLineDto, GripStock } from '../../shared/api/grips'
import { apiRequest } from './apiClient'

/** The grip catalog and each location's stock; implemented by the REST API and, without it, by mock data. */
export interface GripsApi {
    catalog: () => Promise<GripLineDto[]>
    stock: (locationId: string) => Promise<GripStock>
    /** Replaces what the location carries. */
    setStock: (locationId: string, stock: GripStock) => Promise<GripStock>
}

export const gripsService: GripsApi = {
    catalog: () => apiRequest('GET', '/grip-catalog'),
    stock: locationId => apiRequest('GET', `/locations/${locationId}/grip-stock`),
    setStock: (locationId, stock) => apiRequest('PUT', `/locations/${locationId}/grip-stock`, stock)
}
