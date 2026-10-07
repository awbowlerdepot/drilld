import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { autoClt } from '../../../utils/Clt'
import { format32 } from '../../../utils/Fractions'
import { usePicker } from './pickers'
import { SPAN_TYPES, fingerName, spanKey, type Finger, type SheetEditProps } from './editorTypes'

interface FitPanelProps extends SheetEditProps {
    /** Company setting drillSheets.enableClt. */
    showClt: boolean
}

const FINGERS: Finger[] = ['middle', 'ring']

/** Every span type for both spans, Pro Fit, and (when enabled) CLT with its Auto-CLT suggestion. */
export const FitPanel = ({ spec, edit, readOnly, hand, showClt }: FitPanelProps) => {
    const open = usePicker()
    const clt = spec.fitting.cltDegrees
    const suggestion = showClt && clt != null ? autoClt(clt, hand) : null
    const suggestionApplied = suggestion
        && spec.holes.middle.pitch.lateral32 === suggestion.middleLateral32
        && spec.holes.ring.pitch.lateral32 === suggestion.ringLateral32

    return (
        <article aria-label="Fit" className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-5">
            <header>
                <h2 className="text-[17px] font-semibold">Fit</h2>
                <p className="text-sm text-gray-600">Each span type is measured on its own, never converted.</p>
            </header>

            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="text-left text-gray-500">
                        <th className="px-2.5 py-1.5 font-medium">Span</th>
                        {FINGERS.map(finger => <th key={finger} className="px-2.5 py-1.5 font-medium">Thumb–{fingerName(finger).toLowerCase()}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {SPAN_TYPES.map(type => (
                        <tr key={type.key} className="border-t border-gray-100">
                            <th scope="row" className="px-2.5 text-left font-medium text-gray-700">
                                {type.label}
                                <span className="block text-xs font-normal text-gray-500">{type.description}</span>
                            </th>
                            {FINGERS.map(finger => {
                                const value = spec.spans[spanKey(finger)][type.key]
                                return (
                                    <td key={finger}>
                                        <button type="button" disabled={readOnly}
                                            aria-label={`${type.label} span, thumb to ${fingerName(finger).toLowerCase()}`}
                                            className={cn('min-h-11 w-full px-2.5 text-left font-mono text-base hover:bg-blue-50/60 disabled:hover:bg-transparent',
                                                value ? 'font-semibold text-primary' : 'text-gray-400')}
                                            onClick={() => open({
                                                kind: 'length32', title: `${type.label} span, thumb to ${fingerName(finger).toLowerCase()}`,
                                                description: type.description, wholes: [2, 3, 4, 5, 6], value: value ?? null,
                                                onSet: next => edit(draft => { draft.spans[spanKey(finger)][type.key] = next })
                                            })}>
                                            {value ? format32(value) : '—'}
                                        </button>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
                <label htmlFor="pro-fit" className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">Pro fit</span>
                    <span className="text-[13px] text-gray-600">Breaks the norms on purpose: no range warnings or suggestions</span>
                </label>
                <Switch id="pro-fit" disabled={readOnly} checked={spec.fitting.proFit}
                    onCheckedChange={checked => edit(draft => { draft.fitting.proFit = checked })} />
            </div>

            {showClt && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                    <button type="button" disabled={readOnly} className="flex flex-col items-start gap-0.5 text-left"
                        onClick={() => open({
                            kind: 'number', title: 'CLT', description: 'Center line transformation, in degrees at the fingers (typically about 16°)',
                            unit: 'Degrees', min: 0, max: 90, step: 1, value: clt ?? null,
                            onSet: value => edit(draft => { draft.fitting.cltDegrees = value })
                        })}>
                        <span className="text-sm font-semibold">CLT</span>
                        <span className={cn('font-mono text-base', clt != null ? 'font-semibold text-primary' : 'text-gray-400')}>
                            {clt != null ? `${clt}°` : 'Not set'}
                        </span>
                    </button>
                    {suggestion && !readOnly && (
                        <Button variant={suggestionApplied ? 'ghost' : 'outline'} size="sm" disabled={!!suggestionApplied}
                            onClick={() => edit(draft => {
                                draft.holes.middle.pitch.lateral32 = suggestion.middleLateral32
                                draft.holes.ring.pitch.lateral32 = suggestion.ringLateral32
                            })}>
                            {suggestionApplied ? `Line ${suggestion.line.line} applied` : `Apply line ${suggestion.line.line}: middle ${format32(Math.abs(suggestion.middleLateral32))} ${suggestion.middleLateral32 < 0 ? 'L' : 'R'}, ring ${format32(Math.abs(suggestion.ringLateral32))} ${suggestion.ringLateral32 < 0 ? 'L' : 'R'}`}
                        </Button>
                    )}
                </div>
            )}
        </article>
    )
}
