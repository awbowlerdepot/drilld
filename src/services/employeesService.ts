import type { EmployeeCreate, EmployeeDto, EmployeeUpdate } from '../../shared/api/employees'
import { apiRequest } from './apiClient'

export const employeesService = {
    list: () => apiRequest<EmployeeDto[]>('GET', '/employees'),
    /** Adds the employee and emails the invitation; `inviteSent` is false when they already had a login. */
    create: (employee: EmployeeCreate) => apiRequest<EmployeeDto & { inviteSent: boolean }>('POST', '/employees', employee),
    update: (id: string, changes: EmployeeUpdate) => apiRequest<EmployeeDto>('PATCH', `/employees/${id}`, changes),
    resendInvite: (id: string) => apiRequest<EmployeeDto>('POST', `/employees/${id}/invite`),
    cancelInvite: (id: string) => apiRequest<void>('DELETE', `/employees/${id}`)
}
