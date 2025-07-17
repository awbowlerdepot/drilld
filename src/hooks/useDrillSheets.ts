// REPLACE ENTIRE CONTENTS of src/hooks/useDrillSheets.ts

import { useState, useEffect } from 'react';
import { DrillSheet } from '../types/drillsheet';
import { mockDrillSheets } from '../data/mockData';

export const useDrillSheets = () => {
    const [drillSheets, setDrillSheets] = useState<DrillSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setDrillSheets(mockDrillSheets);
            setLoading(false);
        }, 500);
    }, []);

    const addDrillSheet = (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => {
        const newDrillSheet: DrillSheet = {
            ...drillSheet,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: drillSheet.status || 'DRAFT',
            version: 1,
            // Ensure bridge has a default value if not provided
            bridge: drillSheet.bridge || { distance: 0.25 },
            // Ensure all hole sizes have insert fields initialized
            holes: {
                ...drillSheet.holes,
                thumb: drillSheet.holes.thumb ? {
                    ...drillSheet.holes.thumb,
                    size: {
                        ...drillSheet.holes.thumb.size,
                        hasInsert: drillSheet.holes.thumb.size.hasInsert || false,
                        insert: drillSheet.holes.thumb.size.insert || undefined
                    }
                } : undefined,
                middle: drillSheet.holes.middle ? {
                    ...drillSheet.holes.middle,
                    size: {
                        ...drillSheet.holes.middle.size,
                        hasInsert: drillSheet.holes.middle.size.hasInsert || false,
                        insert: drillSheet.holes.middle.size.insert || undefined
                    }
                } : undefined,
                ring: drillSheet.holes.ring ? {
                    ...drillSheet.holes.ring,
                    size: {
                        ...drillSheet.holes.ring.size,
                        hasInsert: drillSheet.holes.ring.size.hasInsert || false,
                        insert: drillSheet.holes.ring.size.insert || undefined
                    }
                } : undefined,
                index: drillSheet.holes.index ? {
                    ...drillSheet.holes.index,
                    size: {
                        ...drillSheet.holes.index.size,
                        hasInsert: drillSheet.holes.index.size.hasInsert || false,
                        insert: drillSheet.holes.index.size.insert || undefined
                    }
                } : undefined,
                pinky: drillSheet.holes.pinky ? {
                    ...drillSheet.holes.pinky,
                    size: {
                        ...drillSheet.holes.pinky.size,
                        hasInsert: drillSheet.holes.pinky.size.hasInsert || false,
                        insert: drillSheet.holes.pinky.size.insert || undefined
                    }
                } : undefined
            }
        };
        setDrillSheets(prev => [...prev, newDrillSheet]);
        return newDrillSheet;
    };

    const updateDrillSheet = (id: string, updates: Partial<DrillSheet>) => {
        setDrillSheets(prev =>
            prev.map(sheet => {
                if (sheet.id === id) {
                    const updatedSheet = {
                        ...sheet,
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };

                    // Ensure bridge measurement exists
                    if (!updatedSheet.bridge) {
                        updatedSheet.bridge = { distance: 0.25 };
                    }

                    // Ensure all hole sizes have insert fields
                    if (updatedSheet.holes) {
                        Object.keys(updatedSheet.holes).forEach(holeKey => {
                            const hole = (updatedSheet.holes as any)[holeKey];
                            if (hole && hole.size) {
                                hole.size.hasInsert = hole.size.hasInsert || false;
                                if (!hole.size.hasInsert) {
                                    hole.size.insert = undefined;
                                }
                            }
                        });
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
            status: 'DRAFT',
            // Ensure bridge measurement is copied
            bridge: template.bridge || { distance: 0.25 },
            // Copy all hole specifications including inserts
            holes: {
                thumb: template.holes.thumb ? {
                    ...template.holes.thumb,
                    size: {
                        ...template.holes.thumb.size,
                        hasInsert: template.holes.thumb.size.hasInsert || false,
                        insert: template.holes.thumb.size.hasInsert && template.holes.thumb.size.insert
                            ? { ...template.holes.thumb.size.insert }
                            : undefined
                    }
                } : undefined,
                middle: template.holes.middle ? {
                    ...template.holes.middle,
                    size: {
                        ...template.holes.middle.size,
                        hasInsert: template.holes.middle.size.hasInsert || false,
                        insert: template.holes.middle.size.hasInsert && template.holes.middle.size.insert
                            ? { ...template.holes.middle.size.insert }
                            : undefined
                    }
                } : undefined,
                ring: template.holes.ring ? {
                    ...template.holes.ring,
                    size: {
                        ...template.holes.ring.size,
                        hasInsert: template.holes.ring.size.hasInsert || false,
                        insert: template.holes.ring.size.hasInsert && template.holes.ring.size.insert
                            ? { ...template.holes.ring.size.insert }
                            : undefined
                    }
                } : undefined,
                index: template.holes.index ? {
                    ...template.holes.index,
                    size: {
                        ...template.holes.index.size,
                        hasInsert: template.holes.index.size.hasInsert || false,
                        insert: template.holes.index.size.hasInsert && template.holes.index.size.insert
                            ? { ...template.holes.index.size.insert }
                            : undefined
                    }
                } : undefined,
                pinky: template.holes.pinky ? {
                    ...template.holes.pinky,
                    size: {
                        ...template.holes.pinky.size,
                        hasInsert: template.holes.pinky.size.hasInsert || false,
                        insert: template.holes.pinky.size.hasInsert && template.holes.pinky.size.insert
                            ? { ...template.holes.pinky.size.insert }
                            : undefined
                    }
                } : undefined,
                additionalHoles: template.holes.additionalHoles ? [...template.holes.additionalHoles] : undefined
            }
        };

        return addDrillSheet(newDrillSheet);
    };

    const validateDrillSheet = (drillSheet: DrillSheet) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic validation
        if (!drillSheet.name.trim()) {
            errors.push('Drill sheet name is required');
        }

        // Span validation for thumb-enabled styles
        if (drillSheet.gripStyle !== 'TWO_HANDED_NO_THUMB') {
            const hasSpanMeasurements =
                drillSheet.spans.thumbToMiddle.fitSpan ||
                drillSheet.spans.thumbToRing.fitSpan;

            if (!hasSpanMeasurements) {
                errors.push('At least one thumb span measurement is required');
            }
        }

        // Hole validation
        if (drillSheet.holes.middle && !drillSheet.holes.middle.size.primary) {
            errors.push('Middle finger hole size is required');
        }

        if (drillSheet.holes.ring && !drillSheet.holes.ring.size.primary) {
            errors.push('Ring finger hole size is required');
        }

        // Insert validation
        const holesWithInserts = [
            { name: 'middle', hole: drillSheet.holes.middle },
            { name: 'ring', hole: drillSheet.holes.ring },
            { name: 'index', hole: drillSheet.holes.index },
            { name: 'pinky', hole: drillSheet.holes.pinky }
        ].filter(({ hole }) => hole?.size.hasInsert);

        holesWithInserts.forEach(({ name, hole }) => {
            if (!hole?.size.insert) {
                errors.push(`${name} finger hole is marked to use insert but insert details are missing`);
            } else {
                const insert = hole.size.insert;
                if (!insert.manufacturer || !insert.insertSize || !insert.outsideHoleSize) {
                    errors.push(`${name} finger insert is missing required information`);
                }

                if (hole.size.primary !== insert.outsideHoleSize) {
                    warnings.push(`${name} finger hole size (${hole.size.primary}) doesn't match insert outside hole size (${insert.outsideHoleSize})`);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
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
        createFromTemplate,
        validateDrillSheet
    };
};