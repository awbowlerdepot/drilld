import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { useCustomerAttachments } from '../../../hooks/useCustomerAttachments'
import { AttachmentPreview } from '../../attachments/AttachmentPreview'
import { AttachmentUploader } from '../../attachments/AttachmentUploader'
import { AttachmentViewControls } from '../../attachments/AttachmentViewControls'

interface PaperSheetPanelProps {
    files: ReturnType<typeof useCustomerAttachments>
    onClose: () => void
}

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })

/**
 * The bowler's paper drill sheet beside the editor, to copy the measurements
 * across: beside the sheet on wide screens, over it on narrow ones. Paper
 * drill sheets come first; turning a photo is saved for next time.
 */
export const PaperSheetPanel = ({ files, onClose }: PaperSheetPanelProps) => {
    const ordered = [...files.attachments].sort((a, b) =>
        Number(b.kind === 'DRILL_SHEET') - Number(a.kind === 'DRILL_SHEET') || b.createdAt.localeCompare(a.createdAt))
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [error, setError] = useState<string | null>(null)
    const shown = ordered.find(a => a.id === selectedId) ?? ordered[0]

    return (
        <aside aria-label="Paper drill sheet"
            className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col gap-2 border-l border-border bg-white p-3 shadow-xl xl:sticky xl:top-4 xl:z-auto xl:h-[calc(100vh-2rem)] xl:w-[460px] xl:max-w-none xl:shrink-0 xl:rounded-xl xl:border xl:shadow-none">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Paper sheet</h2>
                {ordered.length > 1 && shown && (
                    <Select value={shown.id} onValueChange={id => { setSelectedId(id); setZoom(1) }}>
                        <SelectTrigger aria-label="File" className="h-8 min-w-0 flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ordered.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.label ?? a.fileName} · {when(a.createdAt)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <Button type="button" variant="ghost" size="icon" aria-label="Close paper sheet" className="ml-auto" onClick={onClose}><X /></Button>
            </div>

            {files.loading ? (
                <p className="py-6 text-center text-sm text-gray-500">Loading files…</p>
            ) : !shown ? (
                <div className="grid gap-3">
                    <p className="text-sm text-gray-600">Add a photo or scan of their paper drill sheet to see it here while you enter the measurements.</p>
                    <AttachmentUploader uploads={files.uploads} onFiles={list => void files.upload(list)} onDismiss={files.dismissUpload} />
                </div>
            ) : (
                <>
                    <AttachmentViewControls attachment={shown} zoom={zoom} onZoom={setZoom}
                        onRotate={rotation => { setError(null); files.update(shown.id, { rotation }).catch((err: Error) => setError(err.message)) }} />
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <AttachmentPreview attachment={shown} zoom={zoom} onError={() => void files.reload()} className="min-h-0 flex-1" />
                </>
            )}
        </aside>
    )
}
