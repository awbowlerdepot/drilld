import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { MaintenanceComplete, MaintenanceTaskDto } from '../../../shared/api/equipment'
import { describeInterval, formatDay } from '../../utils/MaintenanceFormat'

interface CompleteTaskDialogProps {
    task: MaintenanceTaskDto
    machineName: string
    onComplete: (input: MaintenanceComplete) => Promise<void>
    onClose: () => void
}

/** Do a maintenance task: why it matters and how, the checklist, then Mark complete (logged, and next due scheduled). */
export const CompleteTaskDialog = ({ task, machineName, onComplete, onClose }: CompleteTaskDialogProps) => {
    const [checked, setChecked] = useState<string[]>([])
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const lines = (task.guidance ?? '').split('\n').map(line => line.trim()).filter(Boolean)
    const why = lines.find(line => /^why:/i.test(line))
    const steps = lines.filter(line => line !== why)
    const allChecked = task.checklist.every(item => checked.includes(item))

    const complete = async () => {
        setSaving(true)
        try {
            await onComplete({ notes, checked })
            onClose()
        } catch (err) {
            setError((err as Error).message)
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                    <DialogDescription>
                        {machineName} · {describeInterval(task)}{task.lastDoneAt ? ` · last done ${formatDay(task.lastDoneAt)}` : ''}
                    </DialogDescription>
                </DialogHeader>
                {why && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">{why.replace(/^why:\s*/i, 'Why: ')}</p>}
                {steps.length > 0 && (
                    <ol className="grid list-decimal gap-1 pl-5 text-sm text-gray-800">
                        {steps.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                )}
                {task.videoUrl && (
                    <a href={task.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <ExternalLink className="size-4" aria-hidden="true" /> Watch how
                    </a>
                )}
                {task.checklist.length > 0 && (
                    <div role="group" aria-label="Checklist" className="grid gap-1.5">
                        {task.checklist.map(item => {
                            const on = checked.includes(item)
                            return (
                                <button key={item} type="button" role="checkbox" aria-checked={on}
                                    onClick={() => setChecked(prev => (prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]))}
                                    className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                                        on ? 'border-green-300 bg-green-50 text-green-900' : 'border-border bg-white hover:bg-muted')}>
                                    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border text-[10px]',
                                        on ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300')}>{on ? '✓' : ''}</span>
                                    {item}
                                </button>
                            )
                        })}
                    </div>
                )}
                <Field>
                    <FieldLabel htmlFor="complete-notes">Notes (optional)</FieldLabel>
                    <Textarea id="complete-notes" rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Anything you noticed or replaced" />
                </Field>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" disabled={saving} onClick={() => void complete()}>
                        {saving ? 'Saving…' : allChecked ? 'Mark complete' : 'Mark complete anyway'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
