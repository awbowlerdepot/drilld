import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AttachmentDto } from '../../../shared/api/attachments'

interface AttachmentPreviewProps {
    attachment: AttachmentDto
    /** 1 fits the width; larger zooms in (scroll to pan). */
    zoom?: number
    className?: string
    /** The view URL failed (it may have expired). */
    onError?: () => void
}

/**
 * A file at a readable size: a photo turned by its saved rotation and
 * scaled to the panel's width times the zoom, or a PDF in the browser's viewer.
 */
export const AttachmentPreview = ({ attachment, zoom = 1, className, onError }: AttachmentPreviewProps) => {
    const box = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)

    useEffect(() => {
        const element = box.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    if (attachment.contentType === 'application/pdf') {
        return <iframe title={attachment.fileName} src={attachment.viewUrl} className={cn('h-full min-h-[60vh] w-full rounded-md border border-border bg-white', className)} />
    }

    // A quarter turn swaps the image's width and height on screen.
    const turned = attachment.rotation % 180 !== 0
    const visualWidth = Math.max(width * zoom, 1)
    const scale = natural ? visualWidth / (turned ? natural.h : natural.w) : 0
    const visualHeight = natural ? (turned ? natural.w : natural.h) * scale : 0

    return (
        <div ref={box} className={cn('overflow-auto rounded-md bg-gray-100', className)}>
            <div className="relative mx-auto" style={{ width: visualWidth, height: visualHeight || undefined }}>
                <img
                    src={attachment.viewUrl}
                    alt={attachment.label ?? attachment.fileName}
                    draggable={false}
                    onLoad={event => setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })}
                    onError={onError}
                    className={cn('absolute left-1/2 top-1/2 max-w-none select-none', !natural && 'invisible')}
                    style={natural ? {
                        width: natural.w * scale,
                        height: natural.h * scale,
                        transform: `translate(-50%, -50%) rotate(${attachment.rotation}deg)`
                    } : undefined}
                />
            </div>
        </div>
    )
}
