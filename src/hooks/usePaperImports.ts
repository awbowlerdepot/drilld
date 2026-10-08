import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaperImportAccept, PaperImportDto, PaperImportResultDto } from '../../shared/api/paperImports'
import { mockPaperReading } from '../data/mockPaperReading'
import { apiEnabled } from '../services/config'
import { paperImportsService } from '../services/paperImportsService'
import { shrinkImage } from '../utils/ImageResize'
import { addMockAttachment, attachmentProblem, type PendingUpload } from './useCustomerAttachments'
import { drillSheetsApi } from './useCustomerDrillSheets'

/** How often to check on pages being read. */
const POLL_MS = 4000

// Without sign-in there's no AI: a made-up reading arrives after a moment.
const mockImports: PaperImportDto[] = []

/**
 * Paper drill sheet imports: upload pages (one or many), wait for each to be
 * read, then import or discard it. Pages being read are checked every few
 * seconds. Without sign-in, uploads get a made-up reading.
 */
export const usePaperImports = (locationID: string | null) => {
    const [imports, setImports] = useState<PaperImportDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploads, setUploads] = useState<PendingUpload[]>([])
    const reading = useRef(false)

    const reload = useCallback(async () => {
        try {
            setImports(apiEnabled ? await paperImportsService.list() : [...mockImports])
            setError(null)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void reload() }, [reload])

    // Check back while anything is being read.
    reading.current = imports.some(i => i.status === 'READING')
    useEffect(() => {
        const timer = setInterval(() => { if (reading.current) void reload() }, POLL_MS)
        return () => clearInterval(timer)
    }, [reload])

    const replace = (updated: PaperImportDto) =>
        setImports(prev => [updated, ...prev.filter(i => i.id !== updated.id)])

    const setUpload = (key: string, change: Partial<PendingUpload> | null) =>
        setUploads(prev => change === null ? prev.filter(u => u.key !== key) : prev.map(u => (u.key === key ? { ...u, ...change } : u)))

    /** Uploads pages one after another; each starts being read as soon as it's up. Resolves to the new imports. */
    const upload = useCallback(async (files: File[]) => {
        const queued = files.map(file => ({ file, key: crypto.randomUUID(), problem: attachmentProblem(file) }))
        setUploads(prev => [...prev, ...queued.map(q => ({ key: q.key, fileName: q.file.name, progress: 0, error: q.problem ?? undefined }))])
        const added: PaperImportDto[] = []
        for (const { file, key, problem } of queued) {
            if (problem) continue
            try {
                const small = await shrinkImage(file)
                const created = apiEnabled
                    ? await paperImportsService.upload(small, locationID, progress => setUpload(key, { progress }))
                    : mockUpload(small, locationID, updated => setImports(prev => prev.map(i => (i.id === updated.id ? updated : i))))
                replace(created)
                added.push(created)
                setUpload(key, null)
            } catch (err) {
                setUpload(key, { error: `${file.name}: ${(err as Error).message}` })
            }
        }
        return added
    }, [locationID])

    const dismissUpload = (key: string) => setUpload(key, null)

    const retry = useCallback(async (id: string) => {
        if (apiEnabled) replace(await paperImportsService.retry(id))
    }, [])

    const discard = useCallback(async (id: string) => {
        if (apiEnabled) await paperImportsService.discard(id)
        else mockImports.splice(mockImports.findIndex(i => i.id === id), 1)
        setImports(prev => prev.filter(i => i.id !== id))
    }, [])

    /** Imports a reviewed page; resolves to the customer and drill sheet it created. */
    const accept = useCallback(async (paperImport: PaperImportDto, input: PaperImportAccept): Promise<PaperImportResultDto> => {
        const result = apiEnabled ? await paperImportsService.accept(paperImport.id, input) : await mockAccept(paperImport, input)
        if (!apiEnabled) mockImports.splice(mockImports.findIndex(i => i.id === paperImport.id), 1)
        setImports(prev => prev.filter(i => i.id !== paperImport.id))
        return result
    }, [])

    return { imports, loading, error, uploads, upload, dismissUpload, retry, discard, accept, reload }
}

const mockUpload = (file: File, locationID: string | null, onRead: (updated: PaperImportDto) => void): PaperImportDto => {
    const created: PaperImportDto = {
        id: crypto.randomUUID(),
        fileName: file.name,
        contentType: file.type as PaperImportDto['contentType'],
        status: 'READING',
        reading: null,
        template: null,
        error: null,
        readAt: null,
        locationID,
        suggestedSpanType: null,
        customerID: null,
        drillSheetID: null,
        createdByName: 'You',
        createdAt: new Date().toISOString(),
        viewUrl: URL.createObjectURL(file)
    }
    mockImports.unshift(created)
    setTimeout(() => {
        const read = { ...created, status: 'READ' as const, reading: mockPaperReading, template: mockPaperReading.template.brand, readAt: new Date().toISOString() }
        mockImports.splice(mockImports.findIndex(i => i.id === created.id), 1, read)
        onRead(read)
    }, 1500)
    return created
}

/** Without sign-in: the new customer is the caller's to add (it's returned with an id from the input). */
const mockAccept = async (paperImport: PaperImportDto, input: PaperImportAccept): Promise<PaperImportResultDto> => {
    const customerID = 'id' in input.customer ? input.customer.id : `paper-${paperImport.id}`
    const sheet = await drillSheetsApi.create(customerID, {
        name: input.sheetName, gripStyle: input.gripStyle, spec: input.spec,
        revisionNotes: 'Imported from a paper drill sheet'
    })
    const now = new Date().toISOString()
    addMockAttachment({
        id: crypto.randomUUID(), customerID, fileName: paperImport.fileName, contentType: paperImport.contentType, sizeBytes: 1,
        kind: 'DRILL_SHEET', label: 'Paper sheet (imported)', rotation: 0, createdByUserID: 'mock-user', createdByName: 'You',
        createdAt: now, updatedAt: now, viewUrl: paperImport.viewUrl
    })
    return { customerID, drillSheetID: sheet.id }
}
