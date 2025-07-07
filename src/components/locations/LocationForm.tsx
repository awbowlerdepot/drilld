import React, { useState } from 'react';
import { Location } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { X, MapPin, Phone, Clock, Wrench } from 'lucide-react';

interface LocationFormProps {
    location?: Location;
    onSave: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    proshopID: string;
}

interface EquipmentItem {
    name: string;
    model: string;
    manufacturer?: string;
    serialNumber?: string;
    condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
}

interface HoursData {
    [key: string]: string;
}

export const LocationForm: React.FC<LocationFormProps> = ({
                                                              location,
                                                              onSave,
                                                              onCancel,
                                                              proshopID
                                                          }) => {
    const [formData, setFormData] = useState({
        name: location?.name || '',
        address: location?.address || '',
        phone: location?.phone || '',
        active: location?.active ?? true
    });

    const [equipment, setEquipment] = useState<EquipmentItem[]>(
        location?.equipmentInfo?.equipment || []
    );

    const [hours, setHours] = useState<HoursData>(
        location?.hours || {
            monday: '9:00 AM - 9:00 PM',
            tuesday: '9:00 AM - 9:00 PM',
            wednesday: '9:00 AM - 9:00 PM',
            thursday: '9:00 AM - 9:00 PM',
            friday: '9:00 AM - 10:00 PM',
            saturday: '9:00 AM - 10:00 PM',
            sunday: '12:00 PM - 8:00 PM'
        }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Location name is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (formData.phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = 'Phone must be in format (XXX) XXX-XXXX';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const locationData = {
            ...formData,
            proshopID,
            equipmentInfo: {
                equipment,
                lastUpdated: new Date().toISOString()
            },
            hours
        };

        onSave(locationData);
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const addEquipment = () => {
        setEquipment(prev => [...prev, {
            name: '',
            model: '',
            manufacturer: '',
            serialNumber: '',
            condition: 'good'
        }]);
    };

    const updateEquipment = (index: number, field: string, value: string) => {
        setEquipment(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const removeEquipment = (index: number) => {
        setEquipment(prev => prev.filter((_, i) => i !== index));
    };

    const updateHours = (day: string, value: string) => {
        setHours(prev => ({ ...prev, [day]: value }));
    };

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    };

    const handlePhoneChange = (value: string) => {
        updateField('phone', formatPhoneNumber(value));
    };

    const daysOfWeek = [
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        {location ? 'Edit Location' : 'Add New Location'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Location Name"
                                    value={formData.name}
                                    onChange={(value) => updateField('name', value)}
                                    placeholder="e.g., Main Location, Downtown Shop"
                                    required
                                    error={errors.name}
                                />
                                <Input
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    placeholder="(555) 123-4567"
                                    error={errors.phone}
                                />
                            </div>
                            <Textarea
                                label="Address"
                                value={formData.address}
                                onChange={(value) => updateField('address', value)}
                                placeholder="123 Main Street, City, State ZIP"
                                required
                                error={errors.address}
                                rows={2}
                            />
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => updateField('active', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="active" className="ml-2 text-sm text-gray-900">
                                    Location is active
                                </label>
                            </div>
                        </div>

                        {/* Hours of Operation */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Hours of Operation
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="flex items-center space-x-3">
                                        <label className="w-20 text-sm font-medium text-gray-700 capitalize">
                                            {day}:
                                        </label>
                                        <input
                                            type="text"
                                            value={hours[day]}
                                            onChange={(e) => updateHours(day, e.target.value)}
                                            placeholder="9:00 AM - 5:00 PM or Closed"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500">
                                Use "Closed" for days when the location is closed. Format: "9:00 AM - 5:00 PM"
                            </p>
                        </div>

                        {/* Equipment */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <Wrench className="w-5 h-5 mr-2" />
                                    Equipment & Tools
                                </h3>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={addEquipment}
                                    className="text-sm"
                                >
                                    Add Equipment
                                </Button>
                            </div>

                            {equipment.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                    No equipment added yet. Click "Add Equipment" to get started.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {equipment.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">Equipment #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEquipment(index)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Equipment name"
                                                    value={item.name}
                                                    onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Model"
                                                    value={item.model}
                                                    onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Manufacturer"
                                                    value={item.manufacturer || ''}
                                                    onChange={(e) => updateEquipment(index, 'manufacturer', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Serial number"
                                                    value={item.serialNumber || ''}
                                                    onChange={(e) => updateEquipment(index, 'serialNumber', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <select
                                                    value={item.condition}
                                                    onChange={(e) => updateEquipment(index, 'condition', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="excellent">Excellent</option>
                                                    <option value="good">Good</option>
                                                    <option value="fair">Fair</option>
                                                    <option value="needs_repair">Needs Repair</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t p-6 bg-gray-50 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {location ? 'Update Location' : 'Create Location'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};