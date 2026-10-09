import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BallDetailDto, BallDto, BallStatus } from '../../../shared/api/balls'
import { ballsApi } from '../../hooks/useCompanyBalls'
import type { Customer } from '../../types'
import { describeConstruction, describeWeightSpecs, formatInches } from '../../utils/BallFormat'
import { parseInches } from '../../utils/Fractions'
import { BallImage } from './BallImage'
import { BallLayoutSection } from './layout/BallLayoutSection'

interface BallDetailDialogProps {
    ballId: string
    customers: Customer[]
    canEdit: boolean
    onChange: (ball: BallDto) => void
    /** Updates a customer (a PAP entered for a layout goes to the bowler's profile). */
    onUpdateCustomer?: (id: string, updates: Partial<Customer>) => Promise<void>
    onClose: () => void
}

const STATUSES: { value: BallStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'DAMAGED', label: 'Damaged' }
]
const month = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** One ball: what it is (catalog specs at its weight), its layout, the shop's measurements, and its anonymous history. */
export const BallDetailDialog = ({ ballId, customers, canEdit, onChange, onUpdateCustomer, onClose }: BallDetailDialogProps) => {
    const [ball, setBall] = useState<BallDetailDto | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pin, setPin] = useState('')
    const [mb, setMb] = useState('')
    const [topWeight, setTopWeight] = useState('')
    const [notes, setNotes] = useState('')
    const [status, setStatus] = useState<BallStatus>('ACTIVE')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        ballsApi.get(ballId).then(b => {
            if (cancelled) return
            setBall(b)
            setPin(b.pinDistance != null ? String(b.pinDistance) : '')
            setMb(b.psaDistance != null ? String(b.psaDistance) : '')
            setTopWeight(b.topWeight != null ? String(b.topWeight) : '')
            setNotes(b.notes ?? '')
            setStatus(b.status)
        }).catch((err: Error) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [ballId])

    const run = async (work: () => Promise<BallDetailDto>) => {
        setSaving(true)
        setError(null)
        try {
            const updated = await work()
            setBall(updated)
            onChange(updated)
            return updated
        } catch (err) {
            setError((err as Error).message)
            return null
        } finally {
            setSaving(false)
        }
    }

    /** A change made in a nested dialog (its errors show there). */
    const applied = (updated: BallDetailDto) => {
        setBall(updated)
        onChange(updated)
    }

    const owner = customers.find(c => c.id === ball?.owner?.customerId) ?? null

    const save = async () => {
        const pinInches = pin.trim() ? parseInches(pin) : null
        if (pin.trim() && pinInches == null) {
            setError('Pin to CG: use inches, like 4 1/2 or 4.5')
            return
        }
        const mbInches = mb.trim() ? parseInches(mb) : null
        if (mb.trim() && !mbInches) {
            setError('Pin to MB: use inches, like 6 1/4 or 6.25')
            return
        }
        const updated = await run(() => ballsApi.update(ballId, { pinDistance: pinInches, psaDistance: mbInches, topWeight: topWeight.trim() ? Number(topWeight) : null, notes, status }))
        if (updated) onClose()
    }

    const cat = ball?.catalogBall
    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{cat ? `${cat.brandName} ${cat.name}` : 'Ball'}</DialogTitle>
                    <DialogDescription>{cat ? [cat.color, ball && `${ball.weightLbs} lb`, ball?.serialNumber && `S/N ${ball.serialNumber}`].filter(Boolean).join(' · ') : 'Loading…'}</DialogDescription>
                </DialogHeader>
                {ball && cat && (
                    <div className="grid gap-4">
                        <section className="flex items-center gap-4">
                        <BallImage ball={cat} size="lg" />
                        <div className="grid min-w-0 flex-1 gap-1 text-sm text-gray-700">
                            {describeConstruction(cat) && <p>{describeConstruction(cat)}</p>}
                            {describeWeightSpecs(cat, ball.weightLbs) && <p className="font-mono text-xs text-gray-600">{ball.weightLbs} lb: {describeWeightSpecs(cat, ball.weightLbs)}</p>}
                            {cat.status === 'retired' && <Badge variant="outline" className="justify-self-start font-normal">Retired by the maker</Badge>}
                            {cat.source === 'shop' && <Badge variant="outline" className="justify-self-start font-normal">Typed in by your shop (not in the BowlerIQ catalog)</Badge>}
                        </div>
                        </section>

                        <BallLayoutSection ball={ball} owner={owner} canEdit={canEdit}
                            onSaveBowlerPap={owner && onUpdateCustomer
                                ? pap => onUpdateCustomer(owner.id, { delivery: { ...owner.delivery, papOver32: pap.over32, papUp32: pap.up32 } })
                                : undefined}
                            onAdd={async input => applied(await ballsApi.addLayout(ballId, input))}
                            onUpdate={async (layoutId, input) => applied(await ballsApi.updateLayout(layoutId, input))}
                            onDelete={async layoutId => { await run(() => ballsApi.deleteLayout(layoutId)) }} />

                        <section className="grid gap-3 sm:grid-cols-4">
                            <Field>
                                <FieldLabel htmlFor="detail-pin">Pin to CG (in)</FieldLabel>
                                {canEdit ? <Input id="detail-pin" value={pin} className="font-mono" onChange={event => setPin(event.target.value)} /> : <p className="font-mono text-sm">{formatInches(ball.pinDistance)}</p>}
                            </Field>
                            {cat.core?.type !== 'symmetric' && (
                                <Field>
                                    <FieldLabel htmlFor="detail-mb">Pin to MB (in)</FieldLabel>
                                    {canEdit ? <Input id="detail-mb" value={mb} placeholder="6 3/4" className="font-mono" onChange={event => setMb(event.target.value)} /> : <p className="font-mono text-sm">{formatInches(ball.psaDistance)}</p>}
                                </Field>
                            )}
                            <Field>
                                <FieldLabel htmlFor="detail-top">Top weight (oz)</FieldLabel>
                                {canEdit ? <Input id="detail-top" type="number" step="0.25" min={0} value={topWeight} className="font-mono" onChange={event => setTopWeight(event.target.value)} /> : <p className="font-mono text-sm">{ball.topWeight ?? '—'}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="detail-status">Status</FieldLabel>
                                <Select value={status} disabled={!canEdit} onValueChange={v => setStatus(v as BallStatus)}>
                                    <SelectTrigger id="detail-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                        </section>
                        <Field>
                            <FieldLabel htmlFor="detail-notes">Notes</FieldLabel>
                            {canEdit ? <Input id="detail-notes" value={notes} onChange={event => setNotes(event.target.value)} /> : <p className="text-sm">{ball.notes || '—'}</p>}
                        </Field>

                        <section className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {ball.history.drillCount + ball.history.plugCount === 0
                                ? 'No drilling or plug work recorded yet, here or at another shop.'
                                : `Drilled ${ball.history.drillCount}×, plugged ${ball.history.plugCount}×${ball.history.lastWorkedMonth ? `, last worked ${month(ball.history.lastWorkedMonth)}` : ''} (all shops).`}
                        </section>
                    </div>
                )}
                {error && <FieldError>{error}</FieldError>}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>{canEdit ? 'Cancel' : 'Close'}</Button>
                    {canEdit && <Button type="button" disabled={!ball || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
