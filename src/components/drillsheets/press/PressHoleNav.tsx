import { cn } from '@/lib/utils'
import type { DrillHole } from '../../../utils/DrillPlan'
import { format64 } from '../../../utils/Fractions'

interface PressHoleNavProps {
    holes: DrillHole[]
    current: number
    done: Set<string>
    onSelect: (index: number) => void
}

/** The holes to drill, with progress; tap one to work on it. */
export const PressHoleNav = ({ holes, current, done, onSelect }: PressHoleNavProps) => (
    <nav aria-label="Holes" className="flex flex-col gap-2.5">
        {holes.map((hole, index) => {
            const finished = hole.steps.every(step => done.has(step.id))
            const count = hole.steps.filter(step => done.has(step.id)).length
            return (
                <button key={hole.key} type="button" aria-current={index === current ? 'step' : undefined} onClick={() => onSelect(index)}
                    className={cn('min-h-20 rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                        index === current ? 'border-[#60A5FA] bg-[#13284D] text-white' : 'border-[#1F2A40] bg-[#111A2E] text-[#E8EEF7] hover:border-[#334766]')}>
                    <span className="flex items-center justify-between gap-2 text-lg font-semibold">
                        {hole.name}
                        <span className={cn('text-base', finished ? 'text-[#86EFAC]' : index === current ? 'text-[#60A5FA]' : 'text-[#A7B4C8]')}>
                            {finished ? '✓ Done' : index === current ? 'Now' : `${count}/${hole.steps.length}`}
                        </span>
                    </span>
                    <span className="block font-mono text-base text-[#A7B4C8]">
                        {hole.steps.flatMap(step => (step.bit64 ? [format64(step.bit64)] : [])).filter((bit, i, all) => all.indexOf(bit) === i).join(' · ')}
                    </span>
                </button>
            )
        })}
    </nav>
)
