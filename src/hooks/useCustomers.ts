import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { mockCustomers } from '../data/mockData';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setCustomers(mockCustomers);
            setLoading(false);
        }, 500);
    }, []);

    const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
        const newCustomer: Customer = {
            ...customer,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    };

    const updateCustomer = (id: string, updates: Partial<Customer>) => {
        setCustomers(prev =>
            prev.map(customer =>
                customer.id === id ? { ...customer, ...updates } : customer
            )
        );
    };

    const deleteCustomer = (id: string) => {
        setCustomers(prev => prev.filter(customer => customer.id !== id));
    };

    const getCustomerById = (id: string) => {
        return customers.find(customer => customer.id === id);
    };

    return {
        customers,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById
    };
};