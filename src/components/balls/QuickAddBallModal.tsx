import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface QuickAddBallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ball: {
        customerID: string;
        manufacturer: string;
        model: string;
        weight: number;
        status: 'ACTIVE' | 'RETIRED' | 'DAMAGED';
    }) => void;
    customers: Customer[];
    preselectedCustomerId?: string;
}

export const QuickAddBallModal: React.FC<QuickAddBallModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onSave,
                                                                        customers,
                                                                        preselectedCustomerId
                                                                    }) => {
    const [formData, setFormData] = useState({
        customerID: preselectedCustomerId || '',
        manufacturer: '',
        model: '',
        weight: '15',
        status: 'ACTIVE' as const
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerID) newErrors.customerID = 'Customer is required';
        if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
        if (!formData.model) newErrors.model = 'Model is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            onSave({
                ...formData,
                weight: parseInt(formData.weight)
            });

            // Reset form
            setFormData({
                customerID: preselectedCustomerId || '',
                manufacturer: '',
                model: '',
                weight: '15',
                status: 'ACTIVE'
            });
            setErrors({});
            onClose();
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`
    }));

    const weightOptions = Array.from({ length: 11 }, (_, i) => ({
        value: (i + 6).toString(),
        label: `${i + 6} lbs`
    }));

    const manufacturerOptions = [
        { value: 'Storm', label: 'Storm' },
        { value: 'Hammer', label: 'Hammer' },
        { value: 'Brunswick', label: 'Brunswick' },
        { value: 'DV8', label: 'DV8' },
        { value: 'Columbia 300', label: 'Columbia 300' },
        { value: 'Motiv', label: 'Motiv' },
        { value: 'Roto Grip', label: 'Roto Grip' }
    ];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Quick Add Ball</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Customer"
                        value={formData.customerID}
                        onChange={(value) => updateField('customerID', value)}
                        options={customerOptions}
                        placeholder="Select Customer"
                        required
                        error={errors.customerID}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Manufacturer"
                            value={formData.manufacturer}
                            onChange={(value) => updateField('manufacturer', value)}
                            options={manufacturerOptions}
                            placeholder="Select Brand"
                            required
                            error={errors.manufacturer}
                        />
                        <Select
                            label="Weight"
                            value={formData.weight}
                            onChange={(value) => updateField('weight', value)}
                            options={weightOptions}
                            required
                        />
                    </div>

                    <Input
                        label="Model"
                        value={formData.model}
                        onChange={(value) => updateField('model', value)}
                        placeholder="e.g., Phaze II"
                        required
                        error={errors.model}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Ball
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};