import React from 'react';
import { User, Mail, Phone, Calendar, DollarSign, Shield, MapPin, X } from 'lucide-react';
import { Employee } from '../../types/employee';
import {
    getCompanyRoleLabel,
    getHighestRole,
    getPermissionsAtLocation,
    getRoleLabel
} from '../../utils/EmployeeRoles';

interface EmployeeDetailModalProps {
    employee: Employee;
    onClose: () => void;
    onEdit: (employee: Employee) => void;
    locationNames: Record<string, string>;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
                                                                            employee,
                                                                            onClose,
                                                                            onEdit,
                                                                            locationNames
                                                                        }) => {
    const highestRole = getHighestRole(employee);
    const headline = employee.companyRole
        ? getCompanyRoleLabel(employee.companyRole)
        : highestRole ? getRoleLabel(highestRole) : 'No role assigned';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                        Employee Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            employee.active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                            <User className={`w-8 h-8 ${
                                employee.active ? 'text-green-600' : 'text-gray-400'
                            }`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {employee.firstName} {employee.lastName}
                            </h2>
                            <p className="text-gray-600">{headline}</p>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                                employee.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {employee.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{employee.email}</span>
                                </div>
                                {employee.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{employee.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>@{employee.username}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Employment Details</h4>
                            <div className="space-y-2 text-sm">
                                {employee.hireDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>Hired: {new Date(employee.hireDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {employee.hourlyRate && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                        <span>${employee.hourlyRate}/hour</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Specialties */}
                    {employee.specialties.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Specialties</h4>
                            <div className="flex flex-wrap gap-2">
                                {employee.specialties.map((specialty, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Locations & Roles */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Locations & Roles</h4>
                        {employee.companyRole && (
                            <p className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                Company {getCompanyRoleLabel(employee.companyRole).toLowerCase()}: full access at every location
                            </p>
                        )}
                        {employee.memberships.length > 0 ? (
                            <div className="space-y-1">
                                {employee.memberships.map(membership => (
                                    <div
                                        key={membership.locationID}
                                        className="flex items-center justify-between gap-4 text-sm"
                                    >
                                        <span className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            {locationNames[membership.locationID] ?? 'Unknown location'}
                                        </span>
                                        <span className="text-gray-900">
                                            <span className="font-medium">{getRoleLabel(membership.role)}</span>
                                            <span className="ml-2 text-xs text-gray-400">
                                                {getPermissionsAtLocation(employee, membership.locationID).length} permissions
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Not assigned to any location</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onEdit(employee);
                                onClose();
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Edit Employee
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};