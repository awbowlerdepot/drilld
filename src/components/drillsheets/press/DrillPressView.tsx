import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DrillSheetSpec } from '../../../../shared/api/drillSheetSpec'
import type { DrillSheetDto } from '../../../../shared/api/drillSheets'
import type { Customer } from '../../../types'
import { buildDrillPlan, describeBit } from '../../../utils/DrillPlan'
import { toReadout, type PressReadout } from '../../../utils/DrillReadouts'
import { format64, formatDecimal } from '../../../utils/Fractions'
import { PressHoleNav } from './PressHoleNav'

interface DrillPressViewProps {
    sheet: DrillSheetDto
    spec: DrillSheetSpec
    customer: Customer
    press: PressReadout
    onExit: () => void
}

const signed = (value: number) => formatDecimal(value, { signed: true })

/**
 * The tablet view at the drill press (canvas design F): read-only, dark, big
 * type, one hole at a time. Each step shows its bit and where the readout
 * should be, signed for this press. Progress is kept on screen until work
 * orders record it.
 */
export const DrillPressView = ({ sheet, spec, customer, press, onExit }: DrillPressViewProps) => {
    const holes = buildDrillPlan(spec, customer.dominantHand)
    const [current, setCurrent] = useState(0)
    const [done, setDone] = useState<Set<string>>(new Set())
    const revision = sheet.currentRevision

    const hole = holes[current]
    const nextStep = hole?.steps.find(step => !done.has(step.id))
    const center = hole ? toReadout(hole.center, press) : null
    const readoutLabel = `${press.verticalReadout === 'UP_POSITIVE' ? 'up' : 'down'} +, ${press.horizontalReadout === 'RIGHT_POSITIVE' ? 'right' : 'left'} +`

    const markDone = () => {
        if (!nextStep) return
        const next = new Set(done).add(nextStep.id)
        setDone(next)
        if (hole.steps.every(step => next.has(step.id))) {
            const following = holes.findIndex((h, i) => i > current && h.steps.some(step => !next.has(step.id)))
            if (following >= 0) setCurrent(following)
        }
    }

    const undo = () => {
        const last = [...(hole?.steps ?? [])].reverse().find(step => done.has(step.id))
        if (!last) return
        const next = new Set(done)
        next.delete(last.id)
        setDone(next)
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col gap-4 overflow-y-auto bg-[#0B1220] p-5 font-sans text-[#E8EEF7] sm:p-6">
            <header className="flex flex-wrap items-center gap-4">
                <button type="button" onClick={onExit}
                    className="min-h-12 rounded-xl border-2 border-[#334766] px-4 text-base font-semibold hover:bg-[#111A2E]">
                    ‹ Editor
                </button>
                <div className="flex min-w-0 flex-col">
                    <span className="text-2xl font-bold">{customer.firstName} {customer.lastName} · {sheet.name}</span>
                    <span className="text-base text-[#A7B4C8]">
                        {customer.dominantHand === 'RIGHT' ? 'Right' : 'Left'}-handed · readout {readoutLabel}
                    </span>
                </div>
                {revision && (
                    <span className={cn('ml-auto rounded-full px-3.5 py-2 text-[15px] font-semibold',
                        revision.approvedAt ? 'bg-[#10331F] text-[#86EFAC]' : 'bg-[#3A2A0B] text-[#FCD34D]')}>
                        Revision {revision.version} · {revision.approvedAt ? 'approved' : 'draft'}
                    </span>
                )}
            </header>

            {holes.length === 0 ? (
                <p className="py-16 text-center text-xl text-[#A7B4C8]">This sheet has no hole sizes yet.</p>
            ) : (
                <div className="flex flex-1 flex-col gap-4 lg:flex-row">
                    <div className="lg:w-60 lg:shrink-0">
                        <PressHoleNav holes={holes} current={current} done={done} onSelect={setCurrent} />
                    </div>

                    <main className="flex min-w-0 flex-1 flex-col gap-4">
                        <section aria-label={hole.name} className="flex flex-col gap-5 rounded-2xl border-2 border-[#1F2A40] bg-[#111A2E] p-5 sm:p-6">
                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                <h1 className="text-3xl font-bold">{hole.name}</h1>
                                {hole.grip && <span className="text-lg text-[#A7B4C8]">{hole.grip}</span>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl bg-[#0B1220] p-4">
                                    <span className="text-base text-[#A7B4C8]">{nextStep ? `Now: ${nextStep.title}` : 'Hole done'}</span>
                                    <span className="block font-mono text-6xl font-bold leading-tight text-[#60A5FA]">
                                        {nextStep ? `${format64(nextStep.bit64)}″` : '✓'}
                                    </span>
                                    {nextStep?.depth32 && <span className="text-lg text-[#C7D6F0]">{describeBit(nextStep)}</span>}
                                    {nextStep?.note && <span className="block text-base text-[#C7D6F0]">{nextStep.note}</span>}
                                </div>
                                <div className="rounded-xl bg-[#0B1220] p-4">
                                    <span className="text-base text-[#A7B4C8]">Pitch center on the readout</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <span className="flex flex-col">
                                            <span className="text-sm text-[#A7B4C8]">Vertical</span>
                                            <span className="font-mono text-4xl font-bold">{signed(center!.vertical)}</span>
                                        </span>
                                        <span className="flex flex-col">
                                            <span className="text-sm text-[#A7B4C8]">Horizontal</span>
                                            <span className="font-mono text-4xl font-bold">{signed(center!.horizontal)}</span>
                                        </span>
                                    </div>
                                    <span className="text-base text-[#C7D6F0]">{hole.pitch}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-[minmax(6rem,1.2fr)_1fr_1fr_1fr_3rem] gap-2 px-4 text-sm text-[#A7B4C8]">
                                    <span>Step</span><span>Bit</span><span>Vertical</span><span>Horizontal</span><span />
                                </div>
                                <ol aria-label="Steps" className="flex flex-col gap-2">
                                    {hole.steps.map(step => {
                                        const position = toReadout(step.position, press)
                                        const isDone = done.has(step.id)
                                        const isNow = step.id === nextStep?.id
                                        return (
                                            <li key={step.id} aria-current={isNow ? 'step' : undefined}
                                                className={cn('grid min-h-14 grid-cols-[minmax(6rem,1.2fr)_1fr_1fr_1fr_3rem] items-center gap-2 rounded-xl border-2 px-4',
                                                    isNow ? 'border-[#60A5FA] bg-[#13284D] text-white' : 'border-[#1F2A40] bg-[#0B1220]',
                                                    isDone && 'text-[#7C8BA3]')}>
                                                <span className="text-base">{step.title}</span>
                                                <span className="font-mono text-lg font-semibold">{format64(step.bit64)}</span>
                                                <span className="font-mono text-2xl font-bold">{signed(position.vertical)}</span>
                                                <span className="font-mono text-2xl font-bold">{signed(position.horizontal)}</span>
                                                <span className={cn('text-base font-semibold', isDone ? 'text-[#86EFAC]' : 'text-[#60A5FA]')}>
                                                    {isDone ? '✓' : isNow ? 'Now' : ''}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ol>
                            </div>
                        </section>

                        <div className="flex flex-wrap gap-3">
                            <button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)}
                                className="min-h-16 rounded-2xl border-2 border-[#334766] bg-[#111A2E] px-6 text-xl font-semibold disabled:opacity-40">
                                ‹ {holes[current - 1]?.name.split(' · ')[0] ?? 'Back'}
                            </button>
                            <button type="button" onClick={undo} disabled={!hole.steps.some(step => done.has(step.id))}
                                className="min-h-16 rounded-2xl border-2 border-[#334766] bg-[#111A2E] px-6 text-xl font-semibold text-[#FBBF24] disabled:opacity-40">
                                Undo
                            </button>
                            <button type="button" onClick={markDone} disabled={!nextStep}
                                className="ml-auto min-h-16 rounded-2xl bg-[#60A5FA] px-8 text-2xl font-bold text-[#0B1220] disabled:opacity-40">
                                {nextStep ? `${nextStep.title} done ✓` : 'Hole done ✓'}
                            </button>
                        </div>
                    </main>
                </div>
            )}
        </div>
    )
}
