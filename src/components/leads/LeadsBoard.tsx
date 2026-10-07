import { useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { leadFitScore, type LeadStatus } from '../../../shared/api/leads'
import { useLeads } from '../../hooks/useLeads'
import { leadsToCsv } from '../../utils/LeadsCsv'
import { LeadDialog } from './LeadDialog'
import { LeadsTable } from './LeadsTable'
import { LEAD_STATUSES, leadLabel } from './leadLabels'

interface LeadsBoardProps {
    searchTerm: string
}

type Sort = 'fit' | 'newest'

/** Statuses still being worked; the default view hides the closed ones. */
const OPEN: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO']

const download = (name: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: name })
    link.click()
    URL.revokeObjectURL(url)
}

/** The leads list: filter by status, sort by fit or date, search, export, and open one to work it. */
export const LeadsBoard = ({ searchTerm }: LeadsBoardProps) => {
    const { leads, loading, error, refresh, setStatus, remove, noteAdded } = useLeads()
    const [filter, setFilter] = useState<'OPEN' | 'ALL' | LeadStatus>('OPEN')
    const [sort, setSort] = useState<Sort>('fit')
    const [openId, setOpenId] = useState<string | null>(null)

    const counts = useMemo(() => {
        const byStatus = new Map<string, number>()
        for (const lead of leads) byStatus.set(lead.status, (byStatus.get(lead.status) ?? 0) + 1)
        return byStatus
    }, [leads])

    const shown = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return leads
            .filter(lead => filter === 'ALL' || (filter === 'OPEN' ? OPEN.includes(lead.status) : lead.status === filter))
            .filter(lead => !term || [lead.shopName, lead.firstName, lead.lastName, lead.email, lead.city, lead.region]
                .some(value => value?.toLowerCase().includes(term)))
            .sort((a, b) => (sort === 'fit' ? leadFitScore(b) - leadFitScore(a) : 0) || b.createdAt.localeCompare(a.createdAt))
    }, [leads, filter, sort, searchTerm])

    const chip = (key: typeof filter, text: string, count: number) => (
        <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
            className={cn('min-h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                filter === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
            {text} <span className={filter === key ? 'opacity-80' : 'text-gray-500'}>{count}</span>
        </button>
    )

    const openLead = leads.find(lead => lead.id === openId)

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {chip('OPEN', 'Open', leads.filter(lead => OPEN.includes(lead.status)).length)}
                {LEAD_STATUSES.map(status => chip(status, leadLabel('status', status), counts.get(status) ?? 0))}
                {chip('ALL', 'All', leads.length)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={sort} onValueChange={value => setSort(value as Sort)}>
                    <SelectTrigger className="w-44" aria-label="Sort leads"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fit">Best fit first</SelectItem>
                        <SelectItem value="newest">Newest first</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">{shown.length} shown</span>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                        <RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : undefined} /> Refresh
                    </Button>
                    <Button variant="outline" disabled={shown.length === 0}
                        onClick={() => download(`drilld-leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(shown))}>
                        <Download data-icon="inline-start" /> Export CSV
                    </Button>
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {loading && leads.length === 0 ? (
                <p className="py-12 text-center text-gray-500">Loading leads…</p>
            ) : shown.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-white py-12 text-center text-gray-500">
                    {leads.length === 0 ? 'No signups yet. They\'ll show up here from the drilld.io early access form.' : 'No leads match.'}
                </p>
            ) : (
                <LeadsTable leads={shown} onOpen={setOpenId} />
            )}

            {openLead && (
                <LeadDialog lead={openLead} onClose={() => setOpenId(null)}
                    onStatusChange={status => setStatus(openLead.id, status)}
                    onNoteAdded={() => noteAdded(openLead.id)}
                    onDelete={async () => { await remove(openLead.id); setOpenId(null) }} />
            )}
        </div>
    )
}
