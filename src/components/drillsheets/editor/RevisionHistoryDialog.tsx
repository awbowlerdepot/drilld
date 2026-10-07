import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { DrillSheetRevisionSummaryDto } from '../../../../shared/api/drillSheets'
import { useLocations } from '../../../hooks/useLocations'
import { useRevisionHistory } from '../../../hooks/useRevisionHistory'
import type { SpecChange } from '../../../utils/DrillSheetChanges'

interface RevisionHistoryDialogProps {
    sheetId: string
    sheetName: string
    onClose: () => void
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const status = (revision: DrillSheetRevisionSummaryDto) =>
    revision.discarded ? { label: 'Discarded', className: 'bg-gray-100 text-gray-600' }
        : revision.drilled ? { label: 'Drilled', className: 'bg-slate-200 text-slate-800' }
            : revision.approvedAt ? { label: 'Approved', className: 'bg-green-100 text-green-800' }
                : { label: 'Draft', className: 'bg-amber-100 text-amber-900' }

/**
 * A drill sheet's revisions, newest first: who created each, who last saved
 * it, who approved it and when, and what changed from the revision it
 * started from.
 */
export const RevisionHistoryDialog = ({ sheetId, sheetName, onClose }: RevisionHistoryDialogProps) => {
    const history = useRevisionHistory(sheetId)
    const { locations } = useLocations()
    const [open, setOpen] = useState<number | null>(null)
    const [changes, setChanges] = useState<Map<number, { base: number; changes: SpecChange[] } | null | 'loading' | Error>>(new Map())

    const toggle = async (version: number) => {
        if (open === version) {
            setOpen(null)
            return
        }
        setOpen(version)
        if (changes.has(version)) return
        setChanges(prev => new Map(prev).set(version, 'loading'))
        try {
            const result = await history.changesIn(version)
            setChanges(prev => new Map(prev).set(version, result))
        } catch (err) {
            setChanges(prev => new Map(prev).set(version, err as Error))
        }
    }

    return (
        <Dialog open onOpenChange={value => { if (!value) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>History · {sheetName}</DialogTitle>
                    <DialogDescription>Each revision, who made and approved it, and what changed.</DialogDescription>
                </DialogHeader>

                {history.loading && <p className="py-6 text-center text-gray-500">Loading revisions…</p>}
                {history.error && <p role="alert" className="text-sm text-red-700">{history.error}</p>}

                <ol className="space-y-2">
                    {history.revisions.map(revision => {
                        const badge = status(revision)
                        const location = locations.find(l => l.id === revision.locationID)?.name
                        // Approving also touches updatedAt, so the save time is only shown for drafts.
                        const savedBySomeoneElse = revision.updatedByUserID && revision.updatedByUserID !== revision.createdByUserID
                        const saved = revision.approvedAt ? savedBySomeoneElse : revision.updatedAt !== revision.createdAt
                        const detail = changes.get(revision.version)
                        const isOpen = open === revision.version
                        return (
                            <li key={revision.id} className={cn('rounded-lg border', revision.isCurrent ? 'border-primary' : 'border-border', revision.discarded && 'opacity-70')}>
                                <button type="button" aria-expanded={isOpen} onClick={() => toggle(revision.version)}
                                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
                                    <span className="min-w-0 flex-1 space-y-0.5">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold">Revision {revision.version}</span>
                                            <Badge className={badge.className}>{badge.label}</Badge>
                                            {revision.isCurrent && <Badge variant="outline">Current</Badge>}
                                            {location && <span className="text-xs text-gray-500">{location}</span>}
                                        </span>
                                        <span className="block text-sm text-gray-600">
                                            Created by {revision.createdByName ?? 'unknown'} · {when(revision.createdAt)}
                                        </span>
                                        {saved && (
                                            <span className="block text-sm text-gray-600">
                                                Last saved by {revision.updatedByName ?? revision.createdByName ?? 'unknown'}{revision.approvedAt ? '' : ` · ${when(revision.updatedAt)}`}
                                            </span>
                                        )}
                                        {revision.approvedAt && (
                                            <span className="block text-sm text-green-800">
                                                Approved by {revision.approvedByName ?? 'unknown'} · {when(revision.approvedAt)}
                                            </span>
                                        )}
                                        {revision.revisionNotes && <span className="block text-sm italic text-gray-600">“{revision.revisionNotes}”</span>}
                                    </span>
                                    <ChevronDown className={cn('mt-1 size-4 shrink-0 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
                                </button>

                                {isOpen && (
                                    <div className="border-t border-border px-3 py-3 text-sm">
                                        {detail === 'loading' || detail === undefined ? (
                                            <p className="text-gray-500">Comparing…</p>
                                        ) : detail instanceof Error ? (
                                            <p className="text-red-700">{detail.message}</p>
                                        ) : detail === null ? (
                                            <p className="text-gray-500">The first revision: nothing to compare with.</p>
                                        ) : detail.changes.length === 0 ? (
                                            <p className="text-gray-500">No changes from revision {detail.base}.</p>
                                        ) : (
                                            <>
                                                <p className="mb-2 text-gray-500">Changes from revision {detail.base}:</p>
                                                <table className="w-full border-collapse">
                                                    <tbody>
                                                        {detail.changes.map(change => (
                                                            <tr key={`${change.group}/${change.label}`} className="border-t border-gray-100 align-top">
                                                                <th scope="row" className="py-1.5 pr-3 text-left font-medium text-gray-700">
                                                                    {change.group !== change.label && <span className="block text-xs font-normal text-gray-500">{change.group}</span>}
                                                                    {change.label}
                                                                </th>
                                                                <td className="py-1.5 font-mono text-gray-500 line-through decoration-gray-300">{change.before}</td>
                                                                <td className="px-2 py-1.5 text-gray-400">→</td>
                                                                <td className="py-1.5 font-mono font-semibold text-primary">{change.after}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </DialogContent>
        </Dialog>
    )
}
