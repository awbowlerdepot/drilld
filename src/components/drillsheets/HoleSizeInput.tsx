import React from 'react';
import { HoleSize } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface HoleSizeInputProps {
    label: string;
    value: HoleSize;
    onChange: (value: HoleSize) => void;
    holeType?: 'thumb' | 'finger';
    required?: boolean;
    disabled?: boolean;
    error?: string; // Added error prop
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
    const updateHoleSize = (field: keyof HoleSize, newValue: string | number | undefined) => {
        onChange({
            ...value,
            [field]: newValue
        });
    };

    // Common drill bit sizes
    const thumbSizes = [
        { value: '1/2', label: '1/2"' },
        { value: '17/32', label: '17/32"' },
        { value: '9/16', label: '9/16"' },
        { value: '19/32', label: '19/32"' },
        { value: '5/8', label: '5/8"' },
        { value: '21/32', label: '21/32"' },
        { value: '11/16', label: '11/16"' },
        { value: '23/32', label: '23/32"' },
        { value: '3/4', label: '3/4"' }
    ];

    const fingerSizes = [
        { value: '1/2', label: '1/2"' },
        { value: '17/32', label: '17/32"' },
        { value: '9/16', label: '9/16"' },
        { value: '19/32', label: '19/32"' },
        { value: '5/8', label: '5/8"' },
        { value: '21/32', label: '21/32"' },
        { value: '11/16', label: '11/16"' },
        { value: '23/32', label: '23/32"' },
        { value: '3/4', label: '3/4"' },
        { value: '25/32', label: '25/32"' },
        { value: '13/16', label: '13/16"' },
        { value: '27/32', label: '27/32"' },
        { value: '7/8', label: '7/8"' },
        { value: '29/32', label: '29/32"' },
        { value: '15/16', label: '15/16"' },
        { value: '31/32', label: '31/32"' },
        { value: '1', label: '1"' }
    ];

    const sizeOptions = holeType === 'thumb' ? thumbSizes : fingerSizes;

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-700">{label}</h4>
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
            {holeType === 'thumb' && (
                <Input
                    label="Secondary Size (optional)"
                    value={value.secondary || ''}
                    onChange={(val) => updateHoleSize('secondary', val || undefined)}
                    placeholder="For oval or stepped holes"
                    disabled={disabled}
                />
            )}
        </div>
    );
};