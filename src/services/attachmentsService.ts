import type { AttachmentCreate, AttachmentDto, AttachmentUpdate, AttachmentUploadDto } from '../../shared/api/attachments'
import { apiRequest } from './apiClient'

/** PUTs the file to the signed URL, reporting progress (0–1). */
const putFile = (url: string, file: File, onProgress?: (fraction: number) => void) =>
    new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(event.loaded / event.total) }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
        xhr.onerror = () => reject(new Error('Upload failed: check your connection and try again'))
        xhr.send(file)
    })

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
