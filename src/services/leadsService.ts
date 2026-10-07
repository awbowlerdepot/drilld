import type { LeadDto, LeadNoteDto, LeadStatus } from '../../shared/api/leads'
import { apiRequest } from './apiClient'

/** Early access signups from drilld.io. Platform admins only. */
export const leadsService = {
    list: () => apiRequest<LeadDto[]>('GET', '/leads'),
    get: (id: string) => apiRequest<{ lead: LeadDto; notes: LeadNoteDto[] }>('GET', `/leads/${id}`),
    setStatus: (id: string, status: LeadStatus) => apiRequest<LeadDto>('PATCH', `/leads/${id}`, { status }),
    addNote: (id: string, body: string) => apiRequest<LeadNoteDto>('POST', `/leads/${id}/notes`, { body }),
    remove: (id: string) => apiRequest<void>('DELETE', `/leads/${id}`)
}
