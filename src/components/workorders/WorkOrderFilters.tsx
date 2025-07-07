import React from 'react';
import { Filter, X } from 'lucide-react';
import { WorkOrder, Employee, Location } from '../../types';

interface WorkOrderFiltersProps {
    workOrders: WorkOrder[];
    employees: Employee[];
    locations: Location[];
    filters: {
        workType: string;
        locationID: string;
        employeeID: string;
        dateRange: string;
    };
    onFilterChange: (filters: any) => void;
    onClearFilters: () => void;
}

export const WorkOrderFilters: React.FC<WorkOrderFiltersProps> = ({
                                                                      workOrders,
                                                                      employees,
                                                                      locations,
                                                                      filters,
                                                                      onFilterChange,
                                                                      onClearFilters
                                                                  }) => {
    const hasActiveFilters = Object.values(filters).some(filter => filter);

    const workTypes = Array.from(new Set(workOrders.map(wo => wo.workType)));

    const updateFilter = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Filter className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Work Type Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Type
                    </label>
                    <select
                        value={filters.workType}
                        onChange={(e) => updateFilter('workType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        {workTypes.map(type => (
                            <option key={type} value={type}>
                                {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Location Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <select
                        value={filters.locationID}
                        onChange={(e) => updateFilter('locationID', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Employee Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Technician
                    </label>
                    <select
                        value={filters.employeeID}
                        onChange={(e) => updateFilter('employeeID', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Technicians</option>
                        {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Range Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                    </label>
                    <select
                        value={filters.dateRange}
                        onChange={(e) => updateFilter('dateRange', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>
        </div>
    );
};