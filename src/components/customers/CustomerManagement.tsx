import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Customer } from '../../types';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../common/Button';
import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';
import { CustomerDetailView } from './CustomerDetailView';

interface CustomerManagementProps {
    searchTerm: string;
    /** The location picked in the sidebar. */
    currentLocationID?: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
                                                                          searchTerm,
                                                                          currentLocationID
                                                                      }) => {
    const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const [actionError, setActionError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // If a customer is selected, show the detail view
    if (selectedCustomer) {
        return (
            <CustomerDetailView
                customer={selectedCustomer}
                currentLocationID={currentLocationID}
                onBack={() => setSelectedCustomer(null)}
                onEditCustomer={(customer) => {
                    setEditingCustomer(customer);
                    setShowForm(true);
                }}
            />
        );
    }

    const filteredCustomers = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, customerData);
            } else {
                await addCustomer(customerData);
            }
            setActionError(null);
            setShowForm(false);
            setEditingCustomer(null);
        } catch (err) {
            setActionError(`Could not save the customer: ${(err as Error).message}`);
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setShowForm(true);
    };

    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer);
    };

    const handleDelete = async (customer: Customer) => {
        if (!window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) return;
        try {
            await deleteCustomer(customer.id);
            setActionError(null);
        } catch (err) {
            setActionError(`Could not delete the customer: ${(err as Error).message}`);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCustomer(null);
    };

    if (loading) {
        return <div className="flex justify-center py-8">Loading customers...</div>;
    }

    if (error) {
        return (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                Could not load customers: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {actionError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {actionError}
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                    <p className="text-gray-600 mt-1">
                        Manage your customers and their drill sheets
                    </p>
                </div>
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