import { useCallback, useEffect, useRef, useState } from 'react'
import {
    ATTACHMENT_CONTENT_TYPES,
    ATTACHMENT_MAX_BYTES,
    type AttachmentDto,
    type AttachmentKind,
    type AttachmentUpdate
} from '../../shared/api/attachments'
import { apiEnabled } from '../services/config'
import { attachmentsService } from '../services/attachmentsService'

/** A file being uploaded: progress 0–1, or the error that stopped it. */
export interface PendingUpload {
    key: string
    fileName: string
    progress: number
    error?: string
}

/** View URLs last about 15 minutes; reload a little before that. */
const STALE_MS = 10 * 60 * 1000

// Without sign-in, files live in memory for the session (object URLs).
const mockFiles = new Map<string, AttachmentDto[]>()

/** Without sign-in: puts a file on a customer (paper import does this). */
export const addMockAttachment = (attachment: AttachmentDto) =>
    mockFiles.set(attachment.customerID, [attachment, ...(mockFiles.get(attachment.customerID) ?? [])])

/** Why a file can't be attached, or null if it can. */
export const attachmentProblem = (file: File): string | null => {
    if (!(ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(file.type)) {
        return `${file.name}: attach a photo (JPEG, PNG or WebP) or a PDF`
    }
    if (file.size > ATTACHMENT_MAX_BYTES) return `${file.name}: files can be up to 25 MB`
    return null
}

/**
 * A customer's files (paper drill sheet photos and scans). Uploads go
 * straight to storage with progress; view URLs are refreshed before they
 * expire. Without sign-in, files are kept in memory.
 */
export const useCustomerAttachments = (customerId: string) => {
    const [attachments, setAttachments] = useState<AttachmentDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploads, setUploads] = useState<PendingUpload[]>([])
    const loadedAt = useRef(0)

    const reload = useCallback(async () => {
        try {
            const list = apiEnabled ? await attachmentsService.list(customerId) : mockFiles.get(customerId) ?? []
            setAttachments(list)
            loadedAt.current = Date.now()
            setError(null)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }, [customerId])

    useEffect(() => { void reload() }, [reload])

    /** Call before showing files, so their view URLs haven't expired. */
    const refreshIfStale = useCallback(() => {
        if (apiEnabled && Date.now() - loadedAt.current > STALE_MS) void reload()
    }, [reload])

    const setUpload = (key: string, change: Partial<PendingUpload> | null) =>
        setUploads(prev => change === null ? prev.filter(u => u.key !== key) : prev.map(u => (u.key === key ? { ...u, ...change } : u)))

    /** Uploads files one after another; ones that can't be attached show an error instead. */
    const upload = useCallback(async (files: File[], kind: AttachmentKind = 'DRILL_SHEET') => {
        const queued = files.map(file => ({ file, key: crypto.randomUUID(), problem: attachmentProblem(file) }))
        setUploads(prev => [...prev, ...queued.map(q => ({ key: q.key, fileName: q.file.name, progress: 0, error: q.problem ?? undefined }))])
        for (const { file, key, problem } of queued) {
            if (problem) continue
            try {
                const added: AttachmentDto = apiEnabled
                    ? await attachmentsService.upload(customerId, file, kind, progress => setUpload(key, { progress }))
                    : mockAttachment(customerId, file, kind)
                if (!apiEnabled) mockFiles.set(customerId, [added, ...(mockFiles.get(customerId) ?? [])])
                setAttachments(prev => [added, ...prev])
                setUpload(key, null)
            } catch (err) {
                setUpload(key, { error: `${file.name}: ${(err as Error).message}` })
            }
        }
    }, [customerId])

    const dismissUpload = (key: string) => setUpload(key, null)

    const update = useCallback(async (id: string, changes: AttachmentUpdate) => {
        const current = attachments.find(a => a.id === id)
        const updated: AttachmentDto = apiEnabled
            ? await attachmentsService.update(id, changes)
            : { ...current!, ...changes, label: changes.label !== undefined ? changes.label || null : current!.label } as AttachmentDto
        if (!apiEnabled) mockFiles.set(customerId, (mockFiles.get(customerId) ?? []).map(a => (a.id === id ? updated : a)))
        setAttachments(prev => prev.map(a => (a.id === id ? updated : a)))
    }, [attachments, customerId])

    const remove = useCallback(async (id: string) => {
        if (apiEnabled) await attachmentsService.remove(id)
        else mockFiles.set(customerId, (mockFiles.get(customerId) ?? []).filter(a => a.id !== id))
        setAttachments(prev => prev.filter(a => a.id !== id))
    }, [customerId])

    return { attachments, loading, error, uploads, upload, dismissUpload, update, remove, reload, refreshIfStale }
}

const mockAttachment = (customerId: string, file: File, kind: AttachmentKind): AttachmentDto => {
    const now = new Date().toISOString()
    return {
        id: crypto.randomUUID(),
        customerID: customerId,
        fileName: file.name,
        contentType: file.type as AttachmentDto['contentType'],
        sizeBytes: file.size,
        kind,
        label: null,
        rotation: 0,
        createdByUserID: 'mock-user',
        createdByName: 'You',
        createdAt: now,
        updatedAt: now,
        viewUrl: URL.createObjectURL(file)
    }
}
