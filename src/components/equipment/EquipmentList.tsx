import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EQUIPMENT_KIND_LABELS, type EquipmentDto } from '../../../shared/api/equipment'

/** "2 overdue · 1 due today", or "Up to date". */
const dueSummary = (machine: EquipmentDto) => {
    const overdue = machine.tasks.filter(t => t.due === 'OVERDUE').length
    const due = machine.tasks.filter(t => t.due === 'DUE').length
    if (overdue || due) {
        return { text: [overdue && `${overdue} overdue`, due && `${due} due today`].filter(Boolean).join(' · '), className: overdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900' }
    }
    return machine.tasks.some(t => t.active) ? { text: 'Up to date', className: 'bg-green-100 text-green-800' } : null
}

/** A location's machines with their maintenance status. Tap one to open it. */
export const EquipmentList = ({ equipment, onOpen }: { equipment: EquipmentDto[]; onOpen: (id: string) => void }) => (
    <ul className="grid gap-2">
        {equipment.map(machine => {
            const summary = machine.status === 'RETIRED' ? null : dueSummary(machine)
            return (
                <li key={machine.id}>
                    <button type="button" onClick={() => onOpen(machine.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-left transition-colors hover:border-primary">
                        <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                                {machine.name}
                                {machine.status === 'OUT_OF_SERVICE' && <Badge className="bg-gray-100 text-gray-700">Out of service</Badge>}
                                {machine.status === 'RETIRED' && <Badge className="bg-gray-100 text-gray-500">Retired</Badge>}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                                {[EQUIPMENT_KIND_LABELS[machine.kind], machine.manufacturer, machine.model].filter(Boolean).join(' · ')}
                            </span>
                        </span>
                        {summary && <Badge className={summary.className}>{summary.text}</Badge>}
                        <ChevronRight className="size-4 text-gray-400" aria-hidden="true" />
                    </button>
                </li>
            )
        })}
    </ul>
)
