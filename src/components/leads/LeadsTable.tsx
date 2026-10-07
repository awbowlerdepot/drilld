import { MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { leadFitScore, type LeadDto } from '../../../shared/api/leads'
import { STATUS_STYLES, formatLeadDate, leadLabel } from './leadLabels'

interface LeadsTableProps {
    leads: LeadDto[]
    onOpen: (id: string) => void
}

/** Fit 70+ is strong, 45+ worth a call. */
const fitClass = (score: number) =>
    score >= 70 ? 'bg-green-100 text-green-800' : score >= 45 ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'

/** One row per lead: who, how big, how soon, and where it stands. Tap a row to open it. */
export const LeadsTable = ({ leads, onOpen }: LeadsTableProps) => (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                    <th scope="col" className="px-3 py-2.5">Shop</th>
                    <th scope="col" className="px-3 py-2.5">Contact</th>
                    <th scope="col" className="px-3 py-2.5">Balls / mo</th>
                    <th scope="col" className="px-3 py-2.5">Locations</th>
                    <th scope="col" className="px-3 py-2.5">Start</th>
                    <th scope="col" className="px-3 py-2.5">Fit</th>
                    <th scope="col" className="px-3 py-2.5">Status</th>
                    <th scope="col" className="px-3 py-2.5">Signed up</th>
                </tr>
            </thead>
            <tbody>
                {leads.map(lead => {
                    const score = leadFitScore(lead)
                    return (
                        <tr key={lead.id} onClick={() => onOpen(lead.id)} className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-blue-50/40">
                            <td className="px-3 py-2.5">
                                <button type="button" onClick={event => { event.stopPropagation(); onOpen(lead.id) }}
                                    className="text-left font-medium text-gray-900 hover:text-primary hover:underline">
                                    {lead.shopName}
                                </button>
                                <span className="block text-xs text-gray-500">{[lead.city, lead.region].filter(Boolean).join(', ') || lead.country}</span>
                            </td>
                            <td className="px-3 py-2.5">
                                {lead.firstName} {lead.lastName}
                                <span className="block text-xs text-gray-500">{leadLabel('role', lead.role)}</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono">{leadLabel('ballsPerMonth', lead.ballsPerMonth)}</td>
                            <td className="px-3 py-2.5 font-mono">{leadLabel('locationCount', lead.locationCount)}</td>
                            <td className="px-3 py-2.5">{leadLabel('timeline', lead.timeline)}</td>
                            <td className="px-3 py-2.5">
                                <span className={cn('rounded-full px-2 py-0.5 font-mono text-xs font-semibold', fitClass(score))}>{score}</span>
                            </td>
                            <td className="px-3 py-2.5">
                                <Badge className={STATUS_STYLES[lead.status]}>{leadLabel('status', lead.status)}</Badge>
                                {lead.noteCount > 0 && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500" title={`${lead.noteCount} notes`}>
                                        <MessageSquare className="size-3.5" aria-hidden="true" />{lead.noteCount}
                                    </span>
                                )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">{formatLeadDate(lead.createdAt)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
)
