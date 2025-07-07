import React, { useState } from 'react';
import { BowlingBall, Customer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface BallFormProps {
    ball?: BowlingBall;
    customer?: Customer; // SIMPLIFIED: Just pass the current customer
    onSave: (ball: Omit<BowlingBall, 'id'>) => void;
    onCancel: () => void;
}

export const BallForm: React.FC<BallFormProps> = ({
                                                      ball,
                                                      customer, // SIMPLIFIED: Use the customer we're in context with
                                                      onSave,
                                                      onCancel
                                                  }) => {
    const [formData, setFormData] = useState({
        customerID: ball?.customerID || customer?.id || '',
        manufacturer: ball?.manufacturer || '',
        model: ball?.model || '',
        weight: ball?.weight?.toString() || '',
        status: ball?.status || 'ACTIVE' as const,
        serialNumber: ball?.serialNumber || '',
        coverstockType: ball?.coverstockType || '',
        coreType: ball?.coreType || '',
        purchaseDate: ball?.purchaseDate || '',
        purchasePrice: ball?.purchasePrice?.toString() || '',
        notes: ball?.notes || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // SIMPLIFIED: Customer is always required
        if (!formData.customerID.trim()) {
            newErrors.customerID = 'Customer is required';
        }

        if (!formData.manufacturer.trim()) {
            newErrors.manufacturer = 'Manufacturer is required';
        }

        if (!formData.model.trim()) {
            newErrors.model = 'Model is required';
        }

        if (!formData.weight.trim()) {
            newErrors.weight = 'Weight is required';
        } else {
            const weight = parseInt(formData.weight);
            if (isNaN(weight) || weight < 6 || weight > 16) {
                newErrors.weight = 'Weight must be between 6 and 16 pounds';
            }
        }

        if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
            newErrors.purchasePrice = 'Purchase price must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            const submitData = {
                ...formData,
                customerID: formData.customerID, // Already set from customer context
                weight: parseInt(formData.weight),
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
                // Remove empty strings
                serialNumber: formData.serialNumber || undefined,
                coverstockType: formData.coverstockType || undefined,
                coreType: formData.coreType || undefined,
                purchaseDate: formData.purchaseDate || undefined,
                notes: formData.notes || undefined
            };

            onSave(submitData);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const manufacturerOptions = [
        { value: 'Storm', label: 'Storm' },
        { value: 'Hammer', label: 'Hammer' },
        { value: 'Brunswick', label: 'Brunswick' },
        { value: 'DV8', label: 'DV8' },
        { value: 'Columbia 300', label: 'Columbia 300' },
        { value: 'Motiv', label: 'Motiv' },
        { value: 'Roto Grip', label: 'Roto Grip' },
        { value: 'Track', label: 'Track' },
        { value: 'Ebonite', label: 'Ebonite' },
        { value: 'Other', label: 'Other' }
    ];

    const coverstockOptions = [
        { value: 'Plastic/Polyester', label: 'Plastic/Polyester' },
        { value: 'Urethane', label: 'Urethane' },
        { value: 'Reactive Resin', label: 'Reactive Resin' },
        { value: 'Solid Reactive', label: 'Solid Reactive' },
        { value: 'Pearl Reactive', label: 'Pearl Reactive' },
        { value: 'Hybrid Reactive', label: 'Hybrid Reactive' },
        { value: 'Particle', label: 'Particle' }
    ];

    const coreOptions = [
        { value: 'Pancake', label: 'Pancake' },
        { value: 'Symmetric', label: 'Symmetric' },
        { value: 'Asymmetrical', label: 'Asymmetrical' },
        { value: 'Low RG', label: 'Low RG' },
        { value: 'High RG', label: 'High RG' }
    ];

    const weightOptions = Array.from({ length: 11 }, (_, i) => ({
        value: (i + 6).toString(),
        label: `${i + 6} lbs`
    }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {ball ? 'Edit Bowling Ball' : 'Add New Bowling Ball'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Customer Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Ball Information</h3>

                            {/* SIMPLIFIED: Show customer info when available */}
                            {customer && (
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Select
                                        label="Manufacturer"
                                        value={formData.manufacturer}
                                        onChange={(value) => updateField('manufacturer', value)}
                                        options={manufacturerOptions}
                                        placeholder="Select Manufacturer"
                                        required
                                        error={errors.manufacturer}
                                    />
                                    {formData.manufacturer === 'Other' && (
                                        <Input
                                            label=""
                                            value={formData.manufacturer === 'Other' ? '' : formData.manufacturer}
                                            onChange={(value) => updateField('manufacturer', value)}
                                            placeholder="Enter manufacturer name"
                                            className="mt-2"
                                            required
                                        />
                                    )}
                                </div>
                                <Input
                                    label="Model"
                                    value={formData.model}
                                    onChange={(value) => updateField('model', value)}
                                    placeholder="e.g., Phaze II, Black Widow"
                                    required
                                    error={errors.model}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Weight"
                                    value={formData.weight}
                                    onChange={(value) => updateField('weight', value)}
                                    options={weightOptions}
                                    placeholder="Select Weight"
                                    required
                                    error={errors.weight}
                                />
                                <Input
                                    label="Serial Number"
                                    value={formData.serialNumber}
                                    onChange={(value) => updateField('serialNumber', value)}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(value) => updateField('status', value)}
                                    options={[
                                        { value: 'ACTIVE', label: 'Active' },
                                        { value: 'RETIRED', label: 'Retired' },
                                        { value: 'DAMAGED', label: 'Damaged' }
                                    ]}
                                    required
                                />
                                <Select
                                    label="Coverstock Type"
                                    value={formData.coverstockType}
                                    onChange={(value) => updateField('coverstockType', value)}
                                    options={coverstockOptions}
                                    placeholder="Select Coverstock"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Core Type"
                                    value={formData.coreType}
                                    onChange={(value) => updateField('coreType', value)}
                                    options={coreOptions}
                                    placeholder="Select Core Type"
                                />
                                <Input
                                    label="Purchase Date"
                                    type="text"
                                    value={formData.purchaseDate}
                                    onChange={(value) => updateField('purchaseDate', value)}
                                    placeholder="YYYY-MM-DD or MM/DD/YYYY"
                                />
                            </div>

                            <Input
                                label="Purchase Price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.purchasePrice}
                                onChange={(value) => updateField('purchasePrice', value)}
                                placeholder="0.00"
                                error={errors.purchasePrice}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any additional notes about this ball..."
                                />
                            </div>
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
                                {ball ? 'Update Ball' : 'Add Ball'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};