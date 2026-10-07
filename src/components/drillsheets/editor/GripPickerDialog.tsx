import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { GripKind, GripLineDto, GripManufacturer } from '../../../../shared/api/grips'
import { useGripCatalog } from '../../../hooks/useGripCatalog'
import { useLocationGripStock } from '../../../hooks/useLocationGripStock'
import { FINE_BITS, HARDWARE_BITS, LARGE_BITS } from '../../../utils/DrillBits'
import { format64 } from '../../../utils/Fractions'
import type { Insert, ThumbHardware } from './editorTypes'
import type { InsertPickerRequest, ThumbHardwarePickerRequest } from './pickers'

interface GripPickerDialogProps {
    request: InsertPickerRequest | ThumbHardwarePickerRequest
    onClose: () => void
}

type ThumbKind = ThumbHardware['kind']

const MANUFACTURERS: { key: GripManufacturer; label: string }[] = [
    { key: 'VISE', label: 'VISE' },
    { key: 'TURBO', label: 'Turbo' },
    { key: 'JOPO', label: 'JoPo' }
]

const THUMB_KINDS: { key: ThumbKind; label: string }[] = [
    { key: 'THUMB_INSERT', label: 'Thumb inserts' },
    { key: 'THUMB_SLUG', label: 'Slugs and solids' },
    { key: 'INTERCHANGEABLE_THUMB', label: 'Interchangeable' }
]

/** O.D.s offered for a piece entered by hand ("Other"). */
const OTHER_FINGER_ODS = [56, 62, 66]
const OTHER_THUMB_ODS = [...new Set([72, ...LARGE_BITS, ...HARDWARE_BITS.map(bit => bit.size64)])].sort((a, b) => a - b)

const choice = 'rounded-lg border transition-colors'
const chosen = 'border-primary bg-primary text-primary-foreground'
const unchosen = 'border-border bg-white hover:bg-muted'

/**
 * Picks a grip from the catalog: a finger insert, or thumb hardware (thumb
 * insert, slug, interchangeable system). What the location carries comes
 * first ("show all" for special orders). The piece sets the hole's O.D.;
 * "Other" enters one that isn't in the catalog.
 */
