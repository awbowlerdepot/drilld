import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GripLineDto } from '../../../../shared/api/grips'
import { format64 } from '../../../utils/Fractions'

interface GripLineRowProps {
    line: GripLineDto
    selected: Set<string>
    onToggle: (sizeIds: string[], on: boolean) => void
}

/** "31/32 · 1-1/32" — the O.D.s a line's sizes are drilled for. */
const odSummary = (line: GripLineDto) =>
    [...new Set(line.sizes.map(size => size.od64Choices[0]))].sort((a, b) => a - b).map(format64).join(' · ')

/**
 * One manufacturer line: a checkbox for the whole line (checked, unchecked, or
 * partly when only some sizes are carried), and its sizes on demand.
 */
export const GripLineRow = ({ line, selected, onToggle }: GripLineRowProps) => {
    const [open, setOpen] = useState(false)
    const checkbox = useRef<HTMLInputElement>(null)
    const sizeIds = line.sizes.map(size => size.id)
    const carried = sizeIds.filter(id => selected.has(id)).length
    const all = carried === sizeIds.length && sizeIds.length > 0
    const some = carried > 0 && !all

    useEffect(() => {
        if (checkbox.current) checkbox.current.indeterminate = some
    }, [some])

    const sizesId = `grip-sizes-${line.id}`
    const hasCollar = line.sizes.some(size => size.collar)

    return (
        <li className="rounded-lg border border-border bg-white">
            <div className="flex items-center gap-3 px-3 py-2.5">
                <input ref={checkbox} type="checkbox" checked={all} aria-label={`Carry ${line.name}`}
                    className="size-5 shrink-0 accent-primary"
                    onChange={() => onToggle(sizeIds, !all)} />
                <button type="button" aria-expanded={open} aria-controls={sizesId} onClick={() => setOpen(!open)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900">{line.name}</span>
                        <span className="block text-xs text-gray-500">
                            {line.installStyles.length > 1 ? `${line.installStyles.join(' / ')} · ` : ''}
                            {hasCollar ? 'collar bit ' : 'O.D. '}{odSummary(line)}
                        </span>
                    </span>
                    <span className={cn('whitespace-nowrap text-sm', carried ? 'font-medium text-primary' : 'text-gray-500')}>
                        {carried} of {sizeIds.length}
                    </span>
                    <ChevronDown className={cn('size-4 shrink-0 text-gray-500 transition-transform', open && 'rotate-180')} />
                </button>
            </div>

            {open && (
                <div id={sizesId} className="border-t border-border px-3 py-3">
                    <div className="mb-2 flex gap-3 text-xs">
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => onToggle(sizeIds, true)}>All sizes</button>
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => onToggle(sizeIds, false)}>None</button>
                    </div>
                    <div role="group" aria-label={`${line.name} sizes`} className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5">
                        {line.sizes.map(size => {
                            const on = selected.has(size.id)
                            const fraction = format64(size.size64)
                            return (
                                <button key={size.id} type="button" aria-pressed={on} onClick={() => onToggle([size.id], !on)}
                                    title={`O.D. ${size.od64Choices.map(format64).join(' or ')}${size.collar ? ' (collar bit)' : ''}`}
                                    className={cn('flex flex-col items-center rounded-md border px-1 py-1 font-mono text-xs leading-tight transition-colors',
                                        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
                                    <span className="font-semibold">{size.label}</span>
                                    {size.label !== fraction && <span className={on ? 'opacity-80' : 'text-gray-500'}>{fraction}</span>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </li>
    )
}
