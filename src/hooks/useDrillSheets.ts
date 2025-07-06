import { useState, useEffect } from 'react';
import { DrillSheet } from '../types';
import { mockDrillSheets } from '../data/mockData';

export const useDrillSheets = () => {
    const [drillSheets, setDrillSheets] = useState<DrillSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTimeout(() => {
            setDrillSheets(mockDrillSheets);
            setLoading(false);
        }, 500);
    }, []);

    const addDrillSheet = (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => {
        const newDrillSheet: DrillSheet = {
            ...drillSheet,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        setDrillSheets(prev => [...prev, newDrillSheet]);
        return newDrillSheet;
    };

    const updateDrillSheet = (id: string, updates: Partial<DrillSheet>) => {
        setDrillSheets(prev =>
            prev.map(sheet =>
                sheet.id === id ? { ...sheet, ...updates } : sheet
            )
        );
    };

    const deleteDrillSheet = (id: string) => {
        setDrillSheets(prev => prev.filter(sheet => sheet.id !== id));
    };

    const getDrillSheetsByCustomer = (customerId: string) => {
        return drillSheets.filter(sheet => sheet.customerID === customerId);
    };

    const getTemplates = () => {
        return drillSheets.filter(sheet => sheet.isTemplate);
    };

    return {
        drillSheets,
        loading,
        error,
        addDrillSheet,
        updateDrillSheet,
        deleteDrillSheet,
        getDrillSheetsByCustomer,
        getTemplates
    };
};