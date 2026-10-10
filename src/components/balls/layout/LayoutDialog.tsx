import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    ballLayoutWriteSchema, solveBallLayout,
    type BallLayout, type BallLayoutDto, type BallLayoutWrite, type LayoutSystem
} from '../../../../shared/api/ballLayouts'
import { LayoutError, QUARTER_ROUND, fromReference } from '../../../../shared/layout/ballLayout'
import type { Customer } from '../../../types'
import { LAYOUT_SYSTEM_LABELS, describeNumbers, layoutDegrees, layoutInches, otherSystems, systemsFor } from '../../../utils/BallLayoutFormat'
import { format32 } from '../../../utils/Fractions'
import { DetailRow } from '../../pickers/DetailRow'
import { LengthPickerDialog } from '../../pickers/LengthPickerDialog'
import { NumberPickerDialog } from '../../pickers/NumberPickerDialog'
import type { LengthPickerRequest, NumberPickerRequest } from '../../pickers/pickerRequests'
import { useBallGrip } from '../../../hooks/useBallGrip'
import { BallView3D } from '../three/BallView3D'

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
    /** Saves a PAP entered here to the bowler's profile (when it had none). */
    onSaveBowlerPap?: (pap: { over32: number; up32: number }) => Promise<void>
    onClose: () => void
}

const today = () => new Date().toLocaleDateString('en-CA')
const SYMMETRIC_PSA_32 = QUARTER_ROUND * 32

type Picker = LengthPickerRequest | NumberPickerRequest

/**
 * Enter one drilling's layout in the system the driller works in, tapping
 * each measurement like on the drill sheet. The other systems' numbers, where
 * the pin and PSA sit from the grip, and the diagram follow; a layout that
 * can't exist on this ball says why.
 */
