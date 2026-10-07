import type { MeDto } from '../../shared/api/me'
import { apiRequest } from './apiClient'

export const meService = {
    get: () => apiRequest<MeDto>('GET', '/me')
}
