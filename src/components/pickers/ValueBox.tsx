import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ValueBoxProps {
    /** Accessible name, e.g. "Bridge: 1/4 inch". */
    label: string
    /** The formatted value, or null when not set. */
    value: ReactNode | null
    onClick: () => void
    selected?: boolean
    readOnly?: boolean
    className?: string
    style?: CSSProperties
    children?: ReactNode
}

/** A tappable measurement on the drill sheet; opens its picker. Dashed when not set. */
export const ValueBox = ({ label, value, onClick, selected, readOnly, className, style, children }: ValueBoxProps) => (
    <button
        type="button"
        aria-label={label}
        disabled={readOnly}
        onClick={onClick}
        style={style}
        className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] bg-white font-mono transition-colors disabled:cursor-default',
            value === null ? 'border-dashed border-slate-300 text-xl text-gray-400' : 'border-slate-300 text-[28px] font-semibold text-primary',
            !readOnly && 'hover:border-primary hover:bg-blue-50/50',
            selected && 'border-2 border-primary ring-4 ring-blue-100',
            className
        )}
    >
        {value ?? '—'}
        {children}
    </button>
)
