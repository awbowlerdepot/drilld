import { useCallback, useEffect, useState } from 'react'
import type { EmployeeCreate, EmployeeUpdate } from '../../shared/api/employees'
import { mockEmployees } from '../data/mockData'
import { apiEnabled } from '../services/config'
import { employeesService } from '../services/employeesService'
import type { Employee } from '../types'

const statusOf = (employee: Employee): Employee['status'] =>
    !employee.active ? 'INACTIVE' : employee.status === 'INVITED' ? 'INVITED' : 'ACTIVE'

/**
 * The company's employees. Reads and writes through the REST API when signed
 * in; otherwise (local development without auth) works on mock data. Changes
 * return promises and reject with the API's message if it refuses.
 */
export const useEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        const load = apiEnabled
            ? employeesService.list()
            : new Promise<Employee[]>(resolve => setTimeout(() => resolve(mockEmployees), 300))
        load
            .then(result => { if (!cancelled) setEmployees(result) })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const replace = (employee: Employee) =>
        setEmployees(prev => prev.map(e => (e.id === employee.id ? employee : e)))

    /** Adds and invites; resolves to whether an invitation email went out. */
    const addEmployee = useCallback(async (input: EmployeeCreate): Promise<boolean> => {
        if (apiEnabled) {
            const { inviteSent, ...employee } = await employeesService.create(input)
            setEmployees(prev => [...prev, employee])
            return inviteSent
        }
        const now = new Date().toISOString()
        setEmployees(prev => [...prev, {
            id: crypto.randomUUID(),
            email: input.email.trim().toLowerCase(),
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? null,
            companyRole: input.companyRole ?? null,
            memberships: input.memberships ?? [],
            hireDate: input.hireDate ?? null,
            hourlyRate: input.hourlyRate ?? null,
            specialties: input.specialties ?? [],
            status: 'INVITED',
            active: true,
            invitedAt: now,
            createdAt: now,
            updatedAt: now
        }])
        return true
    }, [])

    const updateEmployee = useCallback(async (id: string, changes: EmployeeUpdate) => {
        if (apiEnabled) {
            replace(await employeesService.update(id, changes))
            return
        }
        setEmployees(prev => prev.map(e => {
            if (e.id !== id) return e
            const updated = { ...e, ...changes, updatedAt: new Date().toISOString() } as Employee
            return { ...updated, status: statusOf(updated) }
        }))
    }, [])

    const resendInvite = useCallback(async (id: string) => {
        if (apiEnabled) {
            replace(await employeesService.resendInvite(id))
            return
        }
        setEmployees(prev => prev.map(e => (e.id === id ? { ...e, invitedAt: new Date().toISOString() } : e)))
    }, [])

    const cancelInvite = useCallback(async (id: string) => {
        if (apiEnabled) await employeesService.cancelInvite(id)
        setEmployees(prev => prev.filter(e => e.id !== id))
    }, [])

    return { employees, loading, error, addEmployee, updateEmployee, resendInvite, cancelInvite }
}
