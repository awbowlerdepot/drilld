import { useState } from 'react'
import { Box, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BallDetailDto } from '../../../../shared/api/balls'
import { papReference, solveBallLayout, type BallLayoutDto, type BallLayoutWrite } from '../../../../shared/api/ballLayouts'
import type { Customer } from '../../../types'
import { LAYOUT_SYSTEM_LABELS, describeLayout, describeNumbers, otherSystems } from '../../../utils/BallLayoutFormat'
import { Ball3DDialog } from '../three/Ball3DDialog'
import { LayoutDialog } from './LayoutDialog'
import { LayoutDiagram } from './LayoutDiagram'

interface BallLayoutSectionProps {
    ball: BallDetailDto
    owner: Customer | null
    canEdit: boolean
    onAdd: (input: BallLayoutWrite) => Promise<void>
    onUpdate: (layoutId: string, input: BallLayoutWrite) => Promise<void>
    onDelete: (layoutId: string) => Promise<void>
    /** Saves a PAP entered for a layout to the bowler's profile. */
    onSaveBowlerPap?: (pap: { over32: number; up32: number }) => Promise<void>
}

const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

/** The ball's layout: the current drilling's (with the other systems' numbers and the diagram), and earlier drillings. */
export const BallLayoutSection = ({ ball, owner, canEdit, onAdd, onUpdate, onDelete, onSaveBowlerPap }: BallLayoutSectionProps) => {
    const [editing, setEditing] = useState<BallLayoutDto | 'new' | null>(null)
    const [showing3d, setShowing3d] = useState(false)
    const current = ball.layouts[0] ?? null
    const solved = current ? solveBallLayout(current.layout) : null

    return (
        <section className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Layout</h3>
                {canEdit && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing('new')}>
                        <Plus data-icon="inline-start" /> {current ? 'Redrill layout' : 'Add layout'}
                    </Button>
                )}
            </div>
            {!current || !solved ? (
                <p className="text-sm text-gray-500">No layout yet.</p>
            ) : (
                <div className="grid items-center gap-3 sm:grid-cols-[1fr_160px]">
                    <div className="grid gap-1 text-sm">
                        <p>
                            <span className="font-mono text-base font-medium text-gray-900">{describeLayout(current.layout)}</span>
                            <span className="ml-2 text-gray-500">{LAYOUT_SYSTEM_LABELS[current.layout.system]}</span>
                        </p>
                        {otherSystems(current.layout.system, owner?.usesThumb ?? true).map(other => (
                            <p key={other} className="text-gray-600">= <span className="font-mono">{describeNumbers(other, solved)}</span> {LAYOUT_SYSTEM_LABELS[other]}</p>
                        ))}
                        <p className="text-xs text-gray-500">Drilled {day(current.drilledOn)}{current.notes ? ` · ${current.notes}` : ''}</p>
                        <div className="flex gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowing3d(true)}><Box data-icon="inline-start" /> 3D view</Button>
                            {canEdit && <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(current)}><Pencil data-icon="inline-start" /> Edit</Button>}
                        </div>
                    </div>
                    <LayoutDiagram solved={solved} hand={current.layout.hand} reference={papReference(current.layout.system)} className="w-40 justify-self-center" />
                </div>
            )}
            {ball.layouts.length > 1 && (
                <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600">Earlier drillings ({ball.layouts.length - 1})</summary>
                    <ul className="mt-1 grid gap-1">
                        {ball.layouts.slice(1).map(l => (
                            <li key={l.id} className="flex items-center gap-2 text-gray-700">
                                <span className="font-mono">{describeLayout(l.layout)}</span>
                                <span className="text-gray-500">{LAYOUT_SYSTEM_LABELS[l.layout.system]} · {day(l.drilledOn)}</span>
                                {canEdit && <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit this layout" onClick={() => setEditing(l)}><Pencil /></Button>}
                                {canEdit && <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete this layout" onClick={() => { if (window.confirm('Delete this layout?')) void onDelete(l.id) }}><Trash2 /></Button>}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
            {canEdit && current && ball.layouts.length === 1 && (
                <button type="button" className="justify-self-start text-xs text-gray-500 hover:text-red-700 hover:underline"
                    onClick={() => { if (window.confirm('Delete this layout? It was entered by mistake.')) void onDelete(current.id) }}>Delete this layout</button>
            )}
            {showing3d && current && solved && (
                <Ball3DDialog ball={ball.catalogBall} solved={solved} hand={current.layout.hand} system={current.layout.system} owner={owner} onClose={() => setShowing3d(false)} />
            )}
            {editing && (
                <LayoutDialog psaDistance={ball.psaDistance} symmetric={ball.catalogBall.core?.type === 'symmetric'} owner={owner}
                    existing={editing === 'new' ? null : editing} previous={current} onSaveBowlerPap={onSaveBowlerPap}
                    onSave={input => (editing === 'new' ? onAdd(input) : onUpdate(editing.id, input))}
                    onClose={() => setEditing(null)} />
            )}
        </section>
    )
}
