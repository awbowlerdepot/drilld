import React from 'react';

interface InputProps {
    label?: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'password';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    step?: string;
    min?: string;
    max?: string;
    className?: string;
}

export const Input: React.FC<InputProps> = ({
                                                label,
                                                type = 'text',
                                                value,
                                                onChange,
                                                placeholder,
                                                required = false,
                                                disabled = false,
                                                error,
                                                step,
                                                min,
                                                max,
                                                className = ''
                                            }) => {
    const baseClasses = 'block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500';
    const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                step={step}
                min={min}
                max={max}
                className={`${baseClasses} ${errorClasses}`}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};