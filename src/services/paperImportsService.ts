import type {
    PaperImportAccept,
    PaperImportCreate,
    PaperImportDto,
    PaperImportResultDto,
    PaperImportUploadDto
} from '../../shared/api/paperImports'
import { apiRequest } from './apiClient'
import { putFile } from './uploads'

export const paperImportsService = {
    list: () => apiRequest<PaperImportDto[]>('GET', '/paper-imports'),
    get: (id: string) => apiRequest<PaperImportDto>('GET', `/paper-imports/${id}`),

    /** Records the page, uploads it straight to storage, then confirms it (which starts the reading). */
    upload: async (file: File, locationID: string | null, onProgress?: (fraction: number) => void) => {
        const request: PaperImportCreate = { fileName: file.name, contentType: file.type as PaperImportCreate['contentType'], sizeBytes: file.size, locationID }
        const { id, uploadUrl } = await apiRequest<PaperImportUploadDto>('POST', '/paper-imports', request)
        await putFile(uploadUrl, file, onProgress)
        return apiRequest<PaperImportDto>('POST', `/paper-imports/${id}/complete`)
    },

    retry: (id: string) => apiRequest<PaperImportDto>('POST', `/paper-imports/${id}/retry`),
    accept: (id: string, accept: PaperImportAccept) => apiRequest<PaperImportResultDto>('POST', `/paper-imports/${id}/import`, accept),
    discard: (id: string) => apiRequest<void>('DELETE', `/paper-imports/${id}`)
}
