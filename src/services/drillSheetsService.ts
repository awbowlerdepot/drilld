import type {
    DrillSheetCreate,
    DrillSheetDraft,
    DrillSheetDto,
    DrillSheetRevisionDto,
    DrillSheetRevisionSummaryDto,
    DrillSheetUpdate
} from '../../shared/api/drillSheets'
import { apiRequest } from './apiClient'

/** Drill sheet operations; implemented by the REST API and, without it, by mock data. */
export interface DrillSheetsApi {
    list: (customerId: string, options?: { archived?: boolean }) => Promise<DrillSheetDto[]>
    create: (customerId: string, sheet: DrillSheetCreate) => Promise<DrillSheetDto>
    get: (id: string) => Promise<DrillSheetDto>
    update: (id: string, changes: DrillSheetUpdate) => Promise<DrillSheetDto>
    /** Saves the draft in place, or starts a new draft revision if the current one is locked. */
    saveDraft: (id: string, draft: DrillSheetDraft) => Promise<DrillSheetDto>
    revisions: (id: string) => Promise<DrillSheetRevisionSummaryDto[]>
    revision: (id: string, version: number) => Promise<DrillSheetRevisionDto>
    approve: (id: string, version: number) => Promise<DrillSheetRevisionDto>
}

export const drillSheetsService: DrillSheetsApi = {
    list: (customerId, options = {}) =>
        apiRequest('GET', `/customers/${customerId}/drill-sheets${options.archived ? '?archived=true' : ''}`),
    create: (customerId, sheet) => apiRequest('POST', `/customers/${customerId}/drill-sheets`, sheet),
    get: id => apiRequest('GET', `/drill-sheets/${id}`),
    update: (id, changes) => apiRequest('PATCH', `/drill-sheets/${id}`, changes),
    saveDraft: (id, draft) => apiRequest('PUT', `/drill-sheets/${id}/draft`, draft),
    revisions: id => apiRequest('GET', `/drill-sheets/${id}/revisions`),
    revision: (id, version) => apiRequest('GET', `/drill-sheets/${id}/revisions/${version}`),
    approve: (id, version) => apiRequest('POST', `/drill-sheets/${id}/revisions/${version}/approve`)
}
