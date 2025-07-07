import React from 'react';
import { Edit, Trash2, ArrowRight } from 'lucide-react';
import { Customer } from '../../types';
import { Button } from '../ui/Button';

interface CustomerListProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onView: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
                                                              customers,
                                                              onEdit,
                                                              onView,
                                                              onDelete
                                                          }) => {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preferences
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {customer.firstName} {customer.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                    ID: {customer.id}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.email}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                                {customer.dominantHand} handed
                            </div>
                            <div className="text-sm text-gray-500">
                                {customer.preferredGripStyle.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-gray-500">
                                Thumb: {customer.usesThumb ? 'Yes' : 'No'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => onView(customer)}
                                    icon={ArrowRight}
                                >
                                    View Details
                                </Button>
                                <button
                                    onClick={() => onEdit(customer)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit customer"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(customer)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete customer"
                                >
                                    <Trash2 className="w-4 h-4" />
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