// REPLACE ENTIRE CONTENTS of src/components/drillsheets/HoleSizeInput.tsx

import React, { useState, useEffect } from 'react';
import { HoleSize, FingerInsert, getAvailableInsertSizes, INSERT_MANUFACTURERS } from '../../types/drillsheet';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface HoleSizeInputProps {
    label: string;
    value: HoleSize;
    onChange: (value: HoleSize) => void;
    holeType?: 'thumb' | 'finger';
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

export const HoleSizeInput: React.FC<HoleSizeInputProps> = ({
                                                                label,
                                                                value,
                                                                onChange,
                                                                holeType = 'finger',
                                                                required = false,
                                                                disabled = false,
                                                                error
                                                            }) => {
    const [showInsertDetails, setShowInsertDetails] = useState(value.hasInsert || false);

    const updateHoleSize = (field: keyof HoleSize, newValue: string | number | boolean | FingerInsert | undefined) => {
        const updatedValue = {
            ...value,
            [field]: newValue
        };

        // Clear insert data if hasInsert is set to false
        if (field === 'hasInsert' && !newValue) {
            updatedValue.insert = undefined;
        }

        // Initialize insert data if hasInsert is set to true
        if (field === 'hasInsert' && newValue && !updatedValue.insert) {
            updatedValue.insert = {
                manufacturer: 'VISE',
                insertSize: '',
                outsideHoleSize: '7/8',
                type: '',
                model: '',
                color: '',
                notes: ''
            };
        }

        onChange(updatedValue);
    };

    const updateInsert = (field: keyof FingerInsert, newValue: string) => {
        if (!value.insert) return;

        const updatedInsert = {
            ...value.insert,
            [field]: newValue
        };

        // AUTO-UPDATE: Set primary hole size when outside hole size changes
        if (field === 'outsideHoleSize') {
            // Update both the insert and the primary hole size
            const updatedValue = {
                ...value,
                primary: newValue, // Set primary hole size to match outside hole size
                insert: updatedInsert
            };
            onChange(updatedValue); // Use onChange instead of updateHoleSize
        } else {
            // For other insert fields, just update the insert
            updateHoleSize('insert', updatedInsert);
        }
    };

    useEffect(() => {
        setShowInsertDetails(value.hasInsert || false);
    }, [value.hasInsert]);

    // Updated drill bit sizes - 1/2" to 1-1/8" in 1/64" increments, then specific larger sizes
    const thumbSizes = [
        { value: '1/2', label: '1/2"' },      // 32/64"
        { value: '33/64', label: '33/64"' },
        { value: '17/32', label: '17/32"' },  // 34/64"
        { value: '35/64', label: '35/64"' },
        { value: '9/16', label: '9/16"' },    // 36/64"
        { value: '37/64', label: '37/64"' },
        { value: '19/32', label: '19/32"' },  // 38/64"
        { value: '39/64', label: '39/64"' },
        { value: '5/8', label: '5/8"' },      // 40/64"
        { value: '41/64', label: '41/64"' },
        { value: '21/32', label: '21/32"' },  // 42/64"
        { value: '43/64', label: '43/64"' },
        { value: '11/16', label: '11/16"' },  // 44/64"
        { value: '45/64', label: '45/64"' },
        { value: '23/32', label: '23/32"' },  // 46/64"
        { value: '47/64', label: '47/64"' },
        { value: '3/4', label: '3/4"' },      // 48/64"
        { value: '49/64', label: '49/64"' },
        { value: '25/32', label: '25/32"' },  // 50/64"
        { value: '51/64', label: '51/64"' },
        { value: '13/16', label: '13/16"' },  // 52/64"
        { value: '53/64', label: '53/64"' },
        { value: '27/32', label: '27/32"' },  // 54/64"
        { value: '55/64', label: '55/64"' },
        { value: '7/8', label: '7/8"' },      // 56/64"
        { value: '57/64', label: '57/64"' },
        { value: '29/32', label: '29/32"' },  // 58/64"
        { value: '59/64', label: '59/64"' },
        { value: '15/16', label: '15/16"' },  // 60/64"
        { value: '61/64', label: '61/64"' },
        { value: '31/32', label: '31/32"' },  // 62/64"
        { value: '63/64', label: '63/64"' },
        { value: '1', label: '1"' },          // 64/64"
        { value: '1-1/64', label: '1-1/64"' },
        { value: '1-1/32', label: '1-1/32"' },
        { value: '1-3/64', label: '1-3/64"' },
        { value: '1-1/16', label: '1-1/16"' },
        { value: '1-5/64', label: '1-5/64"' },
        { value: '1-3/32', label: '1-3/32"' },
        { value: '1-7/64', label: '1-7/64"' },
        { value: '1-1/8', label: '1-1/8"' },  // 72/64" - END OF 1/64" INCREMENTS
        // Specific larger sizes
        { value: '1-1/4', label: '1-1/4"' },
        { value: '1-5/16', label: '1-5/16"' },
        { value: '1-3/8', label: '1-3/8"' },
        { value: '1-7/16', label: '1-7/16"' },
        { value: '1-1/2', label: '1-1/2"' }
    ];

    const fingerSizes = thumbSizes; // Use same range for fingers

    // Outside hole sizes for inserts
    const outsideHoleSizes = [
        { value: '7/8', label: '7/8"' },
        { value: '31/32', label: '31/32"' },
        { value: '1-1/32', label: '1-1/32"' }
    ];

    // Manufacturer options
    const manufacturerOptions = Object.keys(INSERT_MANUFACTURERS).map(key => ({
        value: key,
        label: INSERT_MANUFACTURERS[key as keyof typeof INSERT_MANUFACTURERS].name
    }));

    // Get available insert types for selected manufacturer
    const availableTypes = value.insert?.manufacturer
        ? INSERT_MANUFACTURERS[value.insert.manufacturer].types.map(type => ({
            value: type,
            label: type
        }))
        : [];

    // Get available insert sizes based on selected outside hole
    const availableInsertSizes = value.insert?.outsideHoleSize
        ? getAvailableInsertSizes(value.insert.outsideHoleSize).map(size => ({
            value: size,
            label: size + '"'
        }))
        : [];

    // Get common colors for selected manufacturer
    const availableColors = value.insert?.manufacturer
        ? INSERT_MANUFACTURERS[value.insert.manufacturer].commonColors.map(color => ({
            value: color,
            label: color
        }))
        : [];

    const sizeOptions = holeType === 'thumb' ? thumbSizes : fingerSizes;

    return (
        <div className="space-y-4">
            <h4 className="font-medium text-gray-700">{label}</h4>

            {/* Standard hole size configuration */}
            <div className="grid grid-cols-2 gap-3">
                <Select
                    label="Primary Size"
                    value={value.primary || ''}
                    onChange={(val) => updateHoleSize('primary', val)}
                    options={sizeOptions}
                    placeholder="Select size"
                    required={required}
                    disabled={disabled}
                    error={error}
                />
                <Input
                    label="Depth (inches)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={value.depth?.toString() || ''}
                    onChange={(val) => updateHoleSize('depth', val ? parseFloat(val) : undefined)}
                    placeholder="2.25"
                    disabled={disabled}
                />
            </div>

            {/* Secondary size for thumb holes */}
            {holeType === 'thumb' && (
                <Input
                    label="Secondary Size (optional)"
                    value={value.secondary || ''}
                    onChange={(val) => updateHoleSize('secondary', val || undefined)}
                    placeholder="For oval or stepped holes"
                    disabled={disabled}
                />
            )}

            {/* Insert support for finger holes only */}
            {holeType === 'finger' && (
                <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="checkbox"
                            id={`${label}-insert`}
                            checked={value.hasInsert || false}
                            onChange={(e) => {
                                updateHoleSize('hasInsert', e.target.checked);
                                setShowInsertDetails(e.target.checked);
                            }}
                            disabled={disabled}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`${label}-insert`} className="text-sm font-medium text-gray-700">
                            Use Finger Insert
                        </label>
                    </div>

                    {/* Insert details */}
                    {showInsertDetails && value.insert && (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                            <h5 className="font-medium text-gray-900 mb-3">Insert Specifications</h5>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <Select
                                    label="Outside Hole Size"
                                    value={value.insert.outsideHoleSize}
                                    onChange={(val) => updateInsert('outsideHoleSize', val)}
                                    options={outsideHoleSizes}
                                    disabled={disabled}
                                />

                                <Select
                                    label="Insert Size"
                                    value={value.insert.insertSize}
                                    onChange={(val) => updateInsert('insertSize', val)}
                                    options={availableInsertSizes}
                                    placeholder="Select insert size"
                                    disabled={disabled || !value.insert.outsideHoleSize}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <Select
                                    label="Manufacturer"
                                    value={value.insert.manufacturer}
                                    onChange={(val) => updateInsert('manufacturer', val)}
                                    options={manufacturerOptions}
                                    disabled={disabled}
                                />

                                <Select
                                    label="Insert Type"
                                    value={value.insert.type || ''}
                                    onChange={(val) => updateInsert('type', val)}
                                    options={availableTypes}
                                    placeholder="Select insert type"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <Select
                                    label="Color"
                                    value={value.insert.color || ''}
                                    onChange={(val) => updateInsert('color', val)}
                                    options={availableColors}
                                    placeholder="Select color"
                                    disabled={disabled}
                                />

                                <Input
                                    label="Model/Part Number"
                                    value={value.insert.model || ''}
                                    onChange={(val) => updateInsert('model', val)}
                                    placeholder="Optional model or part number"
                                    disabled={disabled}
                                />
                            </div>

                            <Input
                                label="Notes"
                                value={value.insert.notes || ''}
                                onChange={(val) => updateInsert('notes', val)}
                                placeholder="Any special notes about this insert"
                                disabled={disabled}
                            />

                            {/* Insert compatibility info */}
                            {value.insert.outsideHoleSize && (
                                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                    <strong>Compatible insert sizes for {value.insert.outsideHoleSize}" holes:</strong>
                                    <br />
                                    {getAvailableInsertSizes(value.insert.outsideHoleSize).join(', ')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};