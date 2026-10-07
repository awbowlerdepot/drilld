import { useState, type ReactNode } from 'react'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { leadFitScore, type LeadDto, type LeadStatus } from '../../../shared/api/leads'
import { LeadNotes } from './LeadNotes'
import { LEAD_STATUSES, formatLeadDate, leadLabel } from './leadLabels'

interface LeadDialogProps {
    lead: LeadDto
    onClose: () => void
    onStatusChange: (status: LeadStatus) => Promise<void>
    onNoteAdded: () => void
    onDelete: () => Promise<void>
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1 text-sm">
        <dt className="text-gray-500">{label}</dt>
        <dd className="text-gray-900">{children}</dd>
    </div>
)

/** One lead: everything they told us, its status, and the notes on working it. */
export const LeadDialog = ({ lead, onClose, onStatusChange, onNoteAdded, onDelete }: LeadDialogProps) => {
    const [error, setError] = useState<string | null>(null)
    const place = [lead.city, lead.region, lead.country].filter(Boolean).join(', ')
    const source = Object.entries(lead.source)

    const changeStatus = async (status: LeadStatus) => {
        setError(null)
        try {
            await onStatusChange(status)
        } catch (err) {
            setError((err as Error).message)
        }
    }

    const confirmDelete = async () => {
        if (!window.confirm(`Delete ${lead.shopName}'s signup? Use this for spam and tests. Real leads that aren't a fit should be marked "Not a fit" instead.`)) return
        try {
            await onDelete()
        } catch (err) {
            setError((err as Error).message)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{lead.shopName}</DialogTitle>
                    <DialogDescription>
                        {lead.firstName} {lead.lastName} · {leadLabel('role', lead.role)} · signed up {formatLeadDate(lead.createdAt)} · fit {leadFitScore(lead)}/100
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={lead.status} onValueChange={value => void changeStatus(value as LeadStatus)}>
                        <SelectTrigger className="w-44" aria-label="Status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {LEAD_STATUSES.map(status => <SelectItem key={status} value={status}>{leadLabel('status', status)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" asChild>
                        <a href={`mailto:${lead.email}?subject=${encodeURIComponent('Drilld early access')}`}><Mail data-icon="inline-start" /> Email</a>
                    </Button>
                    {lead.phone && (
                        <Button variant="outline" asChild>
                            <a href={`tel:${lead.phone}`}><Phone data-icon="inline-start" /> {lead.phone}</a>
                        </Button>
                    )}
                </div>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

                <div className="grid gap-x-6 sm:grid-cols-2">
                    <dl>
                        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Shop</h3>
                        <Row label="Email">{lead.email}</Row>
                        <Row label="Where">{place || '—'}</Row>
                        <Row label="Locations">{leadLabel('locationCount', lead.locationCount)}</Row>
                        <Row label="Shop type">{leadLabel('shopType', lead.shopType)}</Row>
                        <Row label="Balls per month">{leadLabel('ballsPerMonth', lead.ballsPerMonth)}</Row>
                        <Row label="Drillers">{leadLabel('drillerCount', lead.drillerCount)}</Row>
                        <Row label="Drill press">{leadLabel('drillPress', lead.drillPress)}</Row>
                    </dl>
                    <dl>
                        <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:mt-0">How they work today</h3>
                        <Row label="Drill sheets on">
                            {leadLabel('currentTools', lead.currentTools)}{lead.currentSoftware ? ` (${lead.currentSoftware})` : ''}
                        </Row>
                        <Row label="Grips">{lead.grips.map(grip => leadLabel('grips', grip)).join(', ') || '—'}</Row>
                        <Row label="Wants to start">{leadLabel('timeline', lead.timeline)}</Row>
                        <Row label="Heard from">{lead.heardFrom ?? '—'}</Row>
                        <Row label="Email updates">{lead.marketingConsent ? 'Yes' : 'No'}</Row>
                        {source.length > 0 && <Row label="Came from">{source.map(([key, value]) => `${key}: ${value}`).join(' · ')}</Row>}
                    </dl>
                </div>

                {lead.painPoint && (
                    <blockquote className="rounded-lg bg-gray-50 px-4 py-3 text-sm italic text-gray-700">“{lead.painPoint}”</blockquote>
                )}

                <LeadNotes leadId={lead.id} onAdded={onNoteAdded} />

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => void confirmDelete()}>Delete</Button>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
