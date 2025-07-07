import React from 'react';
import { Select } from '../ui/Select';
import { BowlingBall, Customer } from '../../types';

interface BallFiltersProps {
    balls: BowlingBall[];
    customers: Customer[];
    filters: {
        customerID: string;
        manufacturer: string;
        status: string;
        weight: string;
    };
    onFilterChange: (filters: any) => void;
    onClearFilters: () => void;
}

export const BallFilters: React.FC<BallFiltersProps> = ({
                                                            balls,
                                                            customers,
                                                            filters,
                                                            onFilterChange,
                                                            onClearFilters
                                                        }) => {
    const updateFilter = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    // Generate filter options from existing data
    const manufacturerOptions = Array.from(new Set(balls.map(b => b.manufacturer)))
        .sort()
        .map(manufacturer => ({ value: manufacturer, label: manufacturer }));

    const weightOptions = Array.from(new Set(balls.map(b => b.weight.toString())))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(weight => ({ value: weight, label: `${weight} lbs` }));

    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`
    }));

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-sm font-medium text-gray-700">Filters:</h3>

                <Select
                    value={filters.customerID}
                    onChange={(value) => updateFilter('customerID', value)}
                    options={customerOptions}
                    placeholder="All Customers"
                    className="min-w-48"
                />

                <Select
                    value={filters.manufacturer}
                    onChange={(value) => updateFilter('manufacturer', value)}
                    options={manufacturerOptions}
                    placeholder="All Manufacturers"
                    className="min-w-40"
                />

                <Select
                    value={filters.status}
                    onChange={(value) => updateFilter('status', value)}
                    options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'RETIRED', label: 'Retired' },
                        { value: 'DAMAGED', label: 'Damaged' }
                    ]}
                    placeholder="All Statuses"
                    className="min-w-32"
                />

                <Select
                    value={filters.weight}
                    onChange={(value) => updateFilter('weight', value)}
                    options={weightOptions}
                    placeholder="All Weights"
                    className="min-w-32"
                />

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>
        </div>
    );
};