import { useCallback, useEffect, useState } from 'react';
import { Customer } from '../types';
import { mockCustomers } from '../data/mockData';
import { apiEnabled } from '../services/config';
import { customersService } from '../services/customersService';

type CustomerFields = Omit<Customer, 'id' | 'createdAt'>;

/**
 * Customers for the signed-in company. Reads and writes through the REST API
 * when signed in; otherwise (local development without auth) uses mock data.
 * Add, update and delete return promises and reject if the API refuses.
 */
export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = apiEnabled
            ? customersService.list()
            : new Promise<Customer[]>(resolve => setTimeout(() => resolve(mockCustomers), 500));

        load
            .then(result => { if (!cancelled) setCustomers(result); })
            .catch((err: Error) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const addCustomer = useCallback(async (customer: CustomerFields) => {
        const created = apiEnabled
            ? await customersService.create(customer)
            : { ...customer, id: Date.now().toString(), createdAt: new Date().toISOString() };
        setCustomers(prev => [...prev, created]);
        return created;
    }, []);

    const updateCustomer = useCallback(async (id: string, updates: Partial<CustomerFields>) => {
        if (apiEnabled) {
            const updated = await customersService.update(id, updates);
            setCustomers(prev => prev.map(customer => (customer.id === id ? updated : customer)));
        } else {
            setCustomers(prev => prev.map(customer => (customer.id === id ? { ...customer, ...updates } : customer)));
        }
    }, []);

    const deleteCustomer = useCallback(async (id: string) => {
        if (apiEnabled) await customersService.remove(id);
        setCustomers(prev => prev.filter(customer => customer.id !== id));
    }, []);

    const getCustomerById = useCallback(
        (id: string) => customers.find(customer => customer.id === id),
        [customers]
    );

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
