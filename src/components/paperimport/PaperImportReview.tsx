import { useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AttachmentRotation } from '../../../shared/api/attachments'
import { customerCreateSchema } from '../../../shared/api/customers'
import type { PaperImportAccept, PaperImportDto, SpanTypeKey } from '../../../shared/api/paperImports'
import type { Customer } from '../../types'
import { EMPTY_READING, bowlerFromReading, proposeFromReading, templateName, type GripStyle, type Hand } from '../../utils/PaperSheetImport'
import { AttachmentPreview } from '../attachments/AttachmentPreview'
import { AttachmentViewControls } from '../attachments/AttachmentViewControls'
import { likelyMatches } from '../../utils/CustomerMatch'
import { BowlerMatch } from './BowlerMatch'
import { ImportValues } from './ImportValues'

interface PaperImportReviewProps {
    paperImport: PaperImportDto
    customers: Customer[]
    locationID: string | null
    /** Whether more pages are waiting after this one. */
    hasNext: boolean
    onAccept: (input: PaperImportAccept, then: 'open' | 'next') => Promise<void>
    onRetry: () => Promise<void>
    onDiscard: () => Promise<void>
    onExpired: () => void
}

const SPAN_TYPE_OPTIONS: { value: SpanTypeKey; label: string }[] = [
    { value: 'full32', label: 'Full (gripping edge to gripping edge)' },
    { value: 'fit32', label: 'Fit (finger center to thumb cut)' },
    { value: 'cutToCut32', label: 'Cut-to-cut (drilled edges)' },
    { value: 'outerToCut32', label: 'Outer-to-cut (thumb hardware)' },
    { value: 'centerToCenter32', label: 'Center to center' }
]
const GRIPS: { value: GripStyle; label: string }[] = [
    { value: 'FINGERTIP', label: 'Fingertip' },
    { value: 'CONVENTIONAL', label: 'Conventional' },
    { value: 'TWO_HANDED_NO_THUMB', label: 'Two-handed (no thumb)' }
]

/**
 * Review one page: the sheet beside what was read from it. Confirm the bowler
 * (an existing customer or a new one), hand, grip and which span type the
 * sheet's spans are, then import: the page goes on the customer's files and
 * the values become draft revision 1, to finish in the editor.
 */
