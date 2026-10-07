import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { format32, format64 } from '../../../utils/Fractions'
import type { Vacu } from './editorTypes'
import { standardVacu, VACU_DEPTHS, vacuBits } from './insertEdits'

interface VacuControlProps {
    /** The insert's O.D., which the vacu bit is measured from. */
    od64: number
    vacu: Vacu | null | undefined
    onChange: (vacu: Vacu | null) => void
    readOnly: boolean
    id: string
}

/**
 * Vacu for a finger insert hole: the top of the hole drilled with a different
 * bit than the O.D. Standard is O.D. + 1/16" at 1" deep; the bit can be one
 * under the O.D. up to 1/16" over, and the depth 1/2"–1-1/2" for a performance fit.
 */
export const VacuControl = ({ od64, vacu, onChange, readOnly, id }: VacuControlProps) => {
    const standard = standardVacu(od64)
    return (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3">
                <label htmlFor={id} className="flex flex-col">
                    <span className="text-sm font-semibold">Vacu</span>
                    <span className="text-xs text-gray-600">
                        {vacu ? `Top ${format32(vacu.depth32)}″ drilled ${format64(vacu.bit64)}″` : `Standard: ${format64(standard.bit64)}″, 1″ deep`}
                    </span>
                </label>
                <Switch id={id} disabled={readOnly} checked={!!vacu} onCheckedChange={on => onChange(on ? standard : null)} />
            </div>
            {vacu && (
                <div className="grid gap-2">
                    <div role="radiogroup" aria-label="Vacu bit" className="grid grid-cols-6 gap-1">
                        {vacuBits(od64).map(bit => (
                            <button key={bit} type="button" role="radio" aria-checked={vacu.bit64 === bit} disabled={readOnly}
                                onClick={() => onChange({ ...vacu, bit64: bit })}
                                className={cn('flex h-10 flex-col items-center justify-center rounded-md border font-mono text-[11px] leading-tight',
                                    vacu.bit64 === bit ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                                {format64(bit)}
                                {bit === standard.bit64 && <span className="font-sans text-[10px] opacity-80">std</span>}
                                {bit === od64 && <span className="font-sans text-[10px] opacity-80">O.D.</span>}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-600">Depth</span>
                        <Select disabled={readOnly} value={String(vacu.depth32)} onValueChange={value => onChange({ ...vacu, depth32: Number(value) })}>
                            <SelectTrigger aria-label="Vacu depth" className="w-32 font-mono"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {VACU_DEPTHS.map(depth => (
                                    <SelectItem key={depth} value={String(depth)} className="font-mono">
                                        {format32(depth)}″{depth === 32 ? ' (std)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )
}
