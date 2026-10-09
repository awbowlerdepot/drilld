import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CatalogBallDto } from '../../../../shared/api/balls'
import type { LayoutSystem } from '../../../../shared/api/ballLayouts'
import type { DrillSheetDto } from '../../../../shared/api/drillSheets'
import type { SolvedLayout } from '../../../../shared/layout/ballLayout'
import { placeGrip } from '../../../../shared/layout/gripPlacement'
import { drillSheetsApi } from '../../../hooks/useCustomerDrillSheets'
import type { Customer } from '../../../types'
import { LAYOUT_SYSTEM_LABELS, describeNumbers, systemsFor } from '../../../utils/BallLayoutFormat'
import { gripFromSheet } from '../../../utils/GripFromSheet'
import { SYSTEM_COLORS } from './systemColors'

// Three.js loads only when the 3D view opens.
const BallScene = lazy(() => import('./BallScene'))

interface Ball3DDialogProps {
    ball: CatalogBallDto
    solved: SolvedLayout
    hand: 'RIGHT' | 'LEFT'
    /** The system the layout was entered in: shown first. */
    system: LayoutSystem
    owner: Customer | null
    onClose: () => void
}

const NONE = 'NONE'

/** The ball in 3D with its layout and the bowler's drill sheet holes. */
export const Ball3DDialog = ({ ball, solved, hand, system, owner, onClose }: Ball3DDialogProps) => {
    const [sheets, setSheets] = useState<DrillSheetDto[]>([])
    const [sheetId, setSheetId] = useState<string>(NONE)

    useEffect(() => {
        let cancelled = false
        if (!owner) return
        drillSheetsApi.list(owner.id, {}).then(list => {
            if (cancelled) return
            const usable = list.filter(s => s.currentRevision)
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            setSheets(usable)
            if (usable[0]) setSheetId(usable[0].id)
        }).catch(() => undefined)
        return () => { cancelled = true }
    }, [owner])

    const sheet = sheets.find(s => s.id === sheetId) ?? null
    const grip = useMemo(() => placeGrip(gripFromSheet(sheet?.currentRevision?.spec ?? null, hand, owner?.usesThumb ?? true)), [sheet, hand, owner])
    const [polished, setPolished] = useState(false)
    const [systems, setSystems] = useState<LayoutSystem[]>([system])
    const toggle = (s: LayoutSystem) => setSystems(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]))

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[96vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{ball.brandName} {ball.name} in 3D</DialogTitle>
                    <DialogDescription>Drag to turn the ball, scroll or pinch to zoom. The holes come from {owner?.firstName ?? 'the bowler'}'s drill sheet.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">Drill sheet</span>
                    <Select value={sheetId} onValueChange={setSheetId}>
                        <SelectTrigger aria-label="Drill sheet" className="w-64"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {sheets.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            <SelectItem value={NONE}>None (a standard grip)</SelectItem>
                        </SelectContent>
                    </Select>
                    <div role="radiogroup" aria-label="Finish" className="ml-auto flex gap-1">
                        {([['Matte', false], ['Polished', true]] as const).map(([label, value]) => (
                            <button key={label} type="button" role="radio" aria-checked={polished === value} onClick={() => setPolished(value)}
                                className={cn('rounded-full border px-3 py-1 text-sm transition-colors',
                                    polished === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div role="group" aria-label="Layout systems on the ball" className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="mr-1 text-gray-600">Show</span>
                    {systemsFor(owner?.usesThumb ?? true, system).map(s => (
                        <button key={s} type="button" aria-pressed={systems.includes(s)} onClick={() => toggle(s)}
                            className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors',
                                systems.includes(s) ? 'border-gray-900 bg-gray-900 text-white' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
                            <span aria-hidden="true" className="size-2.5 rounded-full border border-black/20" style={{ background: SYSTEM_COLORS[s] }} />
                            {LAYOUT_SYSTEM_LABELS[s]}
                        </button>
                    ))}
                </div>
                <dl aria-label="The layout in each system" className="grid gap-x-6 gap-y-1 text-sm sm:grid-flow-col sm:auto-cols-max">
                    {systemsFor(owner?.usesThumb ?? true, system).map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <span aria-hidden="true" className="size-2.5 rounded-full border border-black/20" style={{ background: SYSTEM_COLORS[s] }} />
                            <dt className="text-gray-600">{LAYOUT_SYSTEM_LABELS[s]}</dt>
                            <dd className="font-mono font-semibold text-gray-900">{describeNumbers(s, solved)}</dd>
                        </div>
                    ))}
                </dl>
                <div className="relative h-[min(62vh,560px)] min-h-72 w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-100 to-gray-300">
                    <Suspense fallback={<p className="flex h-full items-center justify-center text-sm text-gray-500">Loading the 3D view…</p>}>
                        <BallScene solved={solved} hand={hand} grip={grip} polished={polished} systems={systems} />
                    </Suspense>
                </div>
                <ul className="grid gap-0.5 text-xs text-gray-500">
                    {grip.notes.map(note => <li key={note}>{note}</li>)}
                    <li>Spans other than center-to-center are drawn edge to edge (facing edges) plus each hole's radius; the sheet's spans aren't changed.</li>
                </ul>
            </DialogContent>
        </Dialog>
    )
}
