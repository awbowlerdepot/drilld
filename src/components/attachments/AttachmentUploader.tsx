import { useRef, useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ATTACHMENT_CONTENT_TYPES } from '../../../shared/api/attachments'
import type { PendingUpload } from '../../hooks/useCustomerAttachments'

interface AttachmentUploaderProps {
    uploads: PendingUpload[]
    onFiles: (files: File[]) => void
    onDismiss: (key: string) => void
}

const ACCEPT = ATTACHMENT_CONTENT_TYPES.join(',')

/**
 * Add photos or PDFs: drop them here, pick them, or take a photo (phones and
 * tablets open the camera). Shows each upload's progress or why it failed.
 */
export const AttachmentUploader = ({ uploads, onFiles, onDismiss }: AttachmentUploaderProps) => {
    const pick = useRef<HTMLInputElement>(null)
    const camera = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

    const take = (list: FileList | null) => {
        if (list && list.length > 0) onFiles([...list])
    }

    return (
        <div className="grid gap-2">
            <div
                onDragOver={event => { event.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={event => { event.preventDefault(); setDragging(false); take(event.dataTransfer.files) }}
                className={cn('flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
                    dragging ? 'border-primary bg-blue-50' : 'border-border bg-white')}>
                <p className="text-sm text-gray-600">Drop photos or PDFs of their paper drill sheets here, or</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" variant="outline" onClick={() => pick.current?.click()}>
                        <Upload data-icon="inline-start" /> Choose files
                    </Button>
                    <Button type="button" variant="outline" onClick={() => camera.current?.click()}>
                        <Camera data-icon="inline-start" /> Take a photo
                    </Button>
                </div>
                <input ref={pick} type="file" accept={ACCEPT} multiple hidden
                    onChange={event => { take(event.target.files); event.target.value = '' }} />
                <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden
                    onChange={event => { take(event.target.files); event.target.value = '' }} />
            </div>

            {uploads.length > 0 && (
                <ul aria-label="Uploads" className="grid gap-1.5">
                    {uploads.map(upload => (
                        <li key={upload.key} className={cn('flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
                            upload.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-border bg-white')}>
                            <span className="min-w-0 flex-1 truncate">{upload.error ?? upload.fileName}</span>
                            {upload.error ? (
                                <button type="button" aria-label="Dismiss" onClick={() => onDismiss(upload.key)} className="text-red-700 hover:text-red-900">
                                    <X className="size-4" />
                                </button>
                            ) : (
                                <span className="flex w-32 items-center gap-2">
                                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                        <span className="block h-full bg-primary transition-[width]" style={{ width: `${Math.round(upload.progress * 100)}%` }} />
                                    </span>
                                    <span className="w-9 text-right font-mono text-xs text-gray-500">{Math.round(upload.progress * 100)}%</span>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
