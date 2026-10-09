import { cn } from '@/lib/utils'

interface DetailRowProps {
    label: string
    /** The formatted value, or null when not set. */
    value: string | null
    hint?: string
    onClick: () => void
    readOnly: boolean
    /** Label above the value, for narrow tiles. */
    stacked?: boolean
}

/** A labelled, tappable value in a detail card. */
export const DetailRow = ({ label, value, hint, onClick, readOnly, stacked }: DetailRowProps) => (
    <button type="button" disabled={readOnly} onClick={onClick} aria-label={`${label}: ${value ?? 'not set'}`}
        className={cn('flex min-h-11 rounded-lg border border-border bg-white px-3 text-left text-sm text-gray-700 hover:border-primary disabled:hover:border-border',
            stacked ? 'flex-col items-start justify-center gap-0.5 py-2' : 'items-center justify-between gap-3')}>
        <span className="flex flex-col">
            {label}
            {hint && <span className="text-xs text-gray-500">{hint}</span>}
        </span>
        <span className={cn(value ? 'font-mono text-[17px] font-semibold text-primary' : 'text-sm text-gray-400')}>
            {value ?? 'Not set'}
        </span>
    </button>
)
