import { useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CatalogBallDto } from '../../../shared/api/balls'
import { useCatalogSearch } from '../../hooks/useCatalogSearch'
import { describeConstruction } from '../../utils/BallFormat'

interface CatalogBallPickerProps {
    selected: CatalogBallDto | null
    onSelect: (ball: CatalogBallDto) => void
}

const ALL = 'ALL'

/** Find a ball in the BowlerIQ catalog by brand, name or color (each colorway is its own ball), or one the shop typed in before. */
export const CatalogBallPicker = ({ selected, onSelect }: CatalogBallPickerProps) => {
    const [query, setQuery] = useState('')
    const [brandId, setBrandId] = useState<string | null>(null)
    const search = useCatalogSearch(query, brandId)

    return (
        <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <Input aria-label="Search the ball catalog" placeholder="Search: phaze purple, jackal…" value={query} autoFocus
                        className="pl-8" onChange={event => setQuery(event.target.value)} />
                </div>
                <Select value={brandId ?? ALL} onValueChange={v => setBrandId(v === ALL ? null : v)}>
                    <SelectTrigger aria-label="Brand" className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All brands</SelectItem>
                        {search.brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {search.error && <p role="alert" className="text-sm text-red-700">{search.error}</p>}
            <ul aria-label="Catalog balls" className="grid max-h-72 gap-1 overflow-y-auto">
                {search.results.map(ball => (
                    <li key={ball.id}>
                        <button type="button" aria-pressed={selected?.id === ball.id} onClick={() => onSelect(ball)}
                            className={cn('flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                                selected?.id === ball.id ? 'border-primary bg-blue-50' : 'border-border bg-white hover:bg-muted')}>
                            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                                {ball.imageUrl ? <img src={ball.imageUrl} alt="" className="size-full object-cover" loading="lazy" /> : <span className="text-xs text-gray-400">{ball.brandName.slice(0, 2)}</span>}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5 font-medium text-gray-900">
                                    {ball.brandName} {ball.name}
                                    {ball.status === 'retired' && <Badge variant="outline" className="font-normal">Retired</Badge>}
                                    {ball.source === 'shop' && <Badge variant="secondary" className="font-normal">Your shop's entry</Badge>}
                                </span>
                                <span className="block truncate text-xs text-gray-500">{[ball.color, describeConstruction(ball)].filter(Boolean).join(' · ')}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
            {!search.loading && search.results.length === 0 && (query.trim() || brandId) && (
                <p className="text-sm text-gray-500">No balls match. Try the brand or part of the name.</p>
            )}
            {search.loading && <p className="text-xs text-gray-500">Searching…</p>}
        </div>
    )
}
