import { LEAD_OPTIONS, type LeadStatus } from '../../../shared/api/leads'

/** The label for a lead's answer, or a dash when they skipped it. */
export const leadLabel = <K extends keyof typeof LEAD_OPTIONS>(key: K, code: string | null | undefined) =>
    code ? (LEAD_OPTIONS[key] as Record<string, string>)[code] ?? code : '—'

/** Status badge colors, in the order a lead moves through them. */
export const STATUS_STYLES: Record<LeadStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-amber-100 text-amber-900',
    QUALIFIED: 'bg-violet-100 text-violet-800',
    DEMO: 'bg-cyan-100 text-cyan-900',
    ONBOARDED: 'bg-green-100 text-green-800',
    NOT_A_FIT: 'bg-gray-100 text-gray-600',
    SPAM: 'bg-red-100 text-red-800'
}

export const LEAD_STATUSES = Object.keys(LEAD_OPTIONS.status) as LeadStatus[]

export const formatLeadDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
