import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { GripLineDto, GripManufacturer } from '../../../../shared/api/grips'
import { useGripCatalog } from '../../../hooks/useGripCatalog'
import { useLocationGripStock } from '../../../hooks/useLocationGripStock'
import { FINE_BITS } from '../../../utils/DrillBits'
import { format64 } from '../../../utils/Fractions'
import type { Insert } from './editorTypes'
import type { InsertPickerRequest } from './pickers'

interface InsertPickerDialogProps {
    request: InsertPickerRequest
    onClose: () => void
}

const MANUFACTURERS: { key: GripManufacturer; label: string }[] = [
    { key: 'VISE', label: 'VISE' },
    { key: 'TURBO', label: 'Turbo' },
    { key: 'JOPO', label: 'JoPo' }
]

/** Finger insert O.D.s for an insert entered by hand. */
const OTHER_ODS = [56, 62, 66]

const choice = 'rounded-lg border transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-white hover:bg-muted'

/**
 * Picks a finger insert: manufacturer, line, size, and how it installs. The
 * location's stock is offered first ("show all" for special orders); the O.D.
 * comes from the insert. "Other" enters one that isn't in the catalog.
 */
export const InsertPickerDialog = ({ request, onClose }: InsertPickerDialogProps) => {
    const catalog = useGripCatalog()
    const stock = useLocationGripStock(request.locationId)
    const current = request.value

    const fingerLines = useMemo(() => catalog.lines.filter(line => line.kind === 'FINGER_INSERT'), [catalog.lines])
    const currentLine = fingerLines.find(line => line.sizes.some(size => size.id === current?.gripSizeId))

    const [mode, setMode] = useState<'catalog' | 'other'>(current && !current.gripSizeId ? 'other' : 'catalog')
    const [showAll, setShowAll] = useState(false)
    const [manufacturer, setManufacturer] = useState<GripManufacturer | null>(currentLine?.manufacturer ?? null)
    const [lineId, setLineId] = useState<string | null>(currentLine?.id ?? null)
    const [sizeId, setSizeId] = useState<string | null>(current?.gripSizeId ?? null)
    const [installStyle, setInstallStyle] = useState<string | null>(current?.installStyle ?? null)
    const [od64, setOd64] = useState<number | null>(current?.od64 ?? null)
    // "Other"
    const [otherMaker, setOtherMaker] = useState(current && !current.gripSizeId ? current.manufacturer : '')
    const [otherLine, setOtherLine] = useState(current && !current.gripSizeId ? current.line : '')
    const [otherSize, setOtherSize] = useState<number | null>(current && !current.gripSizeId ? current.size64 ?? null : null)

    // A location that hasn't said what it carries sees the whole catalog.
    const noStock = !stock.loading && stock.selected.size === 0
    const all = showAll || noStock
    const carried = (line: GripLineDto) => line.sizes.some(size => stock.selected.has(size.id))
    const lines = fingerLines.filter(line => all || carried(line) || line.id === currentLine?.id)
    const makers = MANUFACTURERS.filter(m => lines.some(line => line.manufacturer === m.key))
    const activeMaker = manufacturer && makers.some(m => m.key === manufacturer) ? manufacturer : makers[0]?.key ?? null
    const line = lines.find(l => l.id === lineId && l.manufacturer === activeMaker) ?? null
    const sizes = line ? line.sizes.filter(size => all || stock.selected.has(size.id) || size.id === current?.gripSizeId) : []
    const size = sizes.find(s => s.id === sizeId) ?? null
    const styles = line?.installStyles ?? []
    const odChoices = size?.od64Choices ?? []
    const chosenOd = od64 && odChoices.includes(od64) ? od64 : odChoices[0] ?? null
    const chosenStyle = styles.length === 1 ? styles[0] : installStyle && styles.includes(installStyle) ? installStyle : null

    const catalogInsert: Insert | null = line && size && chosenOd && (styles.length <= 1 || chosenStyle) ? {
        gripSizeId: size.id,
        manufacturer: line.manufacturer,
        line: line.name,
        size64: size.size64,
        label: size.label,
        od64: chosenOd,
        installStyle: chosenStyle
    } : null
    const otherInsert: Insert | null = otherMaker.trim() && od64 && OTHER_ODS.includes(od64) ? {
        gripSizeId: null,
        manufacturer: otherMaker.trim(),
        line: otherLine.trim(),
        size64: otherSize,
        label: null,
        od64,
        installStyle: null
    } : null
    const result = mode === 'catalog' ? catalogInsert : otherInsert

    const set = (insert: Insert | null) => {
        request.onSet(insert)
        onClose()
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{request.title}</DialogTitle>
                    <DialogDescription>{request.description ?? 'The insert sets the hole\'s O.D.'}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div role="tablist" aria-label="Insert source" className="inline-flex rounded-lg bg-gray-100 p-1">
                        {(['catalog', 'other'] as const).map(m => (
                            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); if (m === 'other') setOd64(od64 && OTHER_ODS.includes(od64) ? od64 : 62) }}
                                className={cn('min-h-9 rounded-md px-4 text-sm font-medium', mode === m ? 'bg-white shadow-sm' : 'text-gray-600')}>
                                {m === 'catalog' ? 'Catalog' : 'Other'}
                            </button>
                        ))}
                    </div>
                    {mode === 'catalog' && !noStock && (
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <Switch checked={showAll} onCheckedChange={setShowAll} /> Show all, not just what we carry
                        </label>
                    )}
                </div>

                {mode === 'catalog' && (catalog.loading || stock.loading) && <p className="py-6 text-center text-gray-500">Loading the catalog…</p>}
                {mode === 'catalog' && catalog.error && <p role="alert" className="text-sm text-red-700">{catalog.error}</p>}
                {mode === 'catalog' && noStock && request.locationId && (
                    <p className="text-xs text-gray-500">This location hasn't set what it carries yet, so the whole catalog is shown.</p>
                )}

                {mode === 'catalog' && !catalog.loading && !stock.loading && (
                    <div className="grid gap-4">
                        <div role="tablist" aria-label="Manufacturer" className="inline-flex w-fit rounded-lg bg-gray-100 p-1">
                            {makers.map(m => (
                                <button key={m.key} type="button" role="tab" aria-selected={activeMaker === m.key}
                                    onClick={() => { setManufacturer(m.key); setLineId(null); setSizeId(null) }}
                                    className={cn('min-h-9 rounded-md px-4 text-sm font-medium', activeMaker === m.key ? 'bg-white shadow-sm' : 'text-gray-600')}>
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <div role="radiogroup" aria-label="Line" className="grid gap-1.5 sm:grid-cols-2">
                            {lines.filter(l => l.manufacturer === activeMaker).map(l => (
                                <button key={l.id} type="button" role="radio" aria-checked={line?.id === l.id}
                                    onClick={() => { setLineId(l.id); setSizeId(null); setInstallStyle(null) }}
                                    className={cn(choice, 'px-3 py-2 text-left', line?.id === l.id ? 'border-primary bg-blue-50' : unchosen)}>
                                    <span className="block text-sm font-medium">{l.name}</span>
                                    <span className="block text-xs text-gray-500">{l.installStyles.length > 1 ? l.installStyles.join(' / ') : `O.D. ${[...new Set(l.sizes.map(s => s.od64Choices[0]))].map(format64).join(' · ')}`}</span>
                                </button>
                            ))}
                        </div>

                        {line && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-600">Size</span>
                                <div role="radiogroup" aria-label="Size" className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-1.5">
                                    {sizes.map(s => {
                                        const fraction = format64(s.size64)
                                        return (
                                            <button key={s.id} type="button" role="radio" aria-checked={size?.id === s.id}
                                                onClick={() => { setSizeId(s.id); setOd64(null) }}
                                                className={cn(choice, 'flex flex-col items-center px-1 py-1 font-mono text-xs leading-tight', size?.id === s.id ? chosen : unchosen)}>
                                                <span className="font-semibold">{s.label}</span>
                                                {s.label !== fraction && <span className={size?.id === s.id ? 'opacity-80' : 'text-gray-500'}>{fraction}</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {line && styles.length > 1 && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-600">Installs as</span>
                                <div role="radiogroup" aria-label="Install style" className="flex flex-wrap gap-1.5">
                                    {styles.map(style => (
                                        <button key={style} type="button" role="radio" aria-checked={chosenStyle === style} onClick={() => setInstallStyle(style)}
                                            className={cn(choice, 'min-h-10 px-3 text-sm', chosenStyle === style ? chosen : unchosen)}>
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {size && (
                            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm">
                                O.D. <span className="font-mono font-semibold text-primary">{chosenOd ? format64(chosenOd) : '—'}″</span>
                                <span className="text-gray-600"> · hole size {format64(size.size64)}″</span>
                                {odChoices.length > 1 && (
                                    <span className="ml-2 inline-flex gap-1">
                                        {odChoices.map(od => (
                                            <button key={od} type="button" aria-pressed={chosenOd === od} onClick={() => setOd64(od)}
                                                className={cn(choice, 'px-2 font-mono text-xs', chosenOd === od ? chosen : unchosen)}>{format64(od)}</button>
                                        ))}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                )}

                {mode === 'other' && (
                    <FieldGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="other-maker">Manufacturer</FieldLabel>
                                <Input id="other-maker" value={otherMaker} onChange={e => setOtherMaker(e.target.value)} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="other-line">Insert</FieldLabel>
                                <Input id="other-line" placeholder="e.g. Pro Firm" value={otherLine} onChange={e => setOtherLine(e.target.value)} />
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel>O.D.</FieldLabel>
                            <div role="radiogroup" aria-label="O.D." className="flex gap-1.5">
                                {OTHER_ODS.map(od => (
                                    <button key={od} type="button" role="radio" aria-checked={od64 === od} onClick={() => setOd64(od)}
                                        className={cn(choice, 'min-h-10 px-4 font-mono text-sm', od64 === od ? chosen : unchosen)}>{format64(od)}″</button>
                                ))}
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel>Hole size</FieldLabel>
                            <div role="radiogroup" aria-label="Hole size" className="grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-1.5">
                                {FINE_BITS.filter(bit => bit <= 60).map(bit => (
                                    <button key={bit} type="button" role="radio" aria-checked={otherSize === bit} onClick={() => setOtherSize(bit)}
                                        className={cn(choice, 'h-9 font-mono text-xs', otherSize === bit ? chosen : unchosen)}>{format64(bit)}</button>
                                ))}
                            </div>
                        </Field>
                    </FieldGroup>
                )}

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => set(null)}>No insert</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={!result} onClick={() => set(result)}>
                            {!result && mode === 'catalog' && line && size && styles.length > 1 ? 'Pick how it installs' : 'Set insert'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
