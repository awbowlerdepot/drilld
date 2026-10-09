import type {
    EquipmentCreate,
    EquipmentDetailDto,
    EquipmentDto,
    EquipmentIssue,
    EquipmentUpdate,
    MaintenanceComplete,
    MaintenanceTaskCreate,
    MaintenanceTaskUpdate
} from '../../shared/api/equipment'
import { apiRequest } from './apiClient'

/** Equipment and maintenance; every change returns the machine as it now is. */
export interface EquipmentApi {
    list: (locationId: string) => Promise<EquipmentDto[]>
    get: (id: string) => Promise<EquipmentDetailDto>
    create: (locationId: string, input: EquipmentCreate) => Promise<EquipmentDetailDto>
    update: (id: string, input: EquipmentUpdate) => Promise<EquipmentDetailDto>
    addTask: (id: string, input: MaintenanceTaskCreate) => Promise<EquipmentDetailDto>
    updateTask: (taskId: string, input: MaintenanceTaskUpdate) => Promise<EquipmentDetailDto>
    completeTask: (taskId: string, input: MaintenanceComplete) => Promise<EquipmentDetailDto>
    deleteTask: (taskId: string) => Promise<EquipmentDetailDto>
    reportIssue: (id: string, input: EquipmentIssue) => Promise<EquipmentDetailDto>
}

export const equipmentService: EquipmentApi = {
    list: locationId => apiRequest('GET', `/locations/${locationId}/equipment`),
    get: id => apiRequest('GET', `/equipment/${id}`),
    create: (locationId, input) => apiRequest('POST', `/locations/${locationId}/equipment`, input),
    update: (id, input) => apiRequest('PATCH', `/equipment/${id}`, input),
    addTask: (id, input) => apiRequest('POST', `/equipment/${id}/tasks`, input),
    updateTask: (taskId, input) => apiRequest('PATCH', `/maintenance-tasks/${taskId}`, input),
    completeTask: (taskId, input) => apiRequest('POST', `/maintenance-tasks/${taskId}/complete`, input),
    deleteTask: taskId => apiRequest('DELETE', `/maintenance-tasks/${taskId}`),
    reportIssue: (id, input) => apiRequest('POST', `/equipment/${id}/issues`, input)
}
