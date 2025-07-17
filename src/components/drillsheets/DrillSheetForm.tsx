// MODIFY EXISTING src/components/drillsheets/DrillSheetForm.tsx
// UPDATE imports and form data initialization

import React, { useState } from 'react';
import { Customer} from "@/types";
import { DrillSheet, SpanMeasurement, BridgeMeasurement, HoleSize } from '../../types/drillsheet'; // UPDATED IMPORT
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SpanMeasurementInput } from './SpanMeasurementInput';
import { BridgeInput } from './BridgeInput';
import { HoleSizeInput } from './HoleSizeInput'; // KEEP SAME NAME

interface DrillSheetFormProps {
    drillSheet?: DrillSheet;
    customer?: Customer;
    onSave: (drillSheet: Omit<DrillSheet, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const DrillSheetForm: React.FC<DrillSheetFormProps> = ({
                                                                  drillSheet,
                                                                  customer,
                                                                  onSave,
                                                                  onCancel
                                                              }) => {
    const [formData, setFormData] = useState({
        customerID: drillSheet?.customerID || customer?.id || '',
        proshopID: drillSheet?.proshopID || 'proshop1',
        createdByEmployeeID: drillSheet?.createdByEmployeeID || 'emp1',
        name: drillSheet?.name || '',
        gripStyle: drillSheet?.gripStyle || 'FINGERTIP' as const,

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
        },

        bridge: drillSheet?.bridge || { distance: 0.25 },

        // UPDATED: Enhanced hole sizes with insert support
        thumbEnabled: drillSheet?.holes.thumb?.enabled ?? true,
        thumbHoleType: drillSheet?.holes.thumb?.holeType || 'round' as const,
        thumbHole: drillSheet?.holes.thumb?.size || {
            primary: '',
            depth: undefined,
            hasInsert: false,
            insert: undefined
        } as HoleSize, // UPDATED TYPE
        thumbPitchForward: drillSheet?.holes.thumb?.pitch?.forward?.toString() || '',
        thumbPitchLateral: drillSheet?.holes.thumb?.pitch?.lateral?.toString() || '',

        middleHole: drillSheet?.holes.middle?.size || {
            primary: '',
            depth: undefined,
            hasInsert: false,
            insert: undefined
        } as HoleSize, // UPDATED TYPE
        middlePitchForward: drillSheet?.holes.middle?.pitch?.forward?.toString() || '',
        middlePitchLateral: drillSheet?.holes.middle?.pitch?.lateral?.toString() || '',

        ringHole: drillSheet?.holes.ring?.size || {
            primary: '',
            depth: undefined,
            hasInsert: false,
            insert: undefined
        } as HoleSize, // UPDATED TYPE
        ringPitchForward: drillSheet?.holes.ring?.pitch?.forward?.toString() || '',
        ringPitchLateral: drillSheet?.holes.ring?.pitch?.lateral?.toString() || '',

        specialNotes: drillSheet?.specialNotes || '',
        isTemplate: drillSheet?.isTemplate || false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const effectiveThumbEnabled = formData.gripStyle !== 'TWO_HANDED_NO_THUMB' && formData.thumbEnabled;

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
        if (errors.spans) {
            setErrors(prev => ({ ...prev, spans: '' }));
        }
    };

    const updateBridge = (value: BridgeMeasurement) => {
        setFormData(prev => ({ ...prev, bridge: value }));
        if (errors.bridge) {
            setErrors(prev => ({ ...prev, bridge: '' }));
        }
    };

    // UPDATED: Now handles HoleSize with insert support
    const updateHoleSize = (holeType: 'thumb' | 'middle' | 'ring', value: HoleSize) => {
        setFormData(prev => ({ ...prev, [`${holeType}Hole`]: value }));
        if (errors[`${holeType}Hole`]) {
            setErrors(prev => ({ ...prev, [`${holeType}Hole`]: '' }));
        }
    };

    // Rest of validation and submit logic stays the same...
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerID && !formData.isTemplate) {
            newErrors.customerID = 'Customer is required for non-template drill sheets';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Drill sheet name is required';
        }

        if (effectiveThumbEnabled) {
            const hasSpanMeasurements =
                formData.spans.thumbToMiddle.fitSpan ||
                formData.spans.thumbToRing.fitSpan;

            if (!hasSpanMeasurements) {
                newErrors.spans = 'At least one thumb span measurement is required';
            }
        }

        if (!formData.bridge.distance || formData.bridge.distance < 0.125 || formData.bridge.distance > 1.0) {
            newErrors.bridge = 'Bridge distance must be between 1/8" and 1"';
        }

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
                status: 'DRAFT',
                gripStyle: formData.gripStyle,
                isTemplate: formData.isTemplate,
                version: 1,
                spans: formData.spans,
                bridge: formData.bridge,
                holes: {
                    thumb: effectiveThumbEnabled ? {
                        enabled: true,
                        holeType: formData.thumbHoleType,
                        size: formData.thumbHole, // Now includes insert data
                        pitch: {
                            forward: parseFloat(formData.thumbPitchForward) || undefined,
                            lateral: parseFloat(formData.thumbPitchLateral) || undefined
                        }
                    } : undefined,
                    middle: {
                        size: formData.middleHole, // Now includes insert data
                        pitch: {
                            forward: parseFloat(formData.middlePitchForward) || undefined,
                            lateral: parseFloat(formData.middlePitchLateral) || undefined
                        }
                    },
                    ring: {
                        size: formData.ringHole, // Now includes insert data
                        pitch: {
                            forward: parseFloat(formData.ringPitchForward) || undefined,
                            lateral: parseFloat(formData.ringPitchLateral) || undefined
                        }
                    }
                },
                specialNotes: formData.specialNotes,
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
                        {drillSheet ? 'Edit Drill Sheet' : 'Create Drill Sheet'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information - unchanged */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Drill Sheet Name"
                                value={formData.name}
                                onChange={(value) => updateField('name', value)}
                                placeholder="Customer Name - Ball Model"
                                required
                                error={errors.name}
                            />
                            <Select
                                label="Grip Style"
                                value={formData.gripStyle}
                                onChange={(value) => updateField('gripStyle', value)}
                                options={gripStyleOptions}
                                required
                            />
                        </div>

                        {/* Measurements - unchanged */}
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Measurements</h4>
                            <div className="space-y-4">
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

                                <BridgeInput
                                    label="Bridge (Middle to Ring Finger)"
                                    value={formData.bridge}
                                    onChange={updateBridge}
                                    required
                                    error={errors.bridge}
                                />
                            </div>
                        </div>

                        {/* Hole Specifications - UPDATED with EnhancedHoleSizeInput */}
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
                                                {/* UPDATED: Using HoleSizeInput (same name, enhanced functionality) */}
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

                                {/* Middle Finger Hole - UPDATED */}
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h5 className="font-medium text-gray-900 mb-4">Middle Finger Hole</h5>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* UPDATED: Using HoleSizeInput (same name, enhanced functionality) */}
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

                                {/* Ring Finger Hole - UPDATED */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h5 className="font-medium text-gray-900 mb-4">Ring Finger Hole</h5>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* UPDATED: Using HoleSizeInput (same name, enhanced functionality) */}
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

                        {/* Notes and Template - unchanged */}
                        <div className="border-t pt-6 space-y-4">
                            <Input
                                label="Special Notes"
                                value={formData.specialNotes}
                                onChange={(value) => updateField('specialNotes', value)}
                                placeholder="Any special drilling instructions or customer preferences"
                            />

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isTemplate"
                                    checked={formData.isTemplate}
                                    onChange={(e) => updateField('isTemplate', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isTemplate" className="text-sm font-medium text-gray-700">
                                    Save as template for future use
                                </label>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <Button  onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {drillSheet ? 'Update' : 'Create'} Drill Sheet
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};