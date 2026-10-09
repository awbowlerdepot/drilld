import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { EquipmentIssue, IssueType } from '../../../shared/api/equipment'

interface ReportProblemDialogProps {
    machineName: string
    isDrillPress: boolean
    onReport: (input: EquipmentIssue) => Promise<void>
    onClose: () => void
}

const TYPES: { value: IssueType; label: string; press?: boolean }[] = [
    { value: 'JAM', label: 'Machine jammed', press: true },
    { value: 'BIT_SNAPPED', label: 'Bit snapped', press: true },
    { value: 'OTHER', label: 'Something else' }
]

/** Log a problem with a machine. A jam or snapped bit on a drill press makes the alignment check due today. */
export const ReportProblemDialog = ({ machineName, isDrillPress, onReport, onClose }: ReportProblemDialogProps) => {
    const types = TYPES.filter(t => !t.press || isDrillPress)
    const [issueType, setIssueType] = useState<IssueType>(types[0].value)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const report = async () => {
        setSaving(true)
        try {
            await onReport({ issueType, notes })
            onClose()
        } catch (err) {
            setError((err as Error).message)
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Report a problem</DialogTitle>
                    <DialogDescription>{machineName}. It goes in the machine's history.</DialogDescription>
                </DialogHeader>
                <div role="radiogroup" aria-label="What happened" className="flex flex-wrap gap-1.5">
                    {types.map(t => (
                        <button key={t.value} type="button" role="radio" aria-checked={issueType === t.value} onClick={() => setIssueType(t.value)}
                            className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors',
                                issueType === t.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white hover:bg-muted')}>
                            {t.label}
                        </button>
                    ))}
                </div>
                {isDrillPress && issueType !== 'OTHER' && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">The jig tramming & squaring check will be due today, before the next ball.</p>
                )}
                <Field>
                    <FieldLabel htmlFor="problem-notes">What happened (optional)</FieldLabel>
                    <Textarea id="problem-notes" rows={3} value={notes} onChange={event => setNotes(event.target.value)} />
                </Field>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" disabled={saving} onClick={() => void report()}>{saving ? 'Saving…' : 'Report'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
