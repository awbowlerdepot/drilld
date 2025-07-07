import { useState, useEffect } from 'react';
import { DrillSheet, migrateDrillSheetData } from '../types';
import { mockDrillSheets } from '../data/mockData';

export const useDrillSheets = () => {
    const [drillSheets, setDrillSheets] = useState<DrillSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate loading and potential migration of old data
        setTimeout(() => {
            // In a real app, you might need to migrate existing data
            const migratedSheets = mockDrillSheets.map(sheet => {
                // Check if this is old format data that needs migration
                if ('middleToRing' in (sheet as any).spans) {
                    return migrateDrillSheetData(sheet);
                }
                return sheet;
            });

            setDrillSheets(migratedSheets);
            setLoading(false);
        }, 500);
    }, []);

    const addDrillSheet = (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => {
        const newDrillSheet: DrillSheet = {
            ...drillSheet,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            // Ensure bridge has a default value if not provided
            bridge: drillSheet.bridge || { distance: 0.25 }
        };
        setDrillSheets(prev => [...prev, newDrillSheet]);
        return newDrillSheet;
    };

    const updateDrillSheet = (id: string, updates: Partial<DrillSheet>) => {
        setDrillSheets(prev =>
            prev.map(sheet => {
                if (sheet.id === id) {
                    const updatedSheet = { ...sheet, ...updates };

                    // Ensure bridge measurement exists
                    if (!updatedSheet.bridge) {
                        updatedSheet.bridge = { distance: 0.25 };
                    }

                    // If this is an old format update, migrate it
                    if ('middleToRing' in (updates as any)?.spans) {
                        return migrateDrillSheetData(updatedSheet);
                    }

                    return updatedSheet;
                }
                return sheet;
            })
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

    const createFromTemplate = (templateId: string, customerId: string, name: string) => {
        const template = drillSheets.find(sheet => sheet.id === templateId && sheet.isTemplate);
        if (!template) {
            throw new Error('Template not found');
        }

        const newDrillSheet: Omit<DrillSheet, 'id' | 'createdAt'> = {
            ...template,
            customerID: customerId,
            name: name,
            isTemplate: false,
            // Ensure bridge measurement is copied
            bridge: template.bridge || { distance: 0.25 }
        };

        return addDrillSheet(newDrillSheet);
    };

    return {
        drillSheets,
        loading,
        error,
        addDrillSheet,
        updateDrillSheet,
        deleteDrillSheet,
        getDrillSheetsByCustomer,
        getTemplates,
        createFromTemplate
    };
};