export const PaperImportReview = ({ paperImport, customers, locationID, hasNext, onAccept, onRetry, onDiscard, onExpired }: PaperImportReviewProps) => {
    const reading = paperImport.reading ?? EMPTY_READING
    const bowler = useMemo(() => bowlerFromReading(reading), [reading])
    const template = templateName(paperImport.template)

    const [firstName, setFirstName] = useState(bowler.firstName)
    const [lastName, setLastName] = useState(bowler.lastName)
    const [phone, setPhone] = useState(bowler.phone)
    const [email, setEmail] = useState(bowler.email)
    const [hand, setHand] = useState<Hand | null>(bowler.hand)
    const [grip, setGrip] = useState<GripStyle>(bowler.grip)
    const [spanType, setSpanType] = useState<SpanTypeKey | null>(paperImport.suggestedSpanType)
    const [sheetName, setSheetName] = useState(template ? `${template} sheet` : 'Paper sheet')
    const [customerId, setCustomerId] = useState<string | null>(() => likelyMatches(customers, bowler.firstName, bowler.lastName)[0]?.id ?? null)
    const [rotation, setRotation] = useState<AttachmentRotation>(0)
    const [zoom, setZoom] = useState(1)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [busy, setBusy] = useState<'open' | 'next' | 'retry' | 'discard' | null>(null)
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    const existing = customers.find(c => c.id === customerId) ?? null
    const effectiveHand = existing?.dominantHand ?? hand
    const proposal = useMemo(() => effectiveHand ? proposeFromReading(reading, { hand: effectiveHand, spanType: spanType ?? 'full32' }) : null,
        [reading, effectiveHand, spanType])

    const run = async (action: NonNullable<typeof busy>, work: () => Promise<void>) => {
        setBusy(action)
        try {
            await work()
        } catch (err) {
            setErrors({ form: (err as Error).message })
        } finally {
            setBusy(null)
        }
    }

    const submit = (then: 'open' | 'next') => {
        const found: Record<string, string> = {}
        if (!spanType) found.spanType = 'Say which span the sheet records'
        if (!sheetName.trim()) found.sheetName = 'Name the drill sheet'
        let customer: PaperImportAccept['customer'] | null = existing ? { id: existing.id } : null
        if (!existing) {
            if (!hand) found.hand = 'Pick the bowler\'s hand'
            const parsed = customerCreateSchema.safeParse({
                firstName, lastName, phone, email, dominantHand: hand ?? 'RIGHT', preferredGripStyle: grip,
                usesThumb: grip !== 'TWO_HANDED_NO_THUMB', notes: null,
                // Mock locations (without sign-in) don't have real ids.
                homeLocationID: locationID && /^[0-9a-f-]{36}$/i.test(locationID) ? locationID : null
            })
            if (parsed.success) customer = { create: parsed.data }
            else for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= issue.message
        }
        // Anything not shown next to a field is shown with the buttons.
        const shown = ['firstName', 'lastName', 'phone', 'email', 'hand', 'spanType', 'sheetName']
        const other = Object.entries(found).filter(([key]) => !shown.includes(key))
        if (other.length > 0) found.form = other.map(([key, message]) => `${key}: ${message}`).join('; ')
        setErrors(found)
        if (Object.keys(found).length > 0 || !customer || !proposal || !spanType) return
        void run(then, () => onAccept({ customer, sheetName: sheetName.trim(), gripStyle: grip, spanType, spec: proposal.spec }, then))
    }

    const text = (id: string, label: string, value: string, set: (value: string) => void, props: React.ComponentProps<typeof Input> = {}) => (
        <Field data-invalid={!!errors[id]}>
            <FieldLabel htmlFor={`import-${id}`}>{label}</FieldLabel>
            <Input id={`import-${id}`} value={value} aria-invalid={!!errors[id]} autoComplete="off"
                onChange={event => { set(event.target.value); setErrors(prev => ({ ...prev, [id]: '' })) }} {...props} />
            {errors[id] && <FieldError>{errors[id]}</FieldError>}
        </Field>
    )

    const file = { ...paperImport, rotation, label: null }

    return (
        <div className="grid items-start gap-5 lg:grid-cols-2">
            <section aria-label="Paper sheet" className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
                <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{paperImport.fileName}</span>
                    {template && <Badge variant="outline">{template}</Badge>}
                </div>
                <AttachmentViewControls attachment={file} zoom={zoom} onZoom={setZoom} onRotate={setRotation} />
                <AttachmentPreview attachment={file} zoom={zoom} onError={onExpired} className="min-h-[50vh] flex-1" />
            </section>

            <section aria-label="Review" className="grid gap-5 rounded-xl border border-border bg-white p-4">
                {paperImport.status === 'READING' && (
                    <p role="status" className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Reading the sheet… this takes about half a minute.
                    </p>
                )}
                {paperImport.status === 'FAILED' && (
                    <div role="alert" className="grid gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                        <p>Couldn't read this sheet: {paperImport.error ?? 'unknown error'}. Try again, or fill in the bowler below and enter the measurements in the editor.</p>
                        <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={busy !== null} onClick={() => void run('retry', onRetry)}>
                            <RefreshCw data-icon="inline-start" /> {busy === 'retry' ? 'Starting…' : 'Read it again'}
                        </Button>
                    </div>
                )}

                <div className="grid gap-3">
                    <h2 className="text-base font-semibold">Bowler</h2>
                    <BowlerMatch firstName={firstName} lastName={lastName} customers={customers} selectedId={customerId} onSelect={setCustomerId} />
                    {!existing && (
                        <FieldGroup className="grid gap-3 sm:grid-cols-2">
                            {text('firstName', 'First name', firstName, setFirstName)}
                            {text('lastName', 'Last name', lastName, setLastName)}
                            {text('phone', 'Phone (optional)', phone, setPhone, { type: 'tel' })}
                            {text('email', 'Email (optional)', email, setEmail, { type: 'email' })}
                        </FieldGroup>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field data-invalid={!!errors.hand}>
                            <FieldLabel htmlFor="import-hand">Hand</FieldLabel>
                            <Select value={effectiveHand ?? ''} disabled={!!existing} onValueChange={value => { setHand(value as Hand); setErrors(prev => ({ ...prev, hand: '' })) }}>
                                <SelectTrigger id="import-hand"><SelectValue placeholder="Pick one" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RIGHT">Right-handed</SelectItem>
                                    <SelectItem value="LEFT">Left-handed</SelectItem>
                                </SelectContent>
                            </Select>
                            {existing && <FieldDescription>From {existing.firstName}'s profile.</FieldDescription>}
                            {errors.hand && <FieldError>{errors.hand}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="import-grip">Grip</FieldLabel>
                            <Select value={grip} onValueChange={value => setGrip(value as GripStyle)}>
                                <SelectTrigger id="import-grip"><SelectValue /></SelectTrigger>
                                <SelectContent>{GRIPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                            </Select>
                            {!bowler.gripKnown && paperImport.reading && <FieldDescription>Not marked on the sheet.</FieldDescription>}
                        </Field>
                    </div>
                </div>

                <div className="grid gap-3">
                    <h2 className="text-base font-semibold">Drill sheet</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {text('sheetName', 'Name', sheetName, setSheetName)}
                        <Field data-invalid={!!errors.spanType}>
                            <FieldLabel htmlFor="import-span-type">The sheet's spans are</FieldLabel>
                            <Select value={spanType ?? ''} onValueChange={value => { setSpanType(value as SpanTypeKey); setErrors(prev => ({ ...prev, spanType: '' })) }}>
                                <SelectTrigger id="import-span-type"><SelectValue placeholder="Pick the span type" /></SelectTrigger>
                                <SelectContent>{SPAN_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FieldDescription>
                                {paperImport.suggestedSpanType ? `What you picked for the last ${template ?? 'paper'} sheet.` : 'Remembered for the next sheet like this one.'}
                            </FieldDescription>
                            {errors.spanType && <FieldError>{errors.spanType}</FieldError>}
                        </Field>
                    </div>
                    {proposal
                        ? <ImportValues rows={proposal.rows} issues={proposal.issues} />
                        : <p className="text-sm text-gray-500">Pick the bowler's hand to see which finger each value goes to.</p>}
                </div>

                {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {confirmDiscard ? (
                        <>
                            <span className="text-sm text-gray-600">Discard this page?</span>
                            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDiscard(false)}>Keep it</Button>
                            <Button type="button" variant="destructive" size="sm" disabled={busy !== null} onClick={() => void run('discard', onDiscard)}>Discard</Button>
                        </>
                    ) : (
                        <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDiscard(true)}>Discard page</Button>
                    )}
                    <div className="ml-auto flex flex-wrap gap-2">
                        {hasNext && (
                            <Button type="button" variant="outline" disabled={busy !== null || paperImport.status === 'READING'} onClick={() => submit('next')}>
                                {busy === 'next' ? 'Importing…' : 'Import, next sheet'}
                            </Button>
                        )}
                        <Button type="button" disabled={busy !== null || paperImport.status === 'READING'} onClick={() => submit('open')}>
                            {busy === 'open' ? 'Importing…' : 'Import and open drill sheet'}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
