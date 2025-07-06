import React, { useState } from 'react';
import { DrillSheet, Customer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface DrillSheetFormProps {
    drillSheet?: DrillSheet;
    customers: Customer[];
    onSave: (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const DrillSheetForm: React.FC<DrillSheetFormProps> = ({
                                                                  drillSheet,
                                                                  customers,
                                                                  onSave,
                                                                  onCancel
                                                              }) => {
    const [formData, setFormData] = useState({
        customerID: drillSheet?.customerID || '',
        name: drillSheet?.name || '',
        gripStyle: drillSheet?.gripStyle || 'FINGERTIP' as const,
        thumbEnabled: drillSheet?.thumbEnabled ?? true,
        thumbToMiddleFit: drillSheet?.thumbToMiddleFit?.toString() || '',
        thumbToRingFit: drillSheet?.thumbToRingFit?.toString() || '',
        middleToRingFit: drillSheet?.middleToRingFit?.toString() || '',
        thumbPitchForward: drillSheet?.thumbPitchForward?.toString() || '',
        thumbPitchLateral: drillSheet?.thumbPitchLateral?.toString() || '',
        middleFingerPitchForward: drillSheet?.middleFingerPitchForward?.toString() || '',
        middleFingerPitchLateral: drillSheet?.middleFingerPitchLateral?.toString() || '',
        ringFingerPitchForward: drillSheet?.ringFingerPitchForward?.toString() || '',
        ringFingerPitchLateral: drillSheet?.ringFingerPitchLateral?.toString() || '',
        specialNotes: drillSheet?.specialNotes || '',
        isTemplate: drillSheet?.isTemplate || false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerID && !formData.isTemplate) {
            newErrors.customerID = 'Customer is required for non-template drill sheets';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Drill sheet name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            const submitData = {
                ...formData,
                thumbToMiddleFit: formData.thumbToMiddleFit ? parseFloat(formData.thumbToMiddleFit) : undefined,
                thumbToRingFit: formData.thumbToRingFit ? parseFloat(formData.thumbToRingFit) : undefined,
                middleToRingFit: formData.middleToRingFit ? parseFloat(formData.middleToRingFit) : undefined,
                thumbPitchForward: formData.thumbPitchForward ? parseFloat(formData.thumbPitchForward) : undefined,
                thumbPitchLateral: formData.thumbPitchLateral ? parseFloat(formData.thumbPitchLateral) : undefined,
                middleFingerPitchForward: formData.middleFingerPitchForward ? parseFloat(formData.middleFingerPitchForward) : undefined,
                middleFingerPitchLateral: formData.middleFingerPitchLateral ? parseFloat(formData.middleFingerPitchLateral) : undefined,
                ringFingerPitchForward: formData.ringFingerPitchForward ? parseFloat(formData.ringFingerPitchForward) : undefined,
                ringFingerPitchLateral: formData.ringFingerPitchLateral ? parseFloat(formData.ringFingerPitchLateral) : undefined,
            };

            onSave(submitData);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`
    }));

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
                {drillSheet ? 'Edit Drill Sheet' : 'Create New Drill Sheet'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Customer"
                        value={formData.customerID}
                        onChange={(value) => updateField('customerID', value)}
                        options={customerOptions}
                        placeholder="Select Customer"
                        required={!formData.isTemplate}
                        error={errors.customerID}
                        disabled={formData.isTemplate}
                    />
                    <Input
                        label="Drill Sheet Name"
                        value={formData.name}
                        onChange={(value) => updateField('name', value)}
                        placeholder="e.g., John's Fingertip Spec #1"
                        required
                        error={errors.name}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Grip Style"
                        value={formData.gripStyle}
                        onChange={(value) => updateField('gripStyle', value)}
                        options={[
                            { value: 'CONVENTIONAL', label: 'Conventional' },
                            { value: 'FINGERTIP', label: 'Fingertip' },
                            { value: 'TWO_HANDED_NO_THUMB', label: 'Two-Handed (No Thumb)' }
                        ]}
                        required
                    />
                    <Select
                        label="Thumb Enabled"
                        value={formData.thumbEnabled ? 'true' : 'false'}
                        onChange={(value) => updateField('thumbEnabled', value === 'true')}
                        options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' }
                        ]}
                        required
                    />
                </div>

                <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Span Measurements (inches)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Thumb to Middle (Fit)"
                            type="number"
                            step="0.01"
                            value={formData.thumbToMiddleFit}
                            onChange={(value) => updateField('thumbToMiddleFit', value)}
                            placeholder="4.40"
                        />
                        <Input
                            label="Thumb to Ring (Fit)"
                            type="number"
                            step="0.01"
                            value={formData.thumbToRingFit}
                            onChange={(value) => updateField('thumbToRingFit', value)}
                            placeholder="4.90"
                        />
                        <Input
                            label="Middle to Ring (Fit)"
                            type="number"
                            step="0.01"
                            value={formData.middleToRingFit}
                            onChange={(value) => updateField('middleToRingFit', value)}
                            placeholder="0.85"
                        />
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Pitch Settings (inches)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Input
                            label="Thumb Forward Pitch"
                            type="number"
                            step="0.001"
                            value={formData.thumbPitchForward}
                            onChange={(value) => updateField('thumbPitchForward', value)}
                            placeholder="0.125"
                        />
                        <Input
                            label="Thumb Lateral Pitch"
                            type="number"
                            step="0.001"
                            value={formData.thumbPitchLateral}
                            onChange={(value) => updateField('thumbPitchLateral', value)}
                            placeholder="0.25"
                        />
                        <Input
                            label="Middle Forward Pitch"
                            type="number"
                            step="0.001"
                            value={formData.middleFingerPitchForward}
                            onChange={(value) => updateField('middleFingerPitchForward', value)}
                            placeholder="0.375"
                        />
                        <Input
                            label="Middle Lateral Pitch"
                            type="number"
                            step="0.001"
                            value={formData.middleFingerPitchLateral}
                            onChange={(value) => updateField('middleFingerPitchLateral', value)}
                            placeholder="0.125"
                        />
                        <Input
                            label="Ring Forward Pitch"
                            type="number"
                            step="0.001"
                            value={formData.ringFingerPitchForward}
                            onChange={(value) => updateField('ringFingerPitchForward', value)}
                            placeholder="0.375"
                        />
                        <Input
                            label="Ring Lateral Pitch"
                            type="number"
                            step="0.001"
                            value={formData.ringFingerPitchLateral}
                            onChange={(value) => updateField('ringFingerPitchLateral', value)}
                            placeholder="0.125"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Notes
                    </label>
                    <textarea
                        rows={3}
                        value={formData.specialNotes}
                        onChange={(e) => updateField('specialNotes', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special drilling instructions or customer preferences..."
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.isTemplate}
                        onChange={(e) => updateField('isTemplate', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                        Save as template for other customers
                    </label>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {drillSheet ? 'Update Drill Sheet' : 'Create Drill Sheet'}
                    </Button>
                </div>
            </form>
        </div>
    );
};