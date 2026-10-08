import type { AttachmentCreate, AttachmentDto, AttachmentUpdate, AttachmentUploadDto } from '../../shared/api/attachments'
import { apiRequest } from './apiClient'
import { putFile } from './uploads'

export const attachmentsService = {
    list: (customerId: string) => apiRequest<AttachmentDto[]>('GET', `/customers/${customerId}/attachments`),

    /** Records the file, uploads it straight to storage, then confirms it. */
    upload: async (customerId: string, file: File, kind: AttachmentCreate['kind'], onProgress?: (fraction: number) => void) => {
        const request: AttachmentCreate = { fileName: file.name, contentType: file.type as AttachmentCreate['contentType'], sizeBytes: file.size, kind }
        const { id, uploadUrl } = await apiRequest<AttachmentUploadDto>('POST', `/customers/${customerId}/attachments`, request)
        await putFile(uploadUrl, file, onProgress)
        return apiRequest<AttachmentDto>('POST', `/attachments/${id}/complete`)
    },

    update: (id: string, changes: AttachmentUpdate) => apiRequest<AttachmentDto>('PATCH', `/attachments/${id}`, changes),
    remove: (id: string) => apiRequest<void>('DELETE', `/attachments/${id}`)
}
