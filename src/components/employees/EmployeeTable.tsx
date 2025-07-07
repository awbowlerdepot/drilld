import React from 'react';
import { User, Edit, UserCheck, UserX } from 'lucide-react';
import { Employee } from '../../types/employee';

interface EmployeeTableProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDelete: (employeeId: string) => void;
    onToggleStatus: (employee: Employee) => void;
    onRowClick: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
                                                                employees,
                                                                onEdit,
                                                                onDelete,
                                                                onToggleStatus,
                                                                onRowClick
                                                            }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                    <tr
                        key={employee.id}
                        onClick={() => onRowClick(employee)}
                        className="hover:bg-gray-50 cursor-pointer"
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                    employee.active ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                    <User className={`w-4 h-4 ${
                                        employee.active ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        @{employee.username}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.role.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{employee.email}</div>
                            {employee.phone && <div>{employee.phone}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    employee.active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {employee.active ? 'Active' : 'Inactive'}
                                </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.hourlyRate ? `$${employee.hourlyRate}/hr` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(employee);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Employee"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleStatus(employee);
                                    }}
                                    className={employee.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                    title={employee.active ? 'Deactivate Employee' : 'Activate Employee'}
                                >
                                    {employee.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};