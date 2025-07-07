import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
    label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
                                                      error,
                                                      label,
                                                      className = '',
                                                      ...props
                                                  }) => {
    const baseClasses = `
        block w-full rounded-md border-gray-300 shadow-sm
        focus:border-blue-500 focus:ring-blue-500
        disabled:bg-gray-50 disabled:text-gray-500
        resize-vertical
    `;

    const errorClasses = error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
        : '';

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <textarea
                className={`${baseClasses} ${errorClasses} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};