import { cn } from '@/lib/utils'
import { format64 } from '../../../utils/Fractions'

interface HalfProps {
    label: string
    value: number | null | undefined
    onClick: () => void
}

interface HoleCircleProps {
    left: number
    top: number
    /** The O.D. (outer hole for an insert or slug). */
    upper: HalfProps
    /** The hole, or insert, size. */
    lower: HalfProps
    name: string
    readOnly: boolean
}

/** A hole drawn as a circle, each half a tappable bit size. */
export const HoleCircle = ({ left, top, upper, lower, name, readOnly }: HoleCircleProps) => {
    const half = (part: HalfProps, isUpper: boolean) => (
        <button type="button" disabled={readOnly} aria-label={`${name} ${part.label}`} onClick={part.onClick}
            className={cn('flex flex-1 flex-col items-center hover:bg-blue-50/60 disabled:hover:bg-transparent',
                isUpper ? 'justify-end border-b-2 border-gray-800 pb-0.5' : 'justify-start pt-0.5')}>
            {!isUpper && <span className="text-xs text-gray-700">{part.label}</span>}
            <span className={cn('font-mono text-[26px] font-semibold', part.value ? 'text-primary' : 'text-gray-300')}>
                {part.value ? format64(part.value) : '—'}
            </span>
            {isUpper && <span className="text-xs text-gray-700">{part.label}</span>}
        </button>
    )
    return (
        <div className="absolute flex size-[152px] flex-col overflow-hidden rounded-full border-2 border-gray-800 bg-white" style={{ left, top }}>
            {half(upper, true)}
            {half(lower, false)}
        </div>
    )
}
