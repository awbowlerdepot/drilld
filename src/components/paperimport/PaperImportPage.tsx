import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaperImportAccept, PaperImportResultDto } from '../../../shared/api/paperImports'
import { usePaperImports } from '../../hooks/usePaperImports'
import type { Customer } from '../../types'
import { AttachmentUploader } from '../attachments/AttachmentUploader'
import { PaperImportList } from './PaperImportList'
import { PaperImportReview } from './PaperImportReview'

interface PaperImportPageProps {
    customers: Customer[]
    locationID: string | null
    /** A page was imported and the person wants to work on the drill sheet. */
    onOpenSheet: (result: PaperImportResultDto) => void
    /** A page was imported (add the customer to the list if new). */
    onImported: (result: PaperImportResultDto, input: PaperImportAccept) => Promise<void>
    onBack: () => void
}

/**
 * Importing paper drill sheets: upload one page or a whole binder's worth.
 * Each page is read by AI in the background; review them one at a time. One
 * page goes straight to its review; several wait in the list.
 */
export const PaperImportPage = ({ customers, locationID, onOpenSheet, onImported, onBack }: PaperImportPageProps) => {
    const pages = usePaperImports(locationID)
    const [openId, setOpenId] = useState<string | null>(null)
    const open = pages.imports.find(i => i.id === openId) ?? null
    const others = pages.imports.filter(i => i.id !== openId)
    const next = others.find(i => i.status === 'READ') ?? others[0] ?? null

    const upload = async (files: File[]) => {
        const added = await pages.upload(files)
        // One page: straight to its review.
        if (files.length === 1 && added.length === 1) setOpenId(added[0].id)
    }

    return (
        <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" onClick={open ? () => setOpenId(null) : onBack}>
                    <ArrowLeft data-icon="inline-start" /> {open ? 'All pages' : 'Customers'}
                </Button>
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">Import paper drill sheets</h2>
                    {!open && (
                        <p className="text-sm text-gray-600">
                            Photograph or scan the sheets. Each one is read for you; check it, and it becomes a customer with their drill sheet ready to finish.
                        </p>
                    )}
                </div>
            </div>

            {open ? (
                <PaperImportReview
                    key={`${open.id}-${open.readAt ?? open.status}`}
                    paperImport={open}
                    customers={customers}
                    locationID={locationID}
                    hasNext={next !== null}
                    onAccept={async (input, then) => {
                        const result = await pages.accept(open, input)
                        await onImported(result, input)
                        if (then === 'open') onOpenSheet(result)
                        else setOpenId(next?.id ?? null)
                    }}
                    onRetry={() => pages.retry(open.id)}
                    onDiscard={async () => { await pages.discard(open.id); setOpenId(null) }}
                    onExpired={() => void pages.reload()}
                />
            ) : (
                <>
                    <AttachmentUploader uploads={pages.uploads} onFiles={files => void upload(files)} onDismiss={pages.dismissUpload} />
                    {pages.error && <p role="alert" className="text-sm text-red-700">{pages.error}</p>}
                    {pages.loading ? (
                        <p className="py-6 text-center text-gray-500">Loading…</p>
                    ) : pages.imports.length > 0 && (
                        <section className="grid gap-2">
                            <h3 className="text-sm font-semibold text-gray-700">Waiting to import <span className="font-normal text-gray-500">{pages.imports.length}</span></h3>
                            <PaperImportList imports={pages.imports} onOpen={setOpenId} />
                        </section>
                    )}
                </>
            )}
        </div>
    )
}
