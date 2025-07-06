import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Customer } from '../../types';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../ui/Button';
import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';

interface CustomerManagementProps {
    searchTerm: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
                                                                          searchTerm
                                                                      }) => {
    const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
        if (editingCustomer) {
            updateCustomer(editingCustomer.id, customerData);
        } else {
            addCustomer(customerData);
        }
        setShowForm(false);
        setEditingCustomer(null);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setShowForm(true);
    };

    const handleView = (customer: Customer) => {
        // TODO: Implement view modal/page
        console.log('View customer:', customer);
    };

    const handleDelete = (customer: Customer) => {
        if (window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
            deleteCustomer(customer.id);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCustomer(null);
    };

    if (loading) {
        return <div className="flex justify-center py-8">Loading customers...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                <Button icon={Plus} onClick={() => setShowForm(true)}>
                    Add Customer
                </Button>
            </div>

            {showForm && (
                <CustomerForm
                    customer={editingCustomer || undefined}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            <CustomerList
                customers={filteredCustomers}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
            />
        </div>
    );
};