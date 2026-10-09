import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MaintenanceTaskDto } from '../../../shared/api/equipment'
import { describeInterval, formatDay } from '../../utils/MaintenanceFormat'
import { DueBadge } from './DueBadge'

interface MaintenanceTaskRowProps {
    task: MaintenanceTaskDto
    /** Shown before the task, e.g. the machine's name on the maintenance list. */
    machineName?: string
    canDo: boolean
    canEdit: boolean
    onDo: () => void
    onEdit?: () => void
}

/** A task: when it's due, how often, when it was last done; Do it / edit. */
export const MaintenanceTaskRow = ({ task, machineName, canDo, canEdit, onDo, onEdit }: MaintenanceTaskRowProps) => (
    <li className={cn('flex flex-wrap items-center gap-3 border-b border-gray-100 py-2.5 last:border-0', !task.active && 'opacity-60')}>
        <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                {machineName && <span className="text-gray-500">{machineName} ·</span>}
                {task.title}
                <DueBadge due={task.due} />
            </p>
            <p className="text-xs text-gray-500">
                {describeInterval(task)}
                {task.nextDueOn && task.active ? ` · due ${formatDay(task.nextDueOn)}` : ''}
                {task.lastDoneAt ? ` · last done ${formatDay(task.lastDoneAt)}` : ' · not done yet'}
            </p>
        </div>
        {canEdit && onEdit && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${task.title}`} onClick={onEdit}><Pencil /></Button>}
        {canDo && task.active && (
            <Button type="button" size="sm" variant={task.due === 'OVERDUE' || task.due === 'DUE' ? 'default' : 'outline'} onClick={onDo}>Do it</Button>
        )}
    </li>
)
