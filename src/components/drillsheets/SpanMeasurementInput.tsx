import React from 'react';
import { SpanMeasurement } from '../../types';
import { Input } from '../ui/Input';

interface SpanMeasurementInputProps {
    label: string;
    value: SpanMeasurement;
    onChange: (value: SpanMeasurement) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string; // Added error prop
}

export const SpanMeasurementInput: React.FC<SpanMeasurementInputProps> = ({
                                                                              label,
                                                                              value,
                                                                              onChange,
                                                                              required = false,
                                                                              disabled = false,
                                                                              error
                                                                          }) => {
    const updateMeasurement = (field: keyof SpanMeasurement, newValue: string) => {
        const numValue = newValue ? parseFloat(newValue) : undefined;
        onChange({
            ...value,
            [field]: numValue
        });
    };

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-700">{label}</h4>
            {error && (
                <div className="text-sm text-red-600">{error}</div>
            )}
            <div className="grid grid-cols-3 gap-3">
                <Input
                    label="Fit Span"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={value.fitSpan?.toString() || ''}
                    onChange={(val) => updateMeasurement('fitSpan', val)}
                    placeholder="4.40"
                    required={required}
                    disabled={disabled}
                />
                <Input
                    label="Full Span"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={value.fullSpan?.toString() || ''}
                    onChange={(val) => updateMeasurement('fullSpan', val)}
                    placeholder="4.65"
                    disabled={disabled}
                />
                <Input
                    label="Cut to Cut"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={value.cutToCutSpan?.toString() || ''}
                    onChange={(val) => updateMeasurement('cutToCutSpan', val)}
                    placeholder="4.25"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};