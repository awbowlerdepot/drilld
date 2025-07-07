import React, { useState } from 'react';
import { DrillSheet, Customer, SpanMeasurement, HoleSize } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SpanMeasurementInput } from './SpanMeasurementInput';
import { HoleSizeInput } from './HoleSizeInput';

interface DrillSheetFormProps {
    drillSheet?: DrillSheet;
    customers: Customer[];
    onSave: (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    preselectedCustomerId?: string;
}

export const DrillSheetForm: React.FC<DrillSheetFormProps> = ({
                                                                  drillSheet,
                                                                  customers,
                                                                  onSave,
                                                                  onCancel,
                                                                  preselectedCustomerId
                                                              }) => {
    const [formData, setFormData] = useState({
        customerID: drillSheet?.customerID || preselectedCustomerId || '',
        proshopID: drillSheet?.proshopID || 'proshop1',
        createdByEmployeeID: drillSheet?.createdByEmployeeID || 'emp1',
        name: drillSheet?.name || '',
        gripStyle: drillSheet?.gripStyle || 'FINGERTIP' as const,

        // Span measurements
        spans: {
            thumbToMiddle: drillSheet?.spans.thumbToMiddle || { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined },
            thumbToRing: drillSheet?.spans.thumbToRing || { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined },
            middleToRing: drillSheet?.spans.middleToRing || { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined }
        },

        // Hole specifications
        thumbEnabled: drillSheet?.holes.thumb?.enabled ?? true,
        thumbHoleType: drillSheet?.holes.thumb?.holeType || 'round' as const,
        thumbHole: drillSheet?.holes.thumb?.size || { primary: '', depth: undefined },
        thumbPitchForward: drillSheet?.holes.thumb?.pitchForward?.toString() || '',
        thumbPitchLateral: drillSheet?.holes.thumb?.pitchLateral?.toString() || '',

        middleHole: drillSheet?.holes.middle?.size || { primary: '', depth: undefined },
        middlePitchForward: drillSheet?.holes.middle?.pitchForward?.toString() || '',
        middlePitchLateral: drillSheet?.holes.middle?.pitchLateral?.toString() || '',

        ringHole: drillSheet?.holes.ring?.size || { primary: '', depth: undefined },
        ringPitchForward: drillSheet?.holes.ring?.pitchForward?.toString() || '',
        ringPitchLateral: drillSheet?.holes.ring?.pitchLateral?.toString() || '',

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

        // Validate that at least one span measurement is provided
        const hasSpanMeasurements =
            formData.spans.thumbToMiddle.fitSpan ||
            formData.spans.thumbToRing.fitSpan ||
            formData.spans.middleToRing.fitSpan;

        if (!hasSpanMeasurements) {
            newErrors.spans = 'At least one span measurement is required';
        }

        // Validate hole sizes for enabled holes
        if (effectiveThumbEnabled && !formData.thumbHole.primary) {
            newErrors.thumbHole = 'Thumb hole size is required when thumb is enabled';
        }

        if (!formData.middleHole.primary) {
            newErrors.middleHole = 'Middle finger hole size is required';
        }

        if (!formData.ringHole.primary) {
            newErrors.ringHole = 'Ring finger hole size is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            const submitData: Omit<DrillSheet, 'id' | 'createdAt'> = {
                customerID: formData.customerID,
                proshopID: formData.proshopID,
                createdByEmployeeID: formData.createdByEmployeeID,
                name: formData.name,
                gripStyle: formData.gripStyle,
                spans: formData.spans,
                holes: {
                    thumb: effectiveThumbEnabled ? {
                        enabled: true,
                        holeType: formData.thumbHoleType,
                        size: formData.thumbHole,
                        pitchForward: formData.thumbPitchForward ? parseFloat(formData.thumbPitchForward) : undefined,
                        pitchLateral: formData.thumbPitchLateral ? parseFloat(formData.thumbPitchLateral) : undefined
                    } : {
                        enabled: false,
                        holeType: 'round',
                        size: { primary: '', depth: 0 }
                    },
                    middle: {
                        size: formData.middleHole,
                        pitchForward: formData.middlePitchForward ? parseFloat(formData.middlePitchForward) : undefined,
                        pitchLateral: formData.middlePitchLateral ? parseFloat(formData.middlePitchLateral) : undefined
                    },
                    ring: {
                        size: formData.ringHole,
                        pitchForward: formData.ringPitchForward ? parseFloat(formData.ringPitchForward) : undefined,
                        pitchLateral: formData.ringPitchLateral ? parseFloat(formData.ringPitchLateral) : undefined
                    }
                },
                specialNotes: formData.specialNotes || undefined,
                isTemplate: formData.isTemplate
            };

            onSave(submitData);
        }
    };

    const updateSpan = (spanType: 'thumbToMiddle' | 'thumbToRing' | 'middleToRing', value: SpanMeasurement) => {
        setFormData(prev => ({
            ...prev,
            spans: {
                ...prev.spans,
                [spanType]: value
            }
        }));
        // Clear span errors when user starts entering data
        if (errors.spans) {
            setErrors(prev => ({ ...prev, spans: '' }));
        }
    };

    const updateHoleSize = (holeType: 'thumb' | 'middle' | 'ring', value: HoleSize) => {
        setFormData(prev => ({
            ...prev,
            [`${holeType}Hole`]: value
        }));
        // Clear hole errors when user starts entering data
        if (errors[`${holeType}Hole`]) {
            setErrors(prev => ({ ...prev, [`${holeType}Hole`]: '' }));
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`
    }));

    const gripStyleOptions = [
        { value: 'CONVENTIONAL', label: 'Conventional' },
        { value: 'FINGERTIP', label: 'Fingertip' },
        { value: 'TWO_HANDED_NO_THUMB', label: 'Two-Handed (No Thumb)' }
    ];

    // Auto-disable thumb for two-handed style
    const effectiveThumbEnabled = formData.gripStyle === 'TWO_HANDED_NO_THUMB' ? false : formData.thumbEnabled;

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
                {drillSheet ? 'Edit Drill Sheet' : 'Create New Drill Sheet'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
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
                        options={gripStyleOptions}
                        required
                    />
                    <div className="flex items-center space-x-4 pt-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={effectiveThumbEnabled}
                                onChange={(e) => updateField('thumbEnabled', e.target.checked)}
                                disabled={formData.gripStyle === 'TWO_HANDED_NO_THUMB'}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">Enable Thumb Hole</span>
                        </label>
                        {formData.gripStyle === 'TWO_HANDED_NO_THUMB' && (
                            <span className="text-xs text-gray-500">(Disabled for two-handed style)</span>
                        )}
                    </div>
                </div>

                {/* Span Measurements */}
                <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Span Measurements</h4>

                    <div className="space-y-6">
                        {effectiveThumbEnabled && (
                            <>
                                <SpanMeasurementInput
                                    label="Thumb to Middle Finger"
                                    value={formData.spans.thumbToMiddle}
                                    onChange={(value) => updateSpan('thumbToMiddle', value)}
                                    required
                                    error={errors.thumbToMiddleSpan}
                                />
                                <SpanMeasurementInput
                                    label="Thumb to Ring Finger"
                                    value={formData.spans.thumbToRing}
                                    onChange={(value) => updateSpan('thumbToRing', value)}
                                    required
                                    error={errors.thumbToRingSpan}
                                />
                            </>
                        )}
                        <SpanMeasurementInput
                            label="Middle to Ring Finger"
                            value={formData.spans.middleToRing}
                            onChange={(value) => updateSpan('middleToRing', value)}
                            required
                            error={errors.middleToRingSpan}
                        />
                        {errors.spans && (
                            <div className="text-sm text-red-600">{errors.spans}</div>
                        )}
                    </div>
                </div>

                {/* Hole Specifications */}
                <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Hole Specifications</h4>

                    <div className="space-y-8">
                        {/* Thumb Hole */}
                        {effectiveThumbEnabled && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-medium text-gray-900">Thumb Hole</h5>
                                    <Select
                                        label="Hole Type"
                                        value={formData.thumbHoleType}
                                        onChange={(value) => updateField('thumbHoleType', value)}
                                        options={[
                                            { value: 'round', label: 'Round' },
                                            { value: 'oval', label: 'Oval' }
                                        ]}
                                        className="w-32"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <HoleSizeInput
                                        label="Thumb Hole Size"
                                        value={formData.thumbHole}
                                        onChange={(value) => updateHoleSize('thumb', value)}
                                        holeType="thumb"
                                        required
                                        error={errors.thumbHole}
                                    />

                                    <div className="space-y-3">
                                        <h6 className="font-medium text-gray-700">Thumb Pitch</h6>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Forward Pitch"
                                                type="number"
                                                step="0.001"
                                                value={formData.thumbPitchForward}
                                                onChange={(value) => updateField('thumbPitchForward', value)}
                                                placeholder="0.125"
                                            />
                                            <Input
                                                label="Lateral Pitch"
                                                type="number"
                                                step="0.001"
                                                value={formData.thumbPitchLateral}
                                                onChange={(value) => updateField('thumbPitchLateral', value)}
                                                placeholder="0.25"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Middle Finger Hole */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-4">Middle Finger Hole</h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <HoleSizeInput
                                    label="Middle Finger Size"
                                    value={formData.middleHole}
                                    onChange={(value) => updateHoleSize('middle', value)}
                                    holeType="finger"
                                    required
                                    error={errors.middleHole}
                                />

                                <div className="space-y-3">
                                    <h6 className="font-medium text-gray-700">Middle Finger Pitch</h6>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Forward Pitch"
                                            type="number"
                                            step="0.001"
                                            value={formData.middlePitchForward}
                                            onChange={(value) => updateField('middlePitchForward', value)}
                                            placeholder="0.375"
                                        />
                                        <Input
                                            label="Lateral Pitch"
                                            type="number"
                                            step="0.001"
                                            value={formData.middlePitchLateral}
                                            onChange={(value) => updateField('middlePitchLateral', value)}
                                            placeholder="0.125"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ring Finger Hole */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-4">Ring Finger Hole</h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <HoleSizeInput
                                    label="Ring Finger Size"
                                    value={formData.ringHole}
                                    onChange={(value) => updateHoleSize('ring', value)}
                                    holeType="finger"
                                    required
                                    error={errors.ringHole}
                                />

                                <div className="space-y-3">
                                    <h6 className="font-medium text-gray-700">Ring Finger Pitch</h6>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Forward Pitch"
                                            type="number"
                                            step="0.001"
                                            value={formData.ringPitchForward}
                                            onChange={(value) => updateField('ringPitchForward', value)}
                                            placeholder="0.375"
                                        />
                                        <Input
                                            label="Lateral Pitch"
                                            type="number"
                                            step="0.001"
                                            value={formData.ringPitchLateral}
                                            onChange={(value) => updateField('ringPitchLateral', value)}
                                            placeholder="0.125"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Special Notes */}
                <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Notes & Instructions
                    </label>
                    <textarea
                        rows={4}
                        value={formData.specialNotes}
                        onChange={(e) => updateField('specialNotes', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special drilling instructions, customer preferences, or notes..."
                    />
                </div>

                {/* Template Option */}
                <div className="border-t pt-6">
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
                    {formData.isTemplate && (
                        <p className="mt-2 text-sm text-gray-500">
                            Templates can be used as starting points for new customers with similar specifications.
                        </p>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                    >
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