import React, { useState } from 'react';
import { Customer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface CustomerFormProps {
    customer?: Customer;
    onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
                                                              customer,
                                                              onSave,
                                                              onCancel
                                                          }) => {
    const [formData, setFormData] = useState({
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        dominantHand: customer?.dominantHand || 'RIGHT' as const,
        preferredGripStyle: customer?.preferredGripStyle || 'FINGERTIP' as const,
        usesThumb: customer?.usesThumb ?? true,
        notes: customer?.notes || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            onSave(formData);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
                {customer ? 'Edit Customer' : 'Add New Customer'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        value={formData.firstName}
                        onChange={(value) => updateField('firstName', value)}
                        required
                        error={errors.firstName}
                    />
                    <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(value) => updateField('lastName', value)}
                        required
                        error={errors.lastName}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(value) => updateField('email', value)}
                        error={errors.email}
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(value) => updateField('phone', value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Dominant Hand"
                        value={formData.dominantHand}
                        onChange={(value) => updateField('dominantHand', value)}
                        options={[
                            { value: 'RIGHT', label: 'Right' },
                            { value: 'LEFT', label: 'Left' }
                        ]}
                        required
                    />
                    <Select
                        label="Preferred Grip"
                        value={formData.preferredGripStyle}
                        onChange={(value) => updateField('preferredGripStyle', value)}
                        options={[
                            { value: 'CONVENTIONAL', label: 'Conventional' },
                            { value: 'FINGERTIP', label: 'Fingertip' },
                            { value: 'TWO_HANDED_NO_THUMB', label: 'Two-Handed (No Thumb)' }
                        ]}
                        required
                    />
                    <Select
                        label="Uses Thumb"
                        value={formData.usesThumb ? 'true' : 'false'}
                        onChange={(value) => updateField('usesThumb', value === 'true')}
                        options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' }
                        ]}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special preferences or notes..."
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {customer ? 'Update Customer' : 'Save Customer'}
                    </Button>
                </div>
            </form>
        </div>
    );
};