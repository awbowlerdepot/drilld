import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { maintenanceTaskCreateSchema, type MaintenanceTaskCreate, type MaintenanceTaskDto } from '../../../shared/api/equipment'

interface TaskDialogProps {
    /** Null to add the shop's own task. */
    task: MaintenanceTaskDto | null
    onSave: (input: MaintenanceTaskCreate) => Promise<void>
    onDelete?: () => Promise<void>
    onClose: () => void
}

/**
 * A maintenance task: how often it's due, the how-to (why it matters, then
 * the steps, one per line), the checklist, and a video link when there is one.
 */
export const TaskDialog = ({ task, onSave, onDelete, onClose }: TaskDialogProps) => {
    const [title, setTitle] = useState(task?.title ?? '')
    const [intervalDays, setIntervalDays] = useState(task?.intervalDays ? String(task.intervalDays) : '')
    const [guidance, setGuidance] = useState(task?.guidance ?? '')
    const [checklist, setChecklist] = useState((task?.checklist ?? []).join('\n'))
    const [videoUrl, setVideoUrl] = useState(task?.videoUrl ?? '')
    const [active, setActive] = useState(task?.active ?? true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const input: MaintenanceTaskCreate = {
            title, guidance, videoUrl, active,
            intervalDays: intervalDays.trim() ? Number(intervalDays) : null,
            intervalBalls: task?.intervalBalls ?? null,
            checklist: checklist.split('\n').map(line => line.trim()).filter(Boolean)
        }
        const parsed = maintenanceTaskCreateSchema.safeParse(input)
        if (!parsed.success) {
            setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])))
            return
        }
        setSaving(true)
        try {
            await onSave(input)
            onClose()
        } catch (err) {
            setErrors({ form: (err as Error).message })
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <form className="grid gap-5" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{task ? task.title : 'Add a maintenance task'}</DialogTitle>
                        <DialogDescription>{task?.templateCode ? `A standard task (${task.templateCode}); change it to suit your shop.` : 'Your own task for this machine.'}</DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="grid gap-4">
                        <Field data-invalid={!!errors.title}>
                            <FieldLabel htmlFor="task-title">Task</FieldLabel>
                            <Input id="task-title" value={title} onChange={event => setTitle(event.target.value)} autoFocus={!task} />
                            {errors.title && <FieldError>{errors.title}</FieldError>}
                        </Field>
                        <Field data-invalid={!!errors.intervalDays}>
                            <FieldLabel htmlFor="task-interval">Every how many days</FieldLabel>
                            <Input id="task-interval" type="number" inputMode="numeric" min={1} className="w-32" value={intervalDays} onChange={event => setIntervalDays(event.target.value)} />
                            <FieldDescription>1 = daily, 7 = weekly, 90 = quarterly. Ball-count intervals come once work orders are tracked.</FieldDescription>
                            {errors.intervalDays && <FieldError>{errors.intervalDays}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="task-guidance">How-to</FieldLabel>
                            <Textarea id="task-guidance" rows={5} value={guidance} onChange={event => setGuidance(event.target.value)}
                                placeholder={'Why: what goes wrong if it\'s skipped.\nThen each step on its own line.'} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="task-checklist">Checklist (one item per line)</FieldLabel>
                            <Textarea id="task-checklist" rows={3} value={checklist} onChange={event => setChecklist(event.target.value)} />
                        </Field>
                        <Field data-invalid={!!errors.videoUrl}>
                            <FieldLabel htmlFor="task-video">Video link (optional)</FieldLabel>
                            <Input id="task-video" type="url" placeholder="https://" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} />
                            {errors.videoUrl && <FieldError>{errors.videoUrl}</FieldError>}
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <Switch checked={active} onCheckedChange={setActive} /> Scheduled (turn off to stop reminders)
                        </label>
                    </FieldGroup>
                    {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}
                    <DialogFooter>
                        {onDelete && !task?.templateCode && (
                            <Button type="button" variant="ghost" className="mr-auto text-destructive" onClick={() => void onDelete().then(onClose)}>Remove task</Button>
                        )}
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : task ? 'Save' : 'Add task'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
