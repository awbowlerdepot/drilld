import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AttachmentDto, AttachmentKind, AttachmentUpdate } from '../../../shared/api/attachments'
import { AttachmentPreview } from './AttachmentPreview'
import { AttachmentViewControls } from './AttachmentViewControls'

interface AttachmentViewerDialogProps {
    attachment: AttachmentDto
    canEdit: boolean
    onUpdate: (changes: AttachmentUpdate) => Promise<void>
    onDelete: () => Promise<void>
    onExpired: () => void
    onClose: () => void
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** One file, large: turn and zoom it, name it, mark whether it's a drill sheet, or remove it. */
export const AttachmentViewerDialog = ({ attachment, canEdit, onUpdate, onDelete, onExpired, onClose }: AttachmentViewerDialogProps) => {
    const [zoom, setZoom] = useState(1)
    const [label, setLabel] = useState(attachment.label ?? '')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const run = async (work: () => Promise<void>) => {
        setError(null)
        try {
            await work()
        } catch (err) {
            setError((err as Error).message)
        }
    }

    const saveLabel = () => {
        if ((label.trim() || null) !== attachment.label) void run(() => onUpdate({ label: label.trim() || null }))
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="flex max-h-[95vh] flex-col gap-3 sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="truncate pr-6">{attachment.label ?? attachment.fileName}</DialogTitle>
                    <DialogDescription>
                        Added {when(attachment.createdAt)}{attachment.createdByName ? ` by ${attachment.createdByName}` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <AttachmentViewControls attachment={attachment} zoom={zoom} onZoom={setZoom}
                        onRotate={canEdit ? rotation => void run(() => onUpdate({ rotation })) : undefined} />
                    {canEdit && (
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Input aria-label="Name" placeholder={attachment.fileName} value={label} className="h-9 w-48"
                                onChange={event => setLabel(event.target.value)} onBlur={saveLabel}
                                onKeyDown={event => { if (event.key === 'Enter') saveLabel() }} />
                            <Select value={attachment.kind} onValueChange={kind => void run(() => onUpdate({ kind: kind as AttachmentKind }))}>
                                <SelectTrigger aria-label="Kind" className="h-9 w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRILL_SHEET">Drill sheet</SelectItem>
                                    <SelectItem value="OTHER">Other file</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <AttachmentPreview attachment={attachment} zoom={zoom} onError={onExpired} className="min-h-0 flex-1" />

                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                {canEdit && (
                    <div className="flex items-center justify-end gap-2">
                        {confirmDelete ? (
                            <>
                                <span className="text-sm text-gray-600">Remove this file for good?</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Keep it</Button>
                                <Button type="button" variant="destructive" size="sm" onClick={() => void run(async () => { await onDelete(); onClose() })}>Remove</Button>
                            </>
                        ) : (
                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>Remove file</Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
