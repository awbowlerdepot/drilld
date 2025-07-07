import React from 'react';
import { User, Edit, UserCheck, UserX, Mail, Phone, DollarSign } from 'lucide-react';
import { Employee } from '../../types/employee';

interface EmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (employeeId: string) => void;
    onToggleStatus: (employee: Employee) => void;
    onClick: (employee: Employee) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
                                                              employee,
                                                              onEdit,
                                                              onDelete,
                                                              onToggleStatus,
                                                              onClick
                                                          }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div onClick={() => onClick(employee)}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            employee.active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                            <User className={`w-5 h-5 ${
                                employee.active ? 'text-green-600' : 'text-gray-400'
                            }`} />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">{employee.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                        {employee.active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {employee.email}
                    </div>
                    {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {employee.phone}
                        </div>
                    )}
                    {employee.hourlyRate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            ${employee.hourlyRate}/hr
                        </div>
                    )}
                </div>

                {employee.specialties.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Specialties
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {employee.specialties.slice(0, 3).map((specialty, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                    {specialty}
                                </span>
                            ))}
                            {employee.specialties.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    +{employee.specialties.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(employee);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(employee);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                        employee.active
                            ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                    }`}
                >
                    {employee.active ? (
                        <>
                            <UserX className="w-4 h-4" />
                            Deactivate
                        </>
                    ) : (
                        <>
                            <UserCheck className="w-4 h-4" />
                            Activate
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};