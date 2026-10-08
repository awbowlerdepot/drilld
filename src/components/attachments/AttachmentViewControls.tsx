import { ExternalLink, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AttachmentRotation, ViewableFile } from '../../../shared/api/attachments'

interface AttachmentViewControlsProps {
    attachment: ViewableFile
    zoom: number
    onZoom: (zoom: number) => void
    /** Saves the new rotation; absent when the viewer can't change files. */
    onRotate?: (rotation: AttachmentRotation) => void
}

const ZOOMS = [1, 1.5, 2, 3]

/** Turn (saved, so it opens upright next time), zoom, and open in a new tab. */
export const AttachmentViewControls = ({ attachment, zoom, onZoom, onRotate }: AttachmentViewControlsProps) => {
    const isImage = attachment.contentType !== 'application/pdf'
    const turn = (by: number) => onRotate?.(((attachment.rotation + by + 360) % 360) as AttachmentRotation)
    const index = ZOOMS.indexOf(zoom)

    return (
        <div className="flex flex-wrap items-center gap-1">
            {isImage && onRotate && (
                <>
                    <Button type="button" variant="ghost" size="icon" aria-label="Turn left" onClick={() => turn(-90)}><RotateCcw /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Turn right" onClick={() => turn(90)}><RotateCw /></Button>
                </>
            )}
            {isImage && (
                <>
                    <Button type="button" variant="ghost" size="icon" aria-label="Zoom out" disabled={index <= 0} onClick={() => onZoom(ZOOMS[index - 1])}><ZoomOut /></Button>
                    <span className="w-11 text-center font-mono text-xs text-gray-600">{Math.round(zoom * 100)}%</span>
                    <Button type="button" variant="ghost" size="icon" aria-label="Zoom in" disabled={index >= ZOOMS.length - 1} onClick={() => onZoom(ZOOMS[index + 1])}><ZoomIn /></Button>
                </>
            )}
            <Button type="button" variant="ghost" size="icon" aria-label="Open in a new tab" asChild>
                <a href={attachment.viewUrl} target="_blank" rel="noreferrer"><ExternalLink /></a>
            </Button>
        </div>
    )
}
