import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GripKind, GripLineDto, GripManufacturer } from '../../../../shared/api/grips'
import { useGripCatalog } from '../../../hooks/useGripCatalog'
import { useLocationGripStock } from '../../../hooks/useLocationGripStock'
import type { Location } from '../../../types'
import { GripLineRow } from './GripLineRow'

interface LocationGripStockProps {
    location: Location
    /** Shown as a back link when the screen stands alone. */
    onBack?: () => void
}

const MANUFACTURERS: { key: GripManufacturer; label: string }[] = [
    { key: 'VISE', label: 'VISE' },
    { key: 'TURBO', label: 'Turbo' },
    { key: 'JOPO', label: 'JoPo' }
]

const KINDS: { key: GripKind; label: string }[] = [
    { key: 'FINGER_INSERT', label: 'Finger inserts' },
    { key: 'FINGER_SLUG', label: 'Finger slugs' },
    { key: 'THUMB_INSERT', label: 'Thumb inserts' },
    { key: 'THUMB_SLUG', label: 'Thumb slugs' },
    { key: 'INTERCHANGEABLE_THUMB', label: 'Interchangeable thumb' }
]

/**
 * What a location carries: the manufacturer lines and sizes it stocks, from
 * the shared grip catalog. The drill sheet's insert picker offers these first.
 * Colors aren't tracked here; they're picked on the work order.
 */
export const LocationGripStock = ({ location, onBack }: LocationGripStockProps) => {
    const catalog = useGripCatalog()
    const stock = useLocationGripStock(location.id)
    const [manufacturer, setManufacturer] = useState<GripManufacturer>('VISE')

    const carriedIn = (lines: GripLineDto[]) => lines.reduce((count, line) =>
        count + line.sizes.filter(size => stock.selected.has(size.id)).length, 0)
    const linesCarried = catalog.lines.filter(line => line.sizes.some(size => stock.selected.has(size.id))).length
    const shown = catalog.lines.filter(line => line.manufacturer === manufacturer)

    const loading = catalog.loading || stock.loading
    const error = catalog.error ?? stock.error

    return (
        <div className="space-y-5">
            {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft data-icon="inline-start" /> Locations
                </Button>
            )}

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">What we carry</h2>
                    <p className="text-gray-600">
                        {location.name} · {stock.selected.size} {stock.selected.size === 1 ? 'size' : 'sizes'} in {linesCarried} {linesCarried === 1 ? 'line' : 'lines'}.
                        Drill sheets at this location offer these first.
                    </p>
                </div>
                <div className="flex gap-2">
                    {stock.dirty && <Button variant="ghost" disabled={stock.saving} onClick={stock.discard}>Discard</Button>}
                    <Button disabled={!stock.dirty || stock.saving} onClick={() => stock.save()}>
                        {stock.saving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </div>

            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>}

            {loading ? (
                <p className="py-8 text-center text-gray-500">Loading the catalog…</p>
            ) : (
                <>
                    <div role="tablist" aria-label="Manufacturer" className="inline-flex rounded-lg bg-gray-100 p-1">
                        {MANUFACTURERS.map(m => {
                            const count = carriedIn(catalog.lines.filter(line => line.manufacturer === m.key))
                            return (
                                <button key={m.key} type="button" role="tab" aria-selected={manufacturer === m.key}
                                    onClick={() => setManufacturer(m.key)}
                                    className={cn('min-h-9 rounded-md px-4 text-sm font-medium transition-colors',
                                        manufacturer === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900')}>
                                    {m.label}{count > 0 && <span className="ml-1.5 text-primary">{count}</span>}
                                </button>
                            )
                        })}
                    </div>

                    {KINDS.map(kind => {
                        const lines = shown.filter(line => line.kind === kind.key)
                        if (lines.length === 0) return null
                        return (
                            <section key={kind.key} aria-label={kind.label} className="space-y-2">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{kind.label}</h2>
                                <ul className="space-y-2">
                                    {lines.map(line => (
                                        <GripLineRow key={line.id} line={line} selected={stock.selected} onToggle={stock.toggle} />
                                    ))}
                                </ul>
                            </section>
                        )
                    })}
                </>
            )}
        </div>
    )
}
