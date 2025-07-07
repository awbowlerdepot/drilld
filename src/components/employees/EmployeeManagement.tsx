import React, { useState, useMemo } from 'react';
import { User, Plus } from 'lucide-react';
import { Employee, EmployeeRole, EmployeeFormData } from '../../types/employee';
import { useEmployees } from '../../hooks/useEmployees';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDetailModal } from './EmployeeDetailModal';

interface EmployeeManagementProps {
    searchTerm: string;
}

const EMPLOYEE_ROLES: { value: EmployeeRole; label: string }[] = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'SENIOR_TECH', label: 'Senior Technician' },
    { value: 'TECHNICIAN', label: 'Technician' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'INTERN', label: 'Intern' }
];

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ searchTerm }) => {
    const {
        employees,
        loading,
        error,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        activateEmployee,
        deactivateEmployee,
        searchEmployees
    } = useEmployees();

    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterRole, setFilterRole] = useState<EmployeeRole | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Filter employees based on search term and filters
    const filteredEmployees = useMemo(() => {
        let filtered = searchTerm ? searchEmployees(searchTerm) : employees;

        if (filterRole !== 'all') {
            filtered = filtered.filter(emp => emp.role === filterRole);
        }

        if (filterStatus === 'active') {
            filtered = filtered.filter(emp => emp.active);
        } else if (filterStatus === 'inactive') {
            filtered = filtered.filter(emp => !emp.active);
        }

        return filtered;
    }, [employees, searchTerm, filterRole, filterStatus, searchEmployees]);

    const handleCreateEmployee = () => {
        setEditingEmployee(null);
        setShowForm(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            try {
                await deleteEmployee(employeeId);
            } catch (err) {
                console.error('Error deleting employee:', err);
            }
        }
    };

    const handleToggleStatus = async (employee: Employee) => {
        try {
            if (employee.active) {
                await deactivateEmployee(employee.id);
            } else {
                await activateEmployee(employee.id);
            }
        } catch (err) {
            console.error('Error toggling employee status:', err);
        }
    };

    const handleFormSubmit = async (formData: EmployeeFormData) => {
        try {
            if (editingEmployee) {
                await updateEmployee(editingEmployee.id, formData);
            } else {
                await addEmployee(formData);
            }
            setShowForm(false);
            setEditingEmployee(null);
        } catch (err) {
            console.error('Error saving employee:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">Error loading employees: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                    <p className="text-gray-600">Manage your pro shop team and their permissions</p>
                </div>
                <button
                    onClick={handleCreateEmployee}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Employee
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Role
                        </label>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as EmployeeRole | 'all')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Roles</option>
                            {EMPLOYEE_ROLES.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Employees</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            View Mode
                        </label>
                        <div className="flex rounded-md border border-gray-300">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Grid/List */}
            {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-600 mb-6">
                        {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your search criteria or filters'
                            : 'Get started by adding your first employee'
                        }
                    </p>
                    {(!searchTerm && filterRole === 'all' && filterStatus === 'all') && (
                        <button
                            onClick={handleCreateEmployee}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Employee
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onEdit={handleEditEmployee}
                            onDelete={handleDeleteEmployee}
                            onToggleStatus={handleToggleStatus}
                            onClick={setSelectedEmployee}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <EmployeeTable
                        employees={filteredEmployees}
                        onEdit={handleEditEmployee}
                        onDelete={handleDeleteEmployee}
                        onToggleStatus={handleToggleStatus}
                        onRowClick={setSelectedEmployee}
                    />
                </div>
            )}

            {/* Employee Form Modal */}
            {showForm && (
                <EmployeeForm
                    employee={editingEmployee}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingEmployee(null);
                    }}
                />
            )}

            {/* Employee Detail Modal */}
            {selectedEmployee && (
                <EmployeeDetailModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onEdit={handleEditEmployee}
                />
            )}
        </div>
    );
};