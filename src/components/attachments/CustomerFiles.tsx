import { useState } from 'react'
import type { Customer } from '../../types'
import type { useCustomerAttachments } from '../../hooks/useCustomerAttachments'
import { AttachmentTile } from './AttachmentTile'
import { AttachmentUploader } from './AttachmentUploader'
import { AttachmentViewerDialog } from './AttachmentViewerDialog'

interface CustomerFilesProps {
    customer: Customer
    files: ReturnType<typeof useCustomerAttachments>
}

/**
 * The Files tab: photos and scans of the bowler's paper drill sheets (and any
 * other files), to keep with their profile and to copy from into a drill sheet.
 */
export const CustomerFiles = ({ customer, files }: CustomerFilesProps) => {
    const [openId, setOpenId] = useState<string | null>(null)
    const open = files.attachments.find(a => a.id === openId)
    const sheets = files.attachments.filter(a => a.kind === 'DRILL_SHEET')
    const others = files.attachments.filter(a => a.kind !== 'DRILL_SHEET')

    const grid = (title: string, list: typeof files.attachments) => list.length > 0 && (
        <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-gray-700">{title} <span className="font-normal text-gray-500">{list.length}</span></h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {list.map(attachment => (
                    <AttachmentTile key={attachment.id} attachment={attachment}
                        onOpen={() => { files.refreshIfStale(); setOpenId(attachment.id) }} />
                ))}
            </div>
        </section>
    )

    return (
        <div className="grid gap-5">
            <AttachmentUploader uploads={files.uploads} onFiles={list => void files.upload(list)} onDismiss={files.dismissUpload} />
            {files.error && <p role="alert" className="text-sm text-red-700">{files.error}</p>}
            {files.loading ? (
                <p className="py-6 text-center text-gray-500">Loading files…</p>
            ) : files.attachments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                    No files for {customer.firstName} yet. A photo of their paper drill sheet is a good start: open it next to the editor to copy the measurements.
                </p>
            ) : (
                <>
                    {grid('Paper drill sheets', sheets)}
                    {grid('Other files', others)}
                </>
            )}

            {open && (
                <AttachmentViewerDialog
                    attachment={open}
                    canEdit
                    onUpdate={changes => files.update(open.id, changes)}
                    onDelete={() => files.remove(open.id)}
                    onExpired={() => void files.reload()}
                    onClose={() => setOpenId(null)}
                />
            )}
        </div>
    )
}
