import { useCallback, useEffect, useState } from 'react'
import type {
    EquipmentDetailDto,
    EquipmentIssue,
    EquipmentUpdate,
    MaintenanceComplete,
    MaintenanceTaskCreate,
    MaintenanceTaskUpdate
} from '../../shared/api/equipment'
import { equipmentApi } from './useLocationEquipment'

/**
 * One machine: its details, maintenance tasks and log, and the changes made
 * to it. Every change returns the machine as it now is; `onChange` hears about
 * it (to update a list).
 */
export const useEquipmentDetail = (id: string, onChange?: (machine: EquipmentDetailDto) => void) => {
    const [machine, setMachine] = useState<EquipmentDetailDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        equipmentApi.get(id)
            .then(result => { if (!cancelled) setMachine(result) })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [id])

    const apply = useCallback(async (work: Promise<EquipmentDetailDto>) => {
        const updated = await work
        setMachine(updated)
        onChange?.(updated)
        return updated
    }, [onChange])

    return {
        machine,
        loading,
        error,
        update: (input: EquipmentUpdate) => apply(equipmentApi.update(id, input)),
        addTask: (input: MaintenanceTaskCreate) => apply(equipmentApi.addTask(id, input)),
        updateTask: (taskId: string, input: MaintenanceTaskUpdate) => apply(equipmentApi.updateTask(taskId, input)),
        completeTask: (taskId: string, input: MaintenanceComplete) => apply(equipmentApi.completeTask(taskId, input)),
        deleteTask: (taskId: string) => apply(equipmentApi.deleteTask(taskId)),
        reportIssue: (input: EquipmentIssue) => apply(equipmentApi.reportIssue(id, input))
    }
}
