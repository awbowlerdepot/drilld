import { useState } from 'react'
import type { MaintenanceTaskDto } from '../../../shared/api/equipment'
import type { useLocationEquipment } from '../../hooks/useLocationEquipment'
import { equipmentApi } from '../../hooks/useLocationEquipment'
import { CompleteTaskDialog } from './CompleteTaskDialog'
import { LocationEquipment } from './LocationEquipment'
import { MaintenanceTaskRow } from './MaintenanceTaskRow'

interface MaintenancePageProps {
    locationId: string
    locationName: string
    /** The location's equipment (shared with the sidebar's due count). */
    list: ReturnType<typeof useLocationEquipment>
    canManage: boolean
    canDo: boolean
}

/**
 * Maintenance at the current location: what's overdue, due today and coming
 * up this week, done right from the list; then the machines themselves.
 */
export const MaintenancePage = ({ locationId, locationName, list, canManage, canDo }: MaintenancePageProps) => {
    const [doing, setDoing] = useState<{ task: MaintenanceTaskDto; machineName: string } | null>(null)
    const working = list.equipment.filter(e => e.status !== 'RETIRED')
    const rows = working.flatMap(machine => machine.tasks.filter(t => t.active).map(task => ({ task, machine })))
    const group = (states: MaintenanceTaskDto['due'][]) => rows
        .filter(r => states.includes(r.task.due))
        .sort((a, b) => (a.task.nextDueOn ?? '').localeCompare(b.task.nextDueOn ?? ''))

    const section = (title: string, items: typeof rows, empty?: string) => (
        <section className="grid gap-1">
            <h2 className="text-base font-semibold">{title} <span className="font-normal text-gray-500">{items.length}</span></h2>
            {items.length === 0 ? (empty && <p className="text-sm text-gray-500">{empty}</p>) : (
                <ul className="rounded-lg border border-border bg-white px-3">
                    {items.map(({ task, machine }) => (
                        <MaintenanceTaskRow key={task.id} task={task} machineName={machine.name} canDo={canDo} canEdit={false}
                            onDo={() => setDoing({ task, machineName: machine.name })} />
                    ))}
                </ul>
            )}
        </section>
    )

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
                <p className="text-gray-600">{locationName}: keep the drill press and the rest of the shop's equipment in shape.</p>
            </div>
            {list.error && <p role="alert" className="text-sm text-red-700">{list.error}</p>}
            {list.loading ? <p className="py-6 text-center text-gray-500">Loading…</p> : (
                <>
                    {section('Overdue', group(['OVERDUE']))}
                    {section('Due today', group(['DUE']), group(['OVERDUE']).length === 0 ? 'Nothing due today.' : undefined)}
                    {section('Coming up', group(['SOON']))}
                </>
            )}
            <section className="grid gap-2 rounded-xl border border-border bg-white p-4">
                <h2 className="text-base font-semibold">Equipment</h2>
                <LocationEquipment key={locationId} locationId={locationId} canManage={canManage} canDo={canDo} list={list} />
            </section>
            {doing && (
                <CompleteTaskDialog task={doing.task} machineName={doing.machineName} onClose={() => setDoing(null)}
                    onComplete={async input => { await equipmentApi.completeTask(doing.task.id, input); list.reload() }} />
            )}
        </div>
    )
}
