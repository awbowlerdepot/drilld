import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { LEAD_OPTIONS, leadFitScore, type LeadDto } from '../../shared/api/leads';

const ses = new SESv2Client({});

type LeadSummary = Omit<LeadDto, 'createdAt' | 'updatedAt' | 'status' | 'companyID' | 'noteCount'>;

const label = <K extends keyof typeof LEAD_OPTIONS>(key: K, code: string | null) =>
    code ? (LEAD_OPTIONS[key] as Record<string, string>)[code] ?? code : '—';

/** One line, so a signup can't add headers to the subject. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').slice(0, 120);

/**
 * Emails a new signup to LEAD_NOTIFY_TO (plain text: everything in it was
 * typed by the public). Not configured, it does nothing. A failure is logged,
 * never passed on: the lead is already saved.
 */
export const notifyNewLead = async (lead: LeadSummary) => {
    const to = process.env.LEAD_NOTIFY_TO;
    const from = process.env.LEAD_NOTIFY_FROM;
    if (!to || !from) return;

    const place = [lead.city, lead.region, lead.country].filter(Boolean).join(', ');
    const subject = oneLine(`New Drilld signup: ${lead.shopName} · ${label('ballsPerMonth', lead.ballsPerMonth)} balls/mo · ` +
        `${label('locationCount', lead.locationCount)} location(s)`);
    const body = [
        `${lead.firstName} ${lead.lastName} (${label('role', lead.role)}) signed up for early access.`,
        `Fit score: ${leadFitScore(lead)}/100`,
        '',
        `Email:            ${lead.email}`,
        `Phone:            ${lead.phone ?? '—'}`,
        `Shop:             ${lead.shopName}${place ? ` · ${place}` : ''}`,
        `Locations:        ${label('locationCount', lead.locationCount)}`,
        `Shop type:        ${label('shopType', lead.shopType)}`,
        `Balls per month:  ${label('ballsPerMonth', lead.ballsPerMonth)}`,
        `Drillers:         ${label('drillerCount', lead.drillerCount)}`,
        `Drill press:      ${label('drillPress', lead.drillPress)}`,
        `Drill sheets on:  ${label('currentTools', lead.currentTools)}${lead.currentSoftware ? ` (${lead.currentSoftware})` : ''}`,
        `Grips:            ${lead.grips.map(grip => label('grips', grip)).join(', ') || '—'}`,
        `Wants to start:   ${label('timeline', lead.timeline)}`,
        `Heard from:       ${lead.heardFrom ?? '—'}`,
        `Email updates:    ${lead.marketingConsent ? 'Yes' : 'No'}`,
        '',
        `Biggest headache:`,
        lead.painPoint ?? '—',
        '',
        `Work this lead in Drilld: ${process.env.APP_URL ?? 'https://app.drilld.io'} (Leads)`
    ].join('\n');

    try {
        await ses.send(new SendEmailCommand({
            FromEmailAddress: from,
            Destination: { ToAddresses: to.split(',').map(address => address.trim()) },
            ReplyToAddresses: [lead.email],
            Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } }
        }));
    } catch (error) {
        console.error('Lead notification email failed', error);
    }
};
