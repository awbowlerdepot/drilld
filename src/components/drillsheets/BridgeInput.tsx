import React from 'react';
import { BridgeMeasurement } from '../../types';
import { Input } from '../ui/Input';

interface BridgeInputProps {
    label: string;
    value: BridgeMeasurement;
    onChange: (value: BridgeMeasurement) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

export const BridgeInput: React.FC<BridgeInputProps> = ({
                                                            label,
                                                            value,
                                                            onChange,
                                                            required = false,
                                                            disabled = false,
                                                            error
                                                        }) => {
    const updateBridge = (newValue: string) => {
        const numValue = newValue ? parseFloat(newValue) : 0.25; // Default to 1/4"
        onChange({
            distance: numValue
        });
    };

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-700">{label}</h4>
            {error && (
                <div className="text-sm text-red-600">{error}</div>
            )}
            <div className="w-32">
                <Input
                    label="Bridge Distance (inches)"
                    type="number"
                    step="0.0625" // 1/16" increments
                    min="0.125"   // Minimum 1/8"
                    max="1.0"     // Maximum 1"
                    value={value.distance?.toString() || '0.25'}
                    onChange={updateBridge}
                    placeholder="0.25"
                    required={required}
                    disabled={disabled}
                />
            </div>
            <p className="text-xs text-gray-500">
                Standard bridge distance is 1/4" (0.25"). Common range: 1/8" to 1/2"
            </p>
        </div>
    );
};