import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    ballLayoutWriteSchema, layoutSystems, papReference, solveBallLayout,
    type BallLayout, type BallLayoutDto, type BallLayoutWrite, type LayoutSystem
} from '../../../../shared/api/ballLayouts'
import { LayoutError, QUARTER_ROUND, fromReference } from '../../../../shared/layout/ballLayout'
import type { Customer } from '../../../types'
import { LAYOUT_SYSTEM_LABELS, describeNumbers, layoutInches, otherSystems } from '../../../utils/BallLayoutFormat'
import { format32, parseInches } from '../../../utils/Fractions'
import { LayoutDiagram } from './LayoutDiagram'

interface LayoutDialogProps {
    /** The ball's pin to MB (inches), when measured. */
    psaDistance: number | null
    /** A symmetric ball: its PSA is 6¾″ from the pin, through the CG. */
    symmetric: boolean
    owner: Customer | null
    /** The drilling being corrected; otherwise a new one. */
    existing: BallLayoutDto | null
    /** The ball's latest layout: a new drilling starts from its system and PAP. */
    previous: BallLayoutDto | null
    onSave: (input: BallLayoutWrite) => Promise<void>
    onClose: () => void
}

const today = () => new Date().toLocaleDateString('en-CA')
const text32 = (value: number | null | undefined) => (value == null ? '' : format32(value).replace('−', ''))
const to32 = (text: string) => { const inches = parseInches(text); return inches == null ? null : Math.round(inches * 32) }
const toDegrees = (text: string) => (text.trim() && Number.isFinite(Number(text)) ? Math.round(Number(text) * 2) / 2 : null)

/**
 * Enter one drilling's layout in the system the driller works in. The other
 * systems' numbers, where the pin and PSA sit from the grip, and the diagram
 * follow as it's typed; a layout that can't exist on this ball says why.
 */
