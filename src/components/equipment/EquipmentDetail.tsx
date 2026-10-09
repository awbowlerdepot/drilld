import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Pencil, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EQUIPMENT_KIND_LABELS, VOLUME_LABELS, type EquipmentDto, type MaintenanceTaskDto } from '../../../shared/api/equipment'
import { useEquipmentDetail } from '../../hooks/useEquipmentDetail'
import { formatDay } from '../../utils/MaintenanceFormat'
import { CompleteTaskDialog } from './CompleteTaskDialog'
import { EquipmentDialog } from './EquipmentDialog'
import { MaintenanceLogList } from './MaintenanceLogList'
import { MaintenanceTaskRow } from './MaintenanceTaskRow'
import { ReportProblemDialog } from './ReportProblemDialog'
import { TaskDialog } from './TaskDialog'

interface EquipmentDetailProps {
    id: string
    /** Set up the machine and its tasks (managers, owners, admins). */
    canManage: boolean
    /** Do maintenance and report problems (anyone who drills). */
    canDo: boolean
    onChange: (machine: EquipmentDto) => void
    onBack: () => void
}

const STATUS = { IN_SERVICE: 'In service', OUT_OF_SERVICE: 'Out of service', RETIRED: 'Retired' } as const

/** One machine: what it is, its maintenance tasks, and its history. */
export const EquipmentDetail = ({ id, canManage, canDo, onChange, onBack }: EquipmentDetailProps) => {
    const detail = useEquipmentDetail(id, onChange)
    const [doing, setDoing] = useState<MaintenanceTaskDto | null>(null)
    const [editingTask, setEditingTask] = useState<MaintenanceTaskDto | 'new' | null>(null)
    const [editing, setEditing] = useState(false)
    const [reporting, setReporting] = useState(false)
    const machine = detail.machine

    if (detail.loading) return <p className="py-6 text-center text-gray-500">Loading…</p>
    if (!machine) return <p role="alert" className="text-sm text-red-700">{detail.error ?? 'Equipment not found'}</p>

    const specs = [machine.manufacturer, machine.model, machine.serialNumber && `S/N ${machine.serialNumber}`].filter(Boolean).join(' · ')
    const press = machine.kind === 'DRILL_PRESS'
    const pressDetails = press ? [
        machine.details.column && (machine.details.column === 'ROUND' ? 'Round column' : 'Square column'),
        machine.details.jig && (machine.details.jig === 'VACUUM' ? 'Vacuum jig' : 'Clamp jig'),
        machine.details.verticalReadout && (machine.details.verticalReadout === 'UP_POSITIVE' ? 'readout up +' : 'readout down +'),
        `${VOLUME_LABELS[machine.volume].label} volume`
    ].filter(Boolean).join(' · ') : null

    return (
        <div className="grid gap-4">
            <div><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft data-icon="inline-start" /> All equipment</Button></div>
            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold text-gray-900">
                        {machine.name}
                        <Badge variant="outline">{EQUIPMENT_KIND_LABELS[machine.kind]}</Badge>
                        {machine.status !== 'IN_SERVICE' && <Badge className="bg-gray-100 text-gray-700">{STATUS[machine.status]}</Badge>}
                    </h2>
                    {specs && <p className="text-sm text-gray-600">{specs}</p>}
                    {pressDetails && <p className="text-sm text-gray-600">{pressDetails}</p>}
                    {machine.purchasedOn && <p className="text-xs text-gray-500">Purchased {formatDay(machine.purchasedOn)}</p>}
                    {machine.notes && <p className="mt-1 text-sm text-gray-700">{machine.notes}</p>}
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                    {canDo && <Button variant="outline" onClick={() => setReporting(true)}><AlertTriangle data-icon="inline-start" /> Report a problem</Button>}
                    {canManage && <Button variant="outline" onClick={() => setEditing(true)}><Pencil data-icon="inline-start" /> Edit</Button>}
                </div>
            </div>

            <section className="grid gap-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">Maintenance</h3>
                    {canManage && <Button variant="ghost" size="sm" onClick={() => setEditingTask('new')}><Plus data-icon="inline-start" /> Add task</Button>}
                </div>
                {machine.tasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No maintenance tasks yet.{canManage ? ' Add the ones this machine needs.' : ''}</p>
                ) : (
                    <ul className="rounded-lg border border-border px-3">
                        {machine.tasks.map(task => (
                            <MaintenanceTaskRow key={task.id} task={task} canDo={canDo} canEdit={canManage}
                                onDo={() => setDoing(task)} onEdit={() => setEditingTask(task)} />
                        ))}
                    </ul>
                )}
            </section>

            <section className="grid gap-2">
                <h3 className="text-base font-semibold">History</h3>
                <MaintenanceLogList log={machine.log} />
            </section>

            {doing && <CompleteTaskDialog task={doing} machineName={machine.name} onComplete={input => detail.completeTask(doing.id, input).then(() => undefined)} onClose={() => setDoing(null)} />}
            {editingTask && (
                <TaskDialog task={editingTask === 'new' ? null : editingTask}
                    onSave={input => (editingTask === 'new' ? detail.addTask(input) : detail.updateTask(editingTask.id, input)).then(() => undefined)}
                    onDelete={editingTask !== 'new' ? () => detail.deleteTask(editingTask.id).then(() => undefined) : undefined}
                    onClose={() => setEditingTask(null)} />
            )}
            {editing && (
                <EquipmentDialog machine={machine} onClose={() => setEditing(false)}
                    onSave={input => {
                        // The type can't change once added.
                        const { kind, ...changes } = input
                        void kind
                        return detail.update(changes).then(() => undefined)
                    }} />
            )}
            {reporting && <ReportProblemDialog machineName={machine.name} isDrillPress={press} onReport={input => detail.reportIssue(input).then(() => undefined)} onClose={() => setReporting(false)} />}
        </div>
    )
}
