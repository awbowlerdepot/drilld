import type {
    BallDetailDto,
    BallDto,
    BallLookupDto,
    BallRegister,
    BallUpdate,
    CatalogBallDto,
    CatalogBrandDto,
    CatalogStatusDto
} from '../../shared/api/balls'
import type { BallLayoutWrite } from '../../shared/api/ballLayouts'
import { apiRequest } from './apiClient'

/** The ball catalog and the company's balls. */
export interface BallsApi {
    searchCatalog: (query: string, brandId?: string) => Promise<CatalogBallDto[]>
    brands: () => Promise<CatalogBrandDto[]>
    catalogStatus: () => Promise<CatalogStatusDto>
    list: (filter?: { customerId?: string }) => Promise<BallDto[]>
    get: (id: string) => Promise<BallDetailDto>
    lookup: (brandId: string, serial: string) => Promise<BallLookupDto>
    register: (input: BallRegister) => Promise<BallDetailDto>
    update: (id: string, input: BallUpdate) => Promise<BallDetailDto>
    addLayout: (ballId: string, input: BallLayoutWrite) => Promise<BallDetailDto>
    updateLayout: (layoutId: string, input: BallLayoutWrite) => Promise<BallDetailDto>
    deleteLayout: (layoutId: string) => Promise<BallDetailDto>
}

const query = (params: Record<string, string | undefined>) => {
    const entries = Object.entries(params).filter((entry): entry is [string, string] => !!entry[1])
    return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const ballsService: BallsApi = {
    searchCatalog: (q, brandId) => apiRequest('GET', `/catalog/balls${query({ q, brandId })}`),
    brands: () => apiRequest('GET', '/catalog/brands'),
    catalogStatus: () => apiRequest('GET', '/catalog/status'),
    list: filter => apiRequest('GET', `/balls${query({ customerId: filter?.customerId })}`),
    get: id => apiRequest('GET', `/balls/${id}`),
    lookup: (brandId, serial) => apiRequest('GET', `/balls/lookup${query({ brandId, serial })}`),
    register: input => apiRequest('POST', '/balls', input),
    update: (id, input) => apiRequest('PATCH', `/balls/${id}`, input),
    addLayout: (ballId, input) => apiRequest('POST', `/balls/${ballId}/layouts`, input),
    updateLayout: (layoutId, input) => apiRequest('PATCH', `/ball-layouts/${layoutId}`, input),
    deleteLayout: layoutId => apiRequest('DELETE', `/ball-layouts/${layoutId}`)
}
