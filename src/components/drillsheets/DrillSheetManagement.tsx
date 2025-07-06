import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DrillSheet } from '../../types';
import { useDrillSheets } from '../../hooks/useDrillSheets';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../ui/Button';
import { DrillSheetForm } from './DrillSheetForm';
import { DrillSheetCard } from './DrillSheetCard';

interface DrillSheetManagementProps {
    searchTerm: string;
}

export const DrillSheetManagement: React.FC<DrillSheetManagementProps> = ({
                                                                              searchTerm
                                                                          }) => {
    const { drillSheets, loading, addDrillSheet, updateDrillSheet } = useDrillSheets();
    const { customers, getCustomerById } = useCustomers();
    const [showForm, setShowForm] = useState(false);
    const [editingDrillSheet, setEditingDrillSheet] = useState<DrillSheet | null>(null);

    const filteredDrillSheets = drillSheets.filter(sheet =>
        sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.gripStyle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = (drillSheetData: Omit<DrillSheet, 'id' | 'createdAt'>) => {
        if (editingDrillSheet) {
            updateDrillSheet(editingDrillSheet.id, drillSheetData);
        } else {
            addDrillSheet(drillSheetData);
        }
        setShowForm(false);
        setEditingDrillSheet(null);
    };

    const handleEdit = (drillSheet: DrillSheet) => {
        setEditingDrillSheet(drillSheet);
        setShowForm(true);
    };

    const handleView = (drillSheet: DrillSheet) => {
        // TODO: Implement view modal/page
        console.log('View drill sheet:', drillSheet);
    };

    const handlePrint = (drillSheet: DrillSheet) => {
        // TODO: Implement print functionality
        console.log('Print drill sheet:', drillSheet);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingDrillSheet(null);
    };

    if (loading) {
        return <div className="flex justify-center py-8">Loading drill sheets...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Drill Sheets</h2>
                <Button icon={Plus} onClick={() => setShowForm(true)}>
                    Create Drill Sheet
                </Button>
            </div>

            {showForm && (
                <DrillSheetForm
                    drillSheet={editingDrillSheet || undefined}
                    customers={customers}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDrillSheets.map((sheet) => (
                    <DrillSheetCard
                        key={sheet.id}
                        drillSheet={sheet}
                        customer={getCustomerById(sheet.customerID)}
                        onEdit={handleEdit}
                        onView={handleView}
                        onPrint={handlePrint}
                    />
                ))}
            </div>

            {filteredDrillSheets.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No drill sheets found.</p>
                    <Button
                        variant="secondary"
                        onClick={() => setShowForm(true)}
                        className="mt-4"
                    >
                        Create your first drill sheet
                    </Button>
                </div>
            )}
        </div>
    );
};