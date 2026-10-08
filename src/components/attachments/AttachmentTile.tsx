import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AttachmentDto } from '../../../shared/api/attachments'

interface AttachmentTileProps {
    attachment: AttachmentDto
    onOpen: () => void
}

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })

/** A thumbnail with its name, kind and when it was added. Tap to open it. */
export const AttachmentTile = ({ attachment, onOpen }: AttachmentTileProps) => (
    <button type="button" onClick={onOpen}
        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-ring">
        <span className="flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
            {attachment.contentType === 'application/pdf' ? (
                <FileText className="size-12 text-gray-400" aria-hidden="true" />
            ) : (
                <img src={attachment.viewUrl} alt="" loading="lazy" className="size-full object-contain"
                    style={{ transform: `rotate(${attachment.rotation}deg)` }} />
            )}
        </span>
        <span className="flex flex-col gap-1 p-2.5">
            <span className="truncate text-sm font-medium text-gray-900 group-hover:text-primary">{attachment.label ?? attachment.fileName}</span>
            <span className="flex items-center gap-2 text-xs text-gray-500">
                {attachment.kind === 'DRILL_SHEET' && <Badge variant="outline" className="font-normal">Drill sheet</Badge>}
                {when(attachment.createdAt)}
            </span>
        </span>
    </button>
)