export const GripPickerDialog = ({ request, onClose }: GripPickerDialogProps) => {
    const thumb = request.kind === 'thumbHardware'
    const catalog = useGripCatalog()
    const stock = useLocationGripStock(request.locationId)
    const current = request.value

    const kindLines = useMemo(() => catalog.lines.filter(line =>
        thumb ? THUMB_KINDS.some(k => k.key === line.kind) : line.kind === ('FINGER_INSERT' satisfies GripKind)), [catalog.lines, thumb])
    const currentLine = kindLines.find(line => line.sizes.some(size => size.id === current?.gripSizeId))

    const [mode, setMode] = useState<'catalog' | 'other'>(current && !current.gripSizeId ? 'other' : 'catalog')
    const [showAll, setShowAll] = useState(false)
    const [manufacturer, setManufacturer] = useState<GripManufacturer | null>(currentLine?.manufacturer ?? null)
    const [lineId, setLineId] = useState<string | null>(currentLine?.id ?? null)
    const [sizeId, setSizeId] = useState<string | null>(current?.gripSizeId ?? null)
    const [installStyle, setInstallStyle] = useState<string | null>(!thumb && current ? (current as Insert).installStyle ?? null : null)
    const [od64, setOd64] = useState<number | null>(current?.od64 ?? null)
    // "Other"
    const [otherMaker, setOtherMaker] = useState(current && !current.gripSizeId ? current.manufacturer : '')
    const [otherLine, setOtherLine] = useState(current && !current.gripSizeId ? current.line : '')
    const [otherSize, setOtherSize] = useState<number | null>(current && !current.gripSizeId ? current.size64 ?? null : null)
    const [otherKind, setOtherKind] = useState<ThumbKind>(thumb && current ? (current as ThumbHardware).kind : 'THUMB_SLUG')

    // A location that hasn't said what it carries sees the whole catalog.
    const noStock = !stock.loading && stock.selected.size === 0
    const all = showAll || noStock
    const carried = (line: GripLineDto) => line.sizes.some(size => stock.selected.has(size.id))
    const lines = kindLines.filter(line => all || carried(line) || line.id === currentLine?.id)
    const makers = MANUFACTURERS.filter(m => lines.some(line => line.manufacturer === m.key))
    const activeMaker = manufacturer && makers.some(m => m.key === manufacturer) ? manufacturer : makers[0]?.key ?? null
    const line = lines.find(l => l.id === lineId && l.manufacturer === activeMaker) ?? null
    const sizes = line ? line.sizes.filter(size => all || stock.selected.has(size.id) || size.id === current?.gripSizeId) : []
    const size = sizes.find(s => s.id === sizeId) ?? null
    const styles = !thumb && line ? line.installStyles : []
    const odChoices = size?.od64Choices ?? []
    const chosenOd = od64 && odChoices.includes(od64) ? od64 : odChoices[0] ?? null
    const chosenStyle = styles.length === 1 ? styles[0] : installStyle && styles.includes(installStyle) ? installStyle : null
    const otherOds = thumb ? OTHER_THUMB_ODS : OTHER_FINGER_ODS

    const catalogReady = !!(line && size && chosenOd && (styles.length <= 1 || chosenStyle))
    const otherReady = !!(otherMaker.trim() && od64 && otherOds.includes(od64))

    const set = (clear = false) => {
        const ready = mode === 'catalog' ? catalogReady : otherReady
        if (!clear && !ready) return
        const base = mode === 'catalog'
            ? { gripSizeId: size!.id, manufacturer: line!.manufacturer, line: line!.name, size64: size!.size64, label: size!.label, od64: chosenOd! }
            : { gripSizeId: null, manufacturer: otherMaker.trim(), line: otherLine.trim(), size64: otherSize, label: null, od64: od64! }
        if (request.kind === 'insert') {
            request.onSet(clear ? null : { ...base, installStyle: mode === 'catalog' ? chosenStyle : null })
        } else {
            request.onSet(clear ? null : {
                ...base,
                kind: mode === 'catalog' ? line!.kind as ThumbKind : otherKind,
                collar: mode === 'catalog' ? size!.collar : false
            })
        }
        onClose()
    }

    const lineButton = (l: GripLineDto) => (
        <button key={l.id} type="button" role="radio" aria-checked={line?.id === l.id}
            onClick={() => { setLineId(l.id); setSizeId(null); setInstallStyle(null) }}
            className={cn(choice, 'px-3 py-2 text-left', line?.id === l.id ? 'border-primary bg-blue-50' : unchosen)}>
            <span className="block text-sm font-medium">{l.name}</span>
            <span className="block text-xs text-gray-500">
                {l.installStyles.length > 1 && !thumb
                    ? l.installStyles.join(' / ')
                    : `${l.sizes.some(s => s.collar) ? 'Collar bit' : 'O.D.'} ${[...new Set(l.sizes.map(s => s.od64Choices[0]))].map(format64).join(' · ')}`}
            </span>
        </button>
    )

    const makerLines = lines.filter(l => l.manufacturer === activeMaker)

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{request.title}</DialogTitle>
                    <DialogDescription>
                        {request.description ?? (thumb ? 'The hardware sets the thumb hole\'s O.D.' : 'The insert sets the hole\'s O.D.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div role="tablist" aria-label="Source" className="inline-flex rounded-lg bg-gray-100 p-1">
                        {(['catalog', 'other'] as const).map(m => (
                            <button key={m} type="button" role="tab" aria-selected={mode === m}
                                onClick={() => { setMode(m); if (m === 'other' && !(od64 && otherOds.includes(od64))) setOd64(thumb ? 96 : 62) }}
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

                        {thumb ? THUMB_KINDS.map(kind => {
                            const group = makerLines.filter(l => l.kind === kind.key)
                            if (group.length === 0) return null
                            return (
                                <div key={kind.key} className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{kind.label}</span>
                                    <div role="radiogroup" aria-label={kind.label} className="grid gap-1.5 sm:grid-cols-2">{group.map(lineButton)}</div>
                                </div>
                            )
                        }) : (
                            <div role="radiogroup" aria-label="Line" className="grid gap-1.5 sm:grid-cols-2">{makerLines.map(lineButton)}</div>
                        )}

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

                        {styles.length > 1 && (
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
                                {size.collar ? 'Collar bit' : 'O.D.'} <span className="font-mono font-semibold text-primary">{chosenOd ? format64(chosenOd) : '—'}″</span>
                                <span className="text-gray-600">
                                    {line?.kind === 'THUMB_SLUG' || line?.kind === 'INTERCHANGEABLE_THUMB'
                                        ? ' · the thumb hole is drilled into it'
                                        : ` · hole size ${format64(size.size64)}″`}
                                </span>
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
                        {thumb && (
                            <Field>
                                <FieldLabel>Kind</FieldLabel>
                                <div role="radiogroup" aria-label="Kind" className="flex flex-wrap gap-1.5">
                                    {THUMB_KINDS.map(k => (
                                        <button key={k.key} type="button" role="radio" aria-checked={otherKind === k.key} onClick={() => setOtherKind(k.key)}
                                            className={cn(choice, 'min-h-10 px-3 text-sm', otherKind === k.key ? chosen : unchosen)}>{k.label}</button>
                                    ))}
                                </div>
                            </Field>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="other-maker">Manufacturer</FieldLabel>
                                <Input id="other-maker" value={otherMaker} onChange={e => setOtherMaker(e.target.value)} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="other-line">{thumb ? 'Product' : 'Insert'}</FieldLabel>
                                <Input id="other-line" value={otherLine} onChange={e => setOtherLine(e.target.value)} />
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel>O.D.</FieldLabel>
                            <div role="radiogroup" aria-label="O.D." className="flex flex-wrap gap-1.5">
                                {otherOds.map(od => (
                                    <button key={od} type="button" role="radio" aria-checked={od64 === od} onClick={() => setOd64(od)}
                                        className={cn(choice, 'min-h-10 px-3 font-mono text-sm', od64 === od ? chosen : unchosen)}>{format64(od)}″</button>
                                ))}
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel>{thumb ? 'Size' : 'Hole size'}</FieldLabel>
                            <div role="radiogroup" aria-label="Size" className="grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-1.5">
                                {(thumb ? [...FINE_BITS.filter(bit => bit >= 48), ...LARGE_BITS] : FINE_BITS.filter(bit => bit <= 60)).map(bit => (
                                    <button key={bit} type="button" role="radio" aria-checked={otherSize === bit} onClick={() => setOtherSize(bit)}
                                        className={cn(choice, 'h-9 font-mono text-xs', otherSize === bit ? chosen : unchosen)}>{format64(bit)}</button>
                                ))}
                            </div>
                        </Field>
                    </FieldGroup>
                )}

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive" onClick={() => set(true)}>{thumb ? 'No hardware' : 'No insert'}</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={mode === 'catalog' ? !catalogReady : !otherReady} onClick={() => set()}>
                            {mode === 'catalog' && line && size && styles.length > 1 && !chosenStyle ? 'Pick how it installs' : thumb ? 'Set hardware' : 'Set insert'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
