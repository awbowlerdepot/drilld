import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ballRegisterSchema, type BallLookupDto, type BallRegister, type CatalogBallDto } from '../../../shared/api/balls'
import { ballsApi } from '../../hooks/useCompanyBalls'
import type { Customer } from '../../types'
import { describeConstruction, describeWeightSpecs } from '../../utils/BallFormat'
import { parseInches } from '../../utils/Fractions'
import { CatalogBallPicker } from './CatalogBallPicker'
import { CustomerSelect } from './CustomerSelect'

interface RegisterBallDialogProps {
    /** The bowler, when adding from their profile; otherwise picked here. */
    customer: Customer | null
    customers: Customer[]
    onRegister: (input: BallRegister) => Promise<void>
    onClose: () => void
}

const DEFAULT_WEIGHTS = [16, 15, 14, 13, 12]
const month = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })

/**
 * Register a bowler's ball: find it in the catalog (each colorway is its own
 * ball), its weight and serial number, and the shop's measurements. A serial
 * already registered somewhere shows its anonymous history.
 */
export const RegisterBallDialog = ({ customer, customers, onRegister, onClose }: RegisterBallDialogProps) => {
    const [ball, setBall] = useState<CatalogBallDto | null>(null)
    const [weightLbs, setWeightLbs] = useState<number | null>(null)
    const [serial, setSerial] = useState('')
    const [customerId, setCustomerId] = useState<string | null>(customer?.id ?? null)
    const [pin, setPin] = useState('')
    const [topWeight, setTopWeight] = useState('')
    const [purchaseDate, setPurchaseDate] = useState('')
    const [notes, setNotes] = useState('')
    const [lookup, setLookup] = useState<BallLookupDto | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const weights = ball?.weights.length ? ball.weights.map(w => w.weightLbs) : DEFAULT_WEIGHTS

    // What's known about this serial, once it's typed.
    useEffect(() => {
        let cancelled = false
        const trimmed = serial.trim()
        if (!ball || trimmed.length < 4) {
            setLookup(null)
            return
        }
        const timer = setTimeout(() => {
            ballsApi.lookup(ball.brandId, trimmed).then(result => { if (!cancelled) setLookup(result) }).catch(() => undefined)
        }, 400)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [ball, serial])

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const pinInches = pin.trim() ? parseInches(pin) : null
        const input: BallRegister = {
            catalogBallId: ball?.id ?? '', weightLbs: weightLbs ?? 0, serialNumber: serial, customerId: customerId ?? '',
            pinDistance: pinInches, topWeight: topWeight.trim() ? Number(topWeight) : null, purchaseDate, notes
        }
        const found: Record<string, string> = {}
        if (pin.trim() && pinInches == null) found.pinDistance = 'Use inches, like 4 1/2 or 4.5'
        if (!weightLbs) found.weightLbs = 'Pick the weight'
        const parsed = ballRegisterSchema.safeParse(input)
        if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= issue.message
        setErrors(found)
        if (Object.keys(found).length > 0) return
        setSaving(true)
        try {
            await onRegister(input)
            onClose()
        } catch (err) {
            setErrors({ form: (err as Error).message })
            setSaving(false)
        }
    }

    const mismatch = lookup?.registered && ball && (lookup.catalogBall?.id !== ball.id || (weightLbs && lookup.weightLbs !== weightLbs))

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                <form className="grid gap-4" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Add a ball{customer ? ` for ${customer.firstName}` : ''}</DialogTitle>
                        <DialogDescription>From the BowlerIQ catalog. The serial number lets its history follow it between shops.</DialogDescription>
                    </DialogHeader>

                    {ball ? (
                        <div className="flex items-center gap-3 rounded-lg border border-primary bg-blue-50 px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1">
                                <span className="block font-medium text-gray-900">{ball.brandName} {ball.name}</span>
                                <span className="block text-xs text-gray-600">{[ball.color, describeConstruction(ball)].filter(Boolean).join(' · ')}</span>
                            </span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setBall(null); setWeightLbs(null) }}>Change</Button>
                        </div>
                    ) : (
                        <Field data-invalid={!!errors.catalogBallId}>
                            <FieldLabel>Ball</FieldLabel>
                            <CatalogBallPicker selected={ball} onSelect={b => { setBall(b); setErrors(prev => ({ ...prev, catalogBallId: '' })) }} />
                            {errors.catalogBallId && <FieldError>{errors.catalogBallId}</FieldError>}
                        </Field>
                    )}

                    {ball && (
                        <FieldGroup className="grid gap-4">
                            <Field data-invalid={!!errors.weightLbs}>
                                <FieldLabel>Weight</FieldLabel>
                                <div role="radiogroup" aria-label="Weight" className="flex flex-wrap gap-1.5">
                                    {weights.map(w => (
                                        <button key={w} type="button" role="radio" aria-checked={weightLbs === w} onClick={() => { setWeightLbs(w); setErrors(prev => ({ ...prev, weightLbs: '' })) }}
                                            className={cn('min-w-12 rounded-full border px-3 py-1 text-sm transition-colors',
                                                weightLbs === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                                            {w} lb
                                        </button>
                                    ))}
                                </div>
                                {weightLbs && describeWeightSpecs(ball, weightLbs) && <FieldDescription>{describeWeightSpecs(ball, weightLbs)}</FieldDescription>}
                                {errors.weightLbs && <FieldError>{errors.weightLbs}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="ball-serial">Serial number (optional)</FieldLabel>
                                <Input id="ball-serial" value={serial} autoComplete="off" className="font-mono uppercase" onChange={event => setSerial(event.target.value)} />
                                {lookup?.registered && (
                                    lookup.companyBallId ? (
                                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Already in your records. Transfer it to the new owner instead.</p>
                                    ) : mismatch ? (
                                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                            This serial is registered as a {lookup.catalogBall?.brandName} {lookup.catalogBall?.name}{lookup.catalogBall?.color ? ` (${lookup.catalogBall.color})` : ''}, {lookup.weightLbs} lb. Check the serial.
                                        </p>
                                    ) : (
                                        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                                            Seen before at another shop: drilled {lookup.history?.drillCount ?? 0}×, plugged {lookup.history?.plugCount ?? 0}×
                                            {lookup.history?.lastWorkedMonth ? `, last worked ${month(lookup.history.lastWorkedMonth)}` : ''}.
                                        </p>
                                    )
                                )}
                            </Field>

                            {!customer && (
                                <Field data-invalid={!!errors.customerId}>
                                    <FieldLabel htmlFor="ball-customer">Owner</FieldLabel>
                                    <CustomerSelect id="ball-customer" customers={customers} value={customerId} onChange={id => { setCustomerId(id); setErrors(prev => ({ ...prev, customerId: '' })) }} />
                                    {errors.customerId && <FieldError>{errors.customerId}</FieldError>}
                                </Field>
                            )}

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field data-invalid={!!errors.pinDistance}>
                                    <FieldLabel htmlFor="ball-pin">Pin to CG (in)</FieldLabel>
                                    <Input id="ball-pin" value={pin} placeholder="4 1/2" className="font-mono" onChange={event => setPin(event.target.value)} />
                                    {errors.pinDistance && <FieldError>{errors.pinDistance}</FieldError>}
                                </Field>
                                <Field data-invalid={!!errors.topWeight}>
                                    <FieldLabel htmlFor="ball-top">Top weight (oz)</FieldLabel>
                                    <Input id="ball-top" type="number" inputMode="decimal" step="0.25" min={0} value={topWeight} className="font-mono" onChange={event => setTopWeight(event.target.value)} />
                                    {errors.topWeight && <FieldError>{errors.topWeight}</FieldError>}
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="ball-purchased">Purchased</FieldLabel>
                                    <Input id="ball-purchased" type="date" value={purchaseDate} onChange={event => setPurchaseDate(event.target.value)} />
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="ball-notes">Notes (optional)</FieldLabel>
                                <Input id="ball-notes" value={notes} onChange={event => setNotes(event.target.value)} />
                            </Field>
                        </FieldGroup>
                    )}

                    {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!ball || saving || !!lookup?.companyBallId}>{saving ? 'Adding…' : 'Add ball'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
