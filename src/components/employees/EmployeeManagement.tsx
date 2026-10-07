import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { canAddEmployees, canSeePay, type EmployeeManager } from '../../../shared/api/employees'
import { useEmployees } from '../../hooks/useEmployees'
import { useLocations } from '../../hooks/useLocations'
import type { Employee } from '../../types'
import { EmployeeDialog } from './EmployeeDialog'
import { EmployeeTable } from './EmployeeTable'

interface EmployeeManagementProps {
    searchTerm: string
    manager: EmployeeManager
}

type StatusFilter = 'CURRENT' | 'INVITED' | 'INACTIVE' | 'ALL'

const ALL_LOCATIONS = 'ALL'

/**
 * The company's employees: who works where, in what role, and whether they've
 * signed in. Owners, admins and location managers invite and edit people.
 */
export const EmployeeManagement = ({ searchTerm, manager }: EmployeeManagementProps) => {
    const { employees, loading, error, addEmployee, updateEmployee, resendInvite, cancelInvite } = useEmployees()
    const { locations } = useLocations()
    const [status, setStatus] = useState<StatusFilter>('CURRENT')
    const [locationID, setLocationID] = useState(ALL_LOCATIONS)
    // The open employee (by id, so it shows changes), 'new' to invite, or null.
    const [open, setOpen] = useState<string | 'new' | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const locationNames = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l.name])), [locations])

    const count = (filter: StatusFilter) => employees.filter(e =>
        filter === 'ALL' || (filter === 'CURRENT' ? e.status !== 'INACTIVE' : e.status === filter)).length

    const shown = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return employees
            .filter(e => status === 'ALL' || (status === 'CURRENT' ? e.status !== 'INACTIVE' : e.status === status))
            .filter(e => locationID === ALL_LOCATIONS || e.companyRole || e.memberships.some(m => m.locationID === locationID))
            .filter(e => !term || [e.firstName, e.lastName, e.email, `${e.firstName} ${e.lastName}`, ...e.specialties]
                .some(value => value.toLowerCase().includes(term)))
    }, [employees, status, locationID, searchTerm])

    const chip = (key: StatusFilter, text: string) => (
        <button key={key} type="button" aria-pressed={status === key} onClick={() => setStatus(key)}
            className={cn('min-h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                status === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
            {text} <span className={status === key ? 'opacity-80' : 'text-gray-500'}>{count(key)}</span>
        </button>
    )

    const openEmployee: Employee | null = open && open !== 'new' ? employees.find(e => e.id === open) ?? null : null

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
                {chip('CURRENT', 'Current')}
                {chip('INVITED', 'Invited')}
                {chip('INACTIVE', 'Inactive')}
                {chip('ALL', 'All')}
                <Select value={locationID} onValueChange={setLocationID}>
                    <SelectTrigger aria-label="Location" className="min-h-9 w-48 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_LOCATIONS}>All locations</SelectItem>
                        {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                {canAddEmployees(manager) && (
                    <Button className="ml-auto" onClick={() => { setNotice(null); setOpen('new') }}>
                        <UserPlus aria-hidden="true" /> Invite employee
                    </Button>
                )}
            </div>

            {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            {loading ? (
                <p className="py-12 text-center text-gray-500">Loading employees…</p>
            ) : shown.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-white py-12 text-center text-gray-500">
                    {employees.length === 0 ? 'No employees yet.' : 'No employees match.'}
                </p>
            ) : (
                <EmployeeTable employees={shown} locationNames={locationNames} showPay={canSeePay(manager)}
                    onOpen={employee => { setNotice(null); setOpen(employee.id) }} />
            )}

            {open !== null && (open === 'new' || openEmployee) && (
                <EmployeeDialog
                    employee={openEmployee}
                    locations={locations}
                    manager={manager}
                    onCreate={async input => {
                        const sent = await addEmployee(input)
                        setNotice(sent
                            ? `Invitation sent to ${input.email}. They'll sign in with the temporary password in that email.`
                            : `${input.firstName} already has a Drilld login, so no email was sent. They can sign in with their password.`)
                    }}
                    onUpdate={changes => updateEmployee(openEmployee!.id, changes)}
                    onResendInvite={() => resendInvite(openEmployee!.id)}
                    onCancelInvite={() => cancelInvite(openEmployee!.id)}
                    onClose={() => setOpen(null)}
                />
            )}
        </div>
    )
}