export const LayoutDialog = ({ psaDistance, symmetric, owner, existing, previous, onSave, onSaveBowlerPap, onClose }: LayoutDialogProps) => {
    const start = existing?.layout ?? previous?.layout ?? null
    const was = existing?.layout
    const [system, setSystem] = useState<LayoutSystem>(start?.system ?? 'PIN_BUFFER')
    const [pinToPap32, setPinToPap32] = useState<number | null>(was?.pinToPap32 ?? null)
    const [psaToPap32, setPsaToPap32] = useState<number | null>(was && was.system !== 'DUAL_ANGLE' ? was.psaToPap32 : null)
    const [pinBuffer32, setPinBuffer32] = useState<number | null>(was?.system === 'PIN_BUFFER' ? was.pinBuffer32 : null)
    const [pinToCog32, setPinToCog32] = useState<number | null>(was?.system === 'TWO_LS' ? was.pinToCog32 : null)
    const [drillingAngle, setDrillingAngle] = useState<number | null>(was?.system === 'DUAL_ANGLE' ? was.drillingAngle : null)
    const [valAngle, setValAngle] = useState<number | null>(was?.system === 'DUAL_ANGLE' ? was.valAngle : null)
    // The PAP is the bowler's: a new layout takes it from their profile. A drilling being corrected keeps the PAP it was drilled to.
    const profilePap = owner?.delivery?.papOver32 != null ? { over32: owner.delivery.papOver32, up32: owner.delivery.papUp32 ?? 0 } : null
    const startPap = was?.pap ?? profilePap ?? previous?.layout.pap ?? null
    const [papOver32, setPapOver32] = useState<number | null>(startPap?.over32 ?? null)
    const [papUp32, setPapUp32] = useState<number | null>(startPap?.up32 ?? null)
    const [papEditing, setPapEditing] = useState(!startPap || (!!was && (!profilePap || was.pap.over32 !== profilePap.over32 || was.pap.up32 !== profilePap.up32)))
    const [savePapToProfile, setSavePapToProfile] = useState(!profilePap && !!owner && !!onSaveBowlerPap)
    const usingProfilePap = !!profilePap && papOver32 === profilePap.over32 && (papUp32 ?? 0) === profilePap.up32
    const [psaDistance32, setPsaDistance32] = useState<number | null>(was?.psaDistance32 ?? (psaDistance != null ? Math.round(psaDistance * 32) : null))
    const [hand, setHand] = useState<'RIGHT' | 'LEFT'>(was?.hand ?? owner?.dominantHand ?? 'RIGHT')
    const [drilledOn, setDrilledOn] = useState(existing?.drilledOn ?? today())
    const [notes, setNotes] = useState(existing?.notes ?? '')
    const [picker, setPicker] = useState<Picker | null>(null)
    // The drill sheet drilled: the one this drilling recorded, else the last drilling's sheet, else the most recent.
    const holes = useBallGrip(owner, hand, existing?.drillSheet ?? null, previous?.drillSheet?.sheetId)
    const { grip } = holes
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const dual = system === 'DUAL_ANGLE'
    const mb32 = symmetric ? SYMMETRIC_PSA_32 : psaDistance32 ?? SYMMETRIC_PSA_32

    // The layout as entered so far, and where it puts everything (or why it can't be).
    const result = useMemo((): { layout: BallLayout | null; solved: ReturnType<typeof solveBallLayout> | null; error: string | null } => {
        const none = { layout: null, solved: null, error: null }
        if (papOver32 == null || pinToPap32 == null) return none
        const common = { pinToPap32, pap: { over32: papOver32, up32: papUp32 ?? 0 }, hand, psaDistance32: mb32, layoutSchemaVersion: 1 as const }
        let layout: BallLayout
        if (dual) {
            if (drillingAngle == null || valAngle == null) return none
            layout = { system: 'DUAL_ANGLE', ...common, drillingAngle, valAngle }
        } else if (system === 'TWO_LS') {
            if (pinToCog32 == null || psaToPap32 == null) return none
            layout = { system, ...common, pinToCog32, psaToPap32 }
        } else {
            if (psaToPap32 == null || pinBuffer32 == null) return none
            layout = { system, ...common, psaToPap32, pinBuffer32 }
        }
        try {
            return { layout, solved: solveBallLayout(layout), error: null }
        } catch (err) {
            if (err instanceof LayoutError) return { layout, solved: null, error: err.message }
            throw err
        }
    }, [system, dual, pinToPap32, psaToPap32, pinBuffer32, pinToCog32, drillingAngle, valAngle, papOver32, papUp32, mb32, hand])

    const save = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!result.layout) { setFormError('Enter the layout and the PAP'); return }
        const input: BallLayoutWrite = { drilledOn, layout: result.layout, notes, drillSheetRevisionId: holes.revisionId }
        const parsed = ballLayoutWriteSchema.safeParse(input)
        if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? 'Check the layout'); return }
        setSaving(true)
        setFormError(null)
        try {
            if (savePapToProfile && !profilePap && onSaveBowlerPap) await onSaveBowlerPap(result.layout.pap)
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

    /** A tappable length in 32nds. */
    const length = (label: string, value: number | null, set: (v: number | null) => void, wholes: number[], description?: string) => (
        <DetailRow stacked readOnly={false} label={label} value={value != null ? `${format32(value)}″` : null}
            onClick={() => setPicker({ kind: 'length32', title: label, description, wholes, value, onSet: set })} />
    )
    /** A tappable angle in degrees. */
    const angle = (label: string, value: number | null, set: (v: number | null) => void, max: number) => (
        <DetailRow stacked readOnly={false} label={label} value={value != null ? layoutDegrees(value) : null}
            onClick={() => setPicker({ kind: 'number', title: label, unit: 'Degrees', min: 0, max, step: 0.5, value, onSet: set })} />
    )
    const upText = (up32: number) => (up32 === 0 ? 'level' : `${format32(Math.abs(up32))}″ ${up32 > 0 ? 'up' : 'down'}`)
    const upLabel = papUp32 == null ? null : papUp32 === 0 ? '0' : upText(papUp32)

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
                <form className="grid gap-4" onSubmit={save}>
                    <DialogHeader>
                        <DialogTitle>{existing ? 'Edit layout' : 'Add a layout'}</DialogTitle>
                        <DialogDescription>Enter it in the system you work in; the others are calculated on the ball (a sphere), not flat.</DialogDescription>
                    </DialogHeader>

                    <div role="radiogroup" aria-label="Layout system" className="flex flex-wrap gap-1.5">
                        {systemsFor(owner?.usesThumb ?? true, was?.system).map(s => (
                            <button key={s} type="button" role="radio" aria-checked={system === s} onClick={() => setSystem(s)}
                                className={cn('rounded-full border px-3 py-1 text-sm transition-colors',
                                    system === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                                {LAYOUT_SYSTEM_LABELS[s]}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,300px)]">
                        <div className="grid content-start gap-4">
                            <div className="grid grid-cols-3 gap-2">
                                {dual ? <>
                                    {angle('Drilling angle', drillingAngle, setDrillingAngle, 180)}
                                    {length('Pin to PAP', pinToPap32, setPinToPap32, [0, 1, 2, 3, 4, 5, 6])}
                                    {angle('VAL angle', valAngle, setValAngle, 90)}
                                </> : system === 'TWO_LS' ? <>
                                    {length('Pin to PAP', pinToPap32, setPinToPap32, [0, 1, 2, 3, 4, 5, 6])}
                                    {length('PSA to PAP', psaToPap32, setPsaToPap32, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])}
                                    {length('Pin to COG', pinToCog32, setPinToCog32, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'Pin to the center of grip (the center of the bridge)')}
                                </> : <>
                                    {length('Pin to PAP', pinToPap32, setPinToPap32, [0, 1, 2, 3, 4, 5, 6])}
                                    {length('PSA to PAP', psaToPap32, setPsaToPap32, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])}
                                    {length('Pin buffer', pinBuffer32, setPinBuffer32, [0, 1, 2, 3, 4, 5, 6], 'The pin\'s distance from the VAL')}
                                </>}
                            </div>

                            {papEditing ? (
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {length(system === 'TWO_LS' ? 'PAP over (bridge)' : 'PAP over', papOver32, setPapOver32, [3, 4, 5, 6, 7],
                                            system === 'TWO_LS' ? 'Inches from the center of the bridge' : 'Inches from the center line')}
                                        <DetailRow stacked readOnly={false} label="PAP up/down" value={upLabel}
                                            onClick={() => setPicker({ kind: 'length32', title: 'PAP: up or down', directions: ['Down', 'Up'], wholes: [0, 1, 2], value: papUp32, onSet: setPapUp32 })} />
                                    </div>
                                    {!profilePap && owner && onSaveBowlerPap ? (
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={savePapToProfile} onChange={event => setSavePapToProfile(event.target.checked)} className="size-4 accent-blue-600" />
                                            Save it to {owner.firstName}'s profile (it isn't there yet)
                                        </label>
                                    ) : profilePap && !usingProfilePap ? (
                                        <p className="text-xs text-gray-500">
                                            Different from {owner?.firstName}'s profile ({format32(profilePap.over32)}″ over, {upText(profilePap.up32)}) for this ball only.{' '}
                                            <button type="button" className="text-primary hover:underline" onClick={() => { setPapOver32(profilePap.over32); setPapUp32(profilePap.up32); setPapEditing(false) }}>Use the profile's</button>
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                                    <span>
                                        <span className="text-gray-500">PAP</span>{' '}
                                        <span className="font-mono font-semibold text-primary">{papOver32 != null ? `${format32(papOver32)}″ over, ${upText(papUp32 ?? 0)}` : '—'}</span>
                                        <span className="block text-xs text-gray-500">{usingProfilePap ? `From ${owner?.firstName}'s profile` : 'As drilled'}</span>
                                    </span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setPapEditing(true)}>Use a different PAP for this ball</Button>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                                {symmetric
                                    ? <DetailRow stacked readOnly label="Pin to PSA" value="6-3/4″" onClick={() => undefined} />
                                    : length('Pin to MB', psaDistance32, setPsaDistance32, [4, 5, 6, 7], 'Measured on this ball; not set uses 6¾″')}
                            </div>

                            <Field>
                                <FieldLabel>Drill sheet</FieldLabel>
                                <Select value={holes.selection} onValueChange={holes.setSelection}>
                                    <SelectTrigger aria-label="Drill sheet"><SelectValue /></SelectTrigger>
                                    <SelectContent>{holes.choices.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <FieldDescription>
                                    {holes.sheet?.currentRevision?.editable
                                        ? `Revision ${holes.sheet.currentRevision.version} is a draft: recording this drilling locks it, and later changes start a new revision.`
                                        : 'The holes drilled in this ball, and the ones shown on it.'}
                                </FieldDescription>
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
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
                                {symmetric ? 'Symmetric ball: the PSA mark is 6¾″ from the pin, through the CG.' : 'Pin to MB as measured on this ball; not set uses 6¾″.'}
                                {' '}{system === 'TWO_LS' ? '2LS: the center of grip is the center of the bridge; the PAP and pin to COG are measured from it.' : 'The PAP is measured from the center of the grip.'}
                            </FieldDescription>

                            {result.error && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">This layout can't exist on this ball: {result.error}.</p>}

                            {result.solved && (
                                <section aria-label="In every system" className="grid gap-1.5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
                                    {otherSystems(system, owner?.usesThumb ?? true).map(other => (
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
                                ? <BallView3D className="aspect-square w-full" solved={result.solved} hand={hand} grip={grip} polished={false} systems={[system]} />
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
            {picker?.kind === 'length32' && <LengthPickerDialog request={picker} onClose={() => setPicker(null)} />}
            {picker?.kind === 'number' && <NumberPickerDialog request={picker} onClose={() => setPicker(null)} />}
        </Dialog>
    )
}
