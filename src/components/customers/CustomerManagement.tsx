import React, { useEffect, useState } from 'react';
import { FileImage, Plus } from 'lucide-react';
import { Customer } from '../../types';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../common/Button';
import { CustomerForm } from './CustomerForm';
import { CustomerList } from './CustomerList';
import { CustomerDetailView } from './CustomerDetailView';
import { PaperImportPage } from '../paperimport/PaperImportPage';
import { apiEnabled } from '../../services/config';
import { customersService } from '../../services/customersService';

interface CustomerManagementProps {
    searchTerm: string;
    /** The location picked in the sidebar. */
    currentLocationID?: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
                                                                          searchTerm,
                                                                          currentLocationID
                                                                      }) => {
    const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer, rememberCustomer } = useCustomers();
    const [actionError, setActionError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    // The open customer, read from the list so an edit shows straight away.
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) ?? null : null;
    const [importing, setImporting] = useState(false);
    // A drill sheet to open straight away (with its paper sheet), after a paper import.
    const [openSheetId, setOpenSheetId] = useState<string | null>(null);
    // The customer to open once they're in the list (a new one from paper import).
    const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);

    useEffect(() => {
        const customer = pendingCustomerId ? customers.find(c => c.id === pendingCustomerId) : undefined;
        if (!customer) return;
        setSelectedCustomerId(customer.id);
        setPendingCustomerId(null);
    }, [pendingCustomerId, customers]);

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

    const handleCancel = () => {
        setShowForm(false);
        setEditingCustomer(null);
    };

    // Adding or editing a customer: from the list, or from a customer's details.
    const form = showForm && (
        <CustomerForm
            customer={editingCustomer || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
        />
    );

    // If a customer is selected, show the detail view
    if (selectedCustomer) {
        return (
            <>
            {actionError && (
                <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {actionError}
                </div>
            )}
            <CustomerDetailView
                customer={selectedCustomer}
                currentLocationID={currentLocationID}
                initialDrillSheetId={openSheetId}
                onBack={() => { setSelectedCustomerId(null); setOpenSheetId(null); }}
                onEditCustomer={handleEdit}
            />
            {form}
            </>
        );
    }

    if (importing) {
        return (
            <PaperImportPage
                customers={customers}
                locationID={currentLocationID || null}
                onBack={() => setImporting(false)}
                onImported={async (result, input) => {
                    if (customers.some(c => c.id === result.customerID)) return;
                    // A new customer: from the API, or (without sign-in) from what was entered.
                    rememberCustomer(apiEnabled || !('create' in input.customer)
                        ? await customersService.get(result.customerID)
                        : {
                            ...input.customer.create,
                            id: result.customerID,
                            email: input.customer.create.email || undefined,
                            phone: input.customer.create.phone || undefined,
                            notes: input.customer.create.notes || undefined,
                            homeLocationID: input.customer.create.homeLocationID || undefined,
                            createdAt: new Date().toISOString()
                        } as Customer);
                }}
                onOpenSheet={result => {
                    setImporting(false);
                    setOpenSheetId(result.drillSheetID);
                    setPendingCustomerId(result.customerID);
                }}
            />
        );
    }

    const filteredCustomers = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleView = (customer: Customer) => {
        setSelectedCustomerId(customer.id);
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
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" icon={FileImage} onClick={() => setImporting(true)}>
                        Import paper sheets
                    </Button>
                    <Button icon={Plus} onClick={() => setShowForm(true)}>
                        Add Customer
                    </Button>
                </div>
            </div>

            {form}

            <CustomerList
                customers={filteredCustomers}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
            />
        </div>
    );
};