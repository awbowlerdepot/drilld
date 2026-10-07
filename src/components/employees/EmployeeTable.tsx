import type { Employee } from '../../types'
import { EmployeeRoleBadges } from './EmployeeRoleBadges'
import { EmployeeStatusBadge } from './EmployeeStatusBadge'

interface EmployeeTableProps {
    employees: Employee[]
    locationNames: Record<string, string>
    /** Owners and admins see pay. */
    showPay: boolean
    onOpen: (employee: Employee) => void
}

const formatDate = (date: string | null) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'

/** One row per employee: who, their roles, sign-in status. Tap a row to open it. */
export const EmployeeTable = ({ employees, locationNames, showPay, onOpen }: EmployeeTableProps) => (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                    <th scope="col" className="px-3 py-2.5">Name</th>
                    <th scope="col" className="px-3 py-2.5">Roles</th>
                    <th scope="col" className="px-3 py-2.5">Status</th>
                    <th scope="col" className="px-3 py-2.5">Hired</th>
                    {showPay && <th scope="col" className="px-3 py-2.5 text-right">Rate</th>}
                </tr>
            </thead>
            <tbody>
                {employees.map(employee => (
                    <tr key={employee.id} onClick={() => onOpen(employee)}
                        className="cursor-pointer border-b border-gray-100 align-top last:border-0 hover:bg-blue-50/40">
                        <td className="px-3 py-2.5">
                            <button type="button" onClick={event => { event.stopPropagation(); onOpen(employee) }}
                                className="text-left font-medium text-gray-900 hover:text-primary hover:underline">
                                {employee.firstName} {employee.lastName}
                            </button>
                            <span className="block text-xs text-gray-500">{employee.email}</span>
                        </td>
                        <td className="px-3 py-2.5"><EmployeeRoleBadges employee={employee} locationNames={locationNames} /></td>
                        <td className="px-3 py-2.5"><EmployeeStatusBadge status={employee.status} /></td>
                        <td className="px-3 py-2.5 text-gray-600">{formatDate(employee.hireDate)}</td>
                        {showPay && (
                            <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                                {employee.hourlyRate != null ? `$${employee.hourlyRate.toFixed(2)}` : '—'}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
