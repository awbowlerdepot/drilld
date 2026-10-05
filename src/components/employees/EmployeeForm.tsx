import React, { useState } from 'react';
import { Location } from '../../types';
import { CompanyRole, Employee, EmployeeFormData } from '../../types/employee';
import { COMPANY_ROLE_OPTIONS } from '../../utils/EmployeeRoles';
import { EmployeeMembershipsInput } from './EmployeeMembershipsInput';

interface EmployeeFormProps {
    employee: Employee | null;
    locations: Location[];
    onSubmit: (data: EmployeeFormData) => void;
    onCancel: () => void;
}

const SPECIALTIES = [
    'Ball Drilling', 'Surface Adjustments', 'Thumb Slugs', 'Finger Inserts',
    'Weight Holes', 'Layout Design', 'Customer Consultation', 'Equipment Maintenance'
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, locations, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<EmployeeFormData>({
        username: employee?.username || '',
        email: employee?.email || '',
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        phone: employee?.phone || '',
        companyRole: employee?.companyRole,
        memberships: employee?.memberships || [],
        certifications: employee?.certifications || {},
        hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
        hourlyRate: employee?.hourlyRate || 0,
        specialties: employee?.specialties || []
    });

    const [membershipError, setMembershipError] = useState<string | undefined>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyRole && formData.memberships.length === 0) {
            setMembershipError('Assign at least one location, or give company-wide access.');
            return;
        }
        onSubmit(formData);
    };

    const handleSpecialtyToggle = (specialty: string) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {employee ? 'Edit Employee' : 'Add New Employee'}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hire Date
                            </label>
                            <input
                                type="date"
                                value={formData.hireDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hourly Rate
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.hourlyRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Access */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Access</h4>
                            <p className="text-sm text-gray-500">
                                Permissions come from the role at each location. Owners and admins have full access at every location.
                            </p>
                        </div>

                        <div className="md:w-1/2">
                            <label htmlFor="companyRole" className="block text-sm font-medium text-gray-700 mb-1">
                                Company Access
                            </label>
                            <select
                                id="companyRole"
                                value={formData.companyRole ?? ''}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, companyRole: (e.target.value || undefined) as CompanyRole | undefined }));
                                    setMembershipError(undefined);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">None (location roles only)</option>
                                {COMPANY_ROLE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-1">
                                Locations & Roles
                            </span>
                            <EmployeeMembershipsInput
                                locations={locations}
                                memberships={formData.memberships}
                                onChange={(memberships) => {
                                    setFormData(prev => ({ ...prev, memberships }));
                                    setMembershipError(undefined);
                                }}
                                error={membershipError}
                            />
                        </div>
                    </div>

                    {/* Specialties */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Specialties
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SPECIALTIES.map(specialty => (
                                <label key={specialty} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.specialties.includes(specialty)}
                                        onChange={() => handleSpecialtyToggle(specialty)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        {specialty}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {employee ? 'Update Employee' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};