import React, { useState } from 'react';
import { DrillSheet, Customer, SpanMeasurement, HoleSize, BridgeMeasurement } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SpanMeasurementInput } from './SpanMeasurementInput';
import { BridgeInput } from './BridgeInput';
import { HoleSizeInput } from './HoleSizeInput';

interface DrillSheetFormProps {
    drillSheet?: DrillSheet;
    customer?: Customer; // SIMPLIFIED: Just pass the current customer
    onSave: (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const DrillSheetForm: React.FC<DrillSheetFormProps> = ({
                                                                  drillSheet,
                                                                  customer, // SIMPLIFIED: Use the customer we're in context with
                                                                  onSave,
                                                                  onCancel
                                                              }) => {
    const [formData, setFormData] = useState({
        customerID: drillSheet?.customerID || customer?.id || '',
        proshopID: drillSheet?.proshopID || 'proshop1',
        createdByEmployeeID: drillSheet?.createdByEmployeeID || 'emp1',
        name: drillSheet?.name || '',
        gripStyle: drillSheet?.gripStyle || 'FINGERTIP' as const,

        // REFACTORED: Only true span measurements
        spans: {
            thumbToMiddle: drillSheet?.spans.thumbToMiddle || {
                fitSpan: undefined,
                fullSpan: undefined,
                cutToCutSpan: undefined
            },
            thumbToRing: drillSheet?.spans.thumbToRing || {
                fitSpan: undefined,
                fullSpan: undefined,
                cutToCutSpan: undefined
            }
            // middleToRing REMOVED - it's now the bridge
        },

        // NEW: Bridge measurement with default value
        bridge: drillSheet?.bridge || { distance: 0.25 }, // Default 1/4"

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

    const effectiveThumbEnabled = formData.gripStyle !== 'TWO_HANDED_NO_THUMB' && formData.thumbEnabled;

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const updateSpan = (spanType: 'thumbToMiddle' | 'thumbToRing', value: SpanMeasurement) => {
        setFormData(prev => ({
            ...prev,
            spans: {
                ...prev.spans,
                [spanType]: value
            }
        }));
        // Clear span errors
        if (errors.spans) {
            setErrors(prev => ({ ...prev, spans: '' }));
        }
    };

    const updateBridge = (value: BridgeMeasurement) => {
        setFormData(prev => ({ ...prev, bridge: value }));
        // Clear bridge error
        if (errors.bridge) {
            setErrors(prev => ({ ...prev, bridge: '' }));
        }
    };

    const updateHoleSize = (holeType: 'thumb' | 'middle' | 'ring', value: HoleSize) => {
        setFormData(prev => ({ ...prev, [`${holeType}Hole`]: value }));
        // Clear hole size error
        if (errors[`${holeType}Hole`]) {
            setErrors(prev => ({ ...prev, [`${holeType}Hole`]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerID && !formData.isTemplate) {
            newErrors.customerID = 'Customer is required for non-template drill sheets';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Drill sheet name is required';
        }

        // REFACTORED: Validate span measurements (only for thumb-enabled styles)
        if (effectiveThumbEnabled) {
            const hasSpanMeasurements =
                formData.spans.thumbToMiddle.fitSpan ||
                formData.spans.thumbToRing.fitSpan;

            if (!hasSpanMeasurements) {
                newErrors.spans = 'At least one thumb span measurement is required';
            }
        }

        // REFACTORED: Validate bridge measurement
        if (!formData.bridge.distance || formData.bridge.distance < 0.125 || formData.bridge.distance > 1.0) {
            newErrors.bridge = 'Bridge distance must be between 1/8" and 1"';
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
                spans: formData.spans, // Only contains thumbToMiddle and thumbToRing
                bridge: formData.bridge, // NEW: Bridge measurement
                holes: {
                    thumb: effectiveThumbEnabled ? {
                        enabled: true,
                        holeType: formData.thumbHoleType,
                        size: formData.thumbHole,
                        pitchForward: parseFloat(formData.thumbPitchForward) || undefined,
                        pitchLateral: parseFloat(formData.thumbPitchLateral) || undefined
                    } : undefined,
                    middle: {
                        size: formData.middleHole,
                        pitchForward: parseFloat(formData.middlePitchForward) || undefined,
                        pitchLateral: parseFloat(formData.middlePitchLateral) || undefined
                    },
                    ring: {
                        size: formData.ringHole,
                        pitchForward: parseFloat(formData.ringPitchForward) || undefined,
                        pitchLateral: parseFloat(formData.ringPitchLateral) || undefined
                    }
                },
                drillingAngles: {},
                specialNotes: formData.specialNotes,
                isTemplate: formData.isTemplate,
                updatedAt: new Date().toISOString()
            };

            onSave(submitData);
        }
    };

    const gripStyleOptions = [
        { value: 'CONVENTIONAL', label: 'Conventional' },
        { value: 'FINGERTIP', label: 'Fingertip' },
        { value: 'TWO_HANDED_NO_THUMB', label: 'Two-Handed (No Thumb)' }
    ];

    const thumbHoleTypeOptions = [
        { value: 'round', label: 'Round' },
        { value: 'oval', label: 'Oval' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {drillSheet ? 'Edit Drill Sheet' : 'Create New Drill Sheet'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Input
                                    label="Drill Sheet Name"
                                    value={formData.name}
                                    onChange={(value) => updateField('name', value)}
                                    required
                                    error={errors.name}
                                    placeholder="Customer Name - Ball Model"
                                />

                                {/* SIMPLIFIED: Show customer info when available */}
                                {!formData.isTemplate && customer && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Customer
                                        </label>
                                        <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {customer.firstName} {customer.lastName}
                                            <span className="text-gray-500 ml-2">({customer.email})</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Select
                                    label="Grip Style"
                                    value={formData.gripStyle}
                                    onChange={(value) => updateField('gripStyle', value)}
                                    options={gripStyleOptions}
                                    required
                                />

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isTemplate}
                                            onChange={(e) => updateField('isTemplate', e.target.checked)}
                                            className="mr-2"
                                        />
                                        Save as Template
                                    </label>
                                </div>
                            </div>

                            {/* Thumb Configuration */}
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={effectiveThumbEnabled}
                                        onChange={(e) => updateField('thumbEnabled', e.target.checked)}
                                        disabled={formData.gripStyle === 'TWO_HANDED_NO_THUMB'}
                                        className="mr-2"
                                    />
                                    Enable Thumb Hole
                                    {formData.gripStyle === 'TWO_HANDED_NO_THUMB' && (
                                        <span className="text-xs text-gray-500 ml-2">(Disabled for two-handed style)</span>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Span Measurements and Bridge */}
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Measurements</h4>

                            <div className="space-y-6">
                                {effectiveThumbEnabled && (
                                    <>
                                        <SpanMeasurementInput
                                            label="Thumb to Middle Finger Span"
                                            value={formData.spans.thumbToMiddle}
                                            onChange={(value) => updateSpan('thumbToMiddle', value)}
                                            required
                                            error={errors.thumbToMiddleSpan}
                                        />
                                        <SpanMeasurementInput
                                            label="Thumb to Ring Finger Span"
                                            value={formData.spans.thumbToRing}
                                            onChange={(value) => updateSpan('thumbToRing', value)}
                                            required
                                            error={errors.thumbToRingSpan}
                                        />
                                    </>
                                )}

                                {/* NEW: Bridge measurement section - separate from spans */}
                                <BridgeInput
                                    label="Bridge (Middle to Ring Finger)"
                                    value={formData.bridge}
                                    onChange={updateBridge}
                                    required
                                    error={errors.bridge}
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
                                        <h5 className="font-medium text-gray-900 mb-4">Thumb Hole</h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <Select
                                                    label="Thumb Hole Type"
                                                    value={formData.thumbHoleType}
                                                    onChange={(value) => updateField('thumbHoleType', value)}
                                                    options={thumbHoleTypeOptions}
                                                />
                                                <HoleSizeInput
                                                    label="Thumb Hole Size"
                                                    value={formData.thumbHole}
                                                    onChange={(value) => updateHoleSize('thumb', value)}
                                                    holeType="thumb"
                                                    required
                                                    error={errors.thumbHole}
                                                />
                                            </div>

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
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Special Notes</h4>
                            <textarea
                                value={formData.specialNotes}
                                onChange={(e) => updateField('specialNotes', e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Any special drilling instructions, customer preferences, or notes..."
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
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
            </div>
        </div>
    );
};