export const LayoutDialog = ({ psaDistance, symmetric, owner, existing, previous, onSave, onClose }: LayoutDialogProps) => {
    const start = existing?.layout ?? previous?.layout ?? null
    const [system, setSystem] = useState<LayoutSystem>(start?.system ?? 'PIN_BUFFER')
    const [pinToPap, setPinToPap] = useState(text32(existing?.layout.pinToPap32))
    const [psaToPap, setPsaToPap] = useState(existing && existing.layout.system !== 'DUAL_ANGLE' ? text32(existing.layout.psaToPap32) : '')
    const [pinBuffer, setPinBuffer] = useState(existing?.layout.system === 'PIN_BUFFER' ? text32(existing.layout.pinBuffer32) : '')
    const [pinToCog, setPinToCog] = useState(existing?.layout.system === 'TWO_LS' ? text32(existing.layout.pinToCog32) : '')
    const [drillingAngle, setDrillingAngle] = useState(existing?.layout.system === 'DUAL_ANGLE' ? String(existing.layout.drillingAngle) : '')
    const [valAngle, setValAngle] = useState(existing?.layout.system === 'DUAL_ANGLE' ? String(existing.layout.valAngle) : '')
    const startPap = start?.pap ?? (owner?.delivery?.papOver32 != null ? { over32: owner.delivery.papOver32, up32: owner.delivery.papUp32 ?? 0 } : null)
    const [papOver, setPapOver] = useState(text32(startPap?.over32))
    const [papUp, setPapUp] = useState(text32(startPap ? Math.abs(startPap.up32) : null))
    const [papDown, setPapDown] = useState((startPap?.up32 ?? 0) < 0)
    const [psaDistanceText, setPsaDistanceText] = useState(text32(existing?.layout.psaDistance32 ?? (symmetric ? null : psaDistance != null ? Math.round(psaDistance * 32) : null)))
    const [hand, setHand] = useState<'RIGHT' | 'LEFT'>(existing?.layout.hand ?? owner?.dominantHand ?? 'RIGHT')
    const [drilledOn, setDrilledOn] = useState(existing?.drilledOn ?? today())
    const [notes, setNotes] = useState(existing?.notes ?? '')
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const dual = system === 'DUAL_ANGLE'

    // The layout as typed so far, and where it puts everything (or why it can't be).
    const result = useMemo((): { layout: BallLayout | null; solved: ReturnType<typeof solveBallLayout> | null; error: string | null } => {
        const over32 = to32(papOver), up32 = papUp.trim() ? to32(papUp) : 0, pin32 = to32(pinToPap)
        const psaDist32 = symmetric || !psaDistanceText.trim() ? QUARTER_ROUND * 32 : to32(psaDistanceText)
        if (over32 == null || up32 == null || pin32 == null || psaDist32 == null) return { layout: null, solved: null, error: null }
        const common = { pinToPap32: pin32, pap: { over32, up32: papDown ? -up32 : up32 }, hand, psaDistance32: psaDist32, layoutSchemaVersion: 1 as const }
        let layout: BallLayout
        if (dual) {
            const da = toDegrees(drillingAngle), va = toDegrees(valAngle)
            if (da == null || va == null) return { layout: null, solved: null, error: null }
            layout = { system: 'DUAL_ANGLE', ...common, drillingAngle: da, valAngle: va }
        } else if (system === 'TWO_LS') {
            const c32 = to32(pinToCog), p32 = to32(psaToPap)
            if (c32 == null || p32 == null) return { layout: null, solved: null, error: null }
            layout = { system, ...common, pinToCog32: c32, psaToPap32: p32 }
        } else {
            const p32 = to32(psaToPap), b32 = to32(pinBuffer)
            if (p32 == null || b32 == null) return { layout: null, solved: null, error: null }
            layout = { system, ...common, psaToPap32: p32, pinBuffer32: b32 }
        }
        try {
            return { layout, solved: solveBallLayout(layout), error: null }
        } catch (err) {
            if (err instanceof LayoutError) return { layout, solved: null, error: err.message }
            throw err
        }
    }, [system, dual, pinToPap, psaToPap, pinBuffer, pinToCog, drillingAngle, valAngle, papOver, papUp, papDown, psaDistanceText, symmetric, hand])

    const save = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!result.layout) { setFormError('Fill in the layout and the PAP'); return }
        const input: BallLayoutWrite = { drilledOn, layout: result.layout, notes }
        const parsed = ballLayoutWriteSchema.safeParse(input)
        if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? 'Check the layout'); return }
        setSaving(true)
        setFormError(null)
        try {
            await onSave(input)
            onClose()
        } catch (err) {
            setFormError((err as Error).message)
            setSaving(false)
        }
    }

    /** Where a point is from the grip, in the bowler's words. */
    const fromGrip = (point: Parameters<typeof fromReference>[0]) => {
        const p = fromReference(point)
        const across = Math.abs(p.over) < 1 / 64 ? 'on the centerline' : `${layoutInches(Math.abs(p.over))} toward the ${p.over > 0 ? 'ring' : 'middle'} finger`
        const vertical = Math.abs(p.up) < 1 / 64 ? 'on the midline' : `${layoutInches(Math.abs(p.up))} ${p.up > 0 ? 'above' : 'below'} the midline`
        return `${vertical}, ${across}`
    }

    const numberInput = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string, unit: 'in' | '°') => (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input id={id} value={value} placeholder={placeholder} inputMode="decimal" autoComplete="off" className="font-mono" aria-describedby={`${id}-unit`}
                onChange={event => set(event.target.value)} />
            <span id={`${id}-unit`} className="sr-only">{unit === 'in' ? 'inches' : 'degrees'}</span>
        </Field>
    )

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
                <form className="grid gap-4" onSubmit={save}>
                    <DialogHeader>
                        <DialogTitle>{existing ? 'Edit layout' : 'Add a layout'}</DialogTitle>
                        <DialogDescription>Enter it in the system you work in; the others are calculated on the ball (a sphere), not flat.</DialogDescription>
                    </DialogHeader>

                    <div role="radiogroup" aria-label="Layout system" className="flex flex-wrap gap-1.5">
                        {layoutSystems.map(s => (
                            <button key={s} type="button" role="radio" aria-checked={system === s} onClick={() => setSystem(s)}
                                className={cn('rounded-full border px-3 py-1 text-sm transition-colors',
                                    system === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                                {LAYOUT_SYSTEM_LABELS[s]}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,300px)]">
                        <div className="grid content-start gap-4">
                            <div className="grid grid-cols-3 gap-3">
                                {dual ? <>
                                    {numberInput('layout-da', 'Drilling angle °', drillingAngle, setDrillingAngle, '60', '°')}
                                    {numberInput('layout-pin', 'Pin to PAP', pinToPap, setPinToPap, '4', 'in')}
                                    {numberInput('layout-val', 'VAL angle °', valAngle, setValAngle, '30', '°')}
                                </> : system === 'TWO_LS' ? <>
                                    {numberInput('layout-pin', 'Pin to PAP', pinToPap, setPinToPap, '5', 'in')}
                                    {numberInput('layout-cog', 'Pin to COG', pinToCog, setPinToCog, '4', 'in')}
                                    {numberInput('layout-psa', 'PSA to PAP', psaToPap, setPsaToPap, '3 1/2', 'in')}
                                </> : <>
                                    {numberInput('layout-pin', 'Pin to PAP', pinToPap, setPinToPap, '5', 'in')}
                                    {numberInput('layout-psa', 'PSA to PAP', psaToPap, setPsaToPap, '4', 'in')}
                                    {numberInput('layout-buffer', 'Pin buffer', pinBuffer, setPinBuffer, '2', 'in')}
                                </>}
                            </div>

                            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                                {numberInput('layout-pap-over', system === 'TWO_LS' ? 'PAP over (from bridge)' : 'PAP over', papOver, setPapOver, '5 3/8', 'in')}
                                {numberInput('layout-pap-up', 'PAP up/down', papUp, setPapUp, '1/2', 'in')}
                                <Select value={papDown ? 'DOWN' : 'UP'} onValueChange={v => setPapDown(v === 'DOWN')}>
                                    <SelectTrigger aria-label="PAP up or down" className="w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="UP">up</SelectItem><SelectItem value="DOWN">down</SelectItem></SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Field>
                                    <FieldLabel htmlFor="layout-mb">Pin to {symmetric ? 'PSA' : 'MB'}</FieldLabel>
                                    {symmetric
                                        ? <p className="py-1.5 font-mono text-sm">6-3/4</p>
                                        : <Input id="layout-mb" value={psaDistanceText} placeholder="6 3/4" className="font-mono" onChange={event => setPsaDistanceText(event.target.value)} />}
                                </Field>
                                <Field>
                                    <FieldLabel>Hand</FieldLabel>
                                    <Select value={hand} onValueChange={v => setHand(v as 'RIGHT' | 'LEFT')}>
                                        <SelectTrigger aria-label="Hand"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="RIGHT">Right</SelectItem><SelectItem value="LEFT">Left</SelectItem></SelectContent>
                                    </Select>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="layout-date">Drilled</FieldLabel>
                                    <Input id="layout-date" type="date" value={drilledOn} onChange={event => setDrilledOn(event.target.value)} />
                                </Field>
                            </div>
                            <FieldDescription>
                                {symmetric ? 'Symmetric ball: the PSA mark is 6¾″ from the pin, through the CG.' : 'Measure the pin to the MB on this ball; blank uses 6¾″.'}
                                {' '}{system === 'TWO_LS' ? '2LS: the center of grip is the center of the bridge; the PAP and pin to COG are measured from it.' : 'The PAP is measured from the center of the grip.'}
                            </FieldDescription>

                            {result.error && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">This layout can't exist on this ball: {result.error}.</p>}

                            {result.solved && (
                                <section aria-label="In every system" className="grid gap-1.5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
                                    {otherSystems(system).map(other => (
                                        <p key={other}><span className="text-gray-500">{LAYOUT_SYSTEM_LABELS[other]}:</span> <span className="font-mono">{describeNumbers(other, result.solved!)}</span></p>
                                    ))}
                                    <p className="font-mono text-xs text-gray-500">
                                        pin to PAP {result.solved.pinToPap.toFixed(3)} · PSA to PAP {result.solved.psaToPap.toFixed(3)} · buffer {result.solved.pinBuffer.toFixed(3)} · pin to {system === 'TWO_LS' ? 'COG' : 'grip center'} {result.solved.pinToCog.toFixed(3)} · {result.solved.drillingAngle.toFixed(1)}° / {result.solved.valAngle.toFixed(1)}°
                                    </p>
                                    <p><span className="text-gray-500">Pin:</span> {fromGrip(result.solved.pin)}</p>
                                    <p><span className="text-gray-500">PSA:</span> {fromGrip(result.solved.psa)}</p>
                                </section>
                            )}

                            <Field>
                                <FieldLabel htmlFor="layout-notes">Notes (optional)</FieldLabel>
                                <Input id="layout-notes" value={notes} onChange={event => setNotes(event.target.value)} />
                            </Field>
                        </div>

                        <div className="grid content-start">
                            {result.solved
                                ? <LayoutDiagram solved={result.solved} hand={hand} reference={papReference(system)} className="w-full" />
                                : <div className="flex aspect-square items-center justify-center rounded-full border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">The layout shows here once the numbers and the PAP are in.</div>}
                        </div>
                    </div>

                    {formError && <FieldError>{formError}</FieldError>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving || !result.solved}>{saving ? 'Saving…' : existing ? 'Save layout' : 'Add layout'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
