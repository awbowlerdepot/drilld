import { LEAD_OPTIONS, leadFitScore, type LeadDto } from '../../shared/api/leads'

const label = <K extends keyof typeof LEAD_OPTIONS>(key: K, code: string | null) =>
    code ? (LEAD_OPTIONS[key] as Record<string, string>)[code] ?? code : ''

/** A CSV cell: quoted, with quotes doubled, and formula-looking text defused for spreadsheets. */
const cell = (value: string | number | boolean | null | undefined) => {
    const text = value == null ? '' : String(value)
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
}

const COLUMNS: [string, (lead: LeadDto) => string | number | boolean | null][] = [
    ['Signed up', lead => lead.createdAt],
    ['Status', lead => label('status', lead.status)],
    ['Fit', lead => leadFitScore(lead)],
    ['First name', lead => lead.firstName],
    ['Last name', lead => lead.lastName],
    ['Email', lead => lead.email],
    ['Phone', lead => lead.phone],
    ['Role', lead => label('role', lead.role)],
    ['Shop', lead => lead.shopName],
    ['City', lead => lead.city],
    ['State / region', lead => lead.region],
    ['Country', lead => lead.country],
    ['Locations', lead => label('locationCount', lead.locationCount)],
    ['Shop type', lead => label('shopType', lead.shopType)],
    ['Balls per month', lead => label('ballsPerMonth', lead.ballsPerMonth)],
    ['Drillers', lead => label('drillerCount', lead.drillerCount)],
    ['Drill press', lead => label('drillPress', lead.drillPress)],
    ['Drill sheets on', lead => label('currentTools', lead.currentTools)],
    ['Software', lead => lead.currentSoftware],
    ['Grips', lead => lead.grips.map(grip => label('grips', grip)).join(', ')],
    ['Wants to start', lead => label('timeline', lead.timeline)],
    ['Biggest headache', lead => lead.painPoint],
    ['Heard from', lead => lead.heardFrom],
    ['Email updates', lead => (lead.marketingConsent ? 'Yes' : 'No')],
    ['Notes', lead => lead.noteCount]
]

/** The leads as a CSV file, one row each, for a spreadsheet or mail merge. */
export const leadsToCsv = (leads: LeadDto[]) =>
    [COLUMNS.map(([name]) => cell(name)).join(','), ...leads.map(lead => COLUMNS.map(([, value]) => cell(value(lead))).join(','))].join('\r\n')
