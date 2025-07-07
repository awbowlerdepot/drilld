import React from 'react';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react';
import { ProShopGeneralSettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface GeneralSettingsTabProps {
    settings: ProShopGeneralSettings;
    onUpdate: (updates: Partial<ProShopGeneralSettings>) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
                                                                          settings,
                                                                          onUpdate
                                                                      }) => {
    const timezoneOptions = [
        { value: 'America/New_York', label: 'Eastern Time (EST)' },
        { value: 'America/Chicago', label: 'Central Time (CST)' },
        { value: 'America/Denver', label: 'Mountain Time (MST)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
        { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
        { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
        { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
    ];

    const currencyOptions = [
        { value: 'USD', label: 'US Dollar ($)' },
        { value: 'CAD', label: 'Canadian Dollar (C$)' },
        { value: 'EUR', label: 'Euro (€)' },
        { value: 'GBP', label: 'British Pound (£)' }
    ];

    const daysOfWeek = [
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday'
    ];

    const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
        onUpdate({
            businessHours: {
                ...settings.businessHours,
                [day]: {
                    ...settings.businessHours[day],
                    [field]: value
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Business Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Business Name"
                        value={settings.businessName}
                        onChange={(value) => onUpdate({ businessName: value })}
                        required
                        placeholder="Enter your business name"
                    />

                    <Input
                        label="Owner Name"
                        value={settings.ownerName}
                        onChange={(value) => onUpdate({ ownerName: value })}
                        required
                        placeholder="Enter owner's full name"
                    />

                    <Input
                        label="Phone Number"
                        value={settings.phone || ''}
                        onChange={(value) => onUpdate({ phone: value })}
                        placeholder="(555) 123-4567"
                    />

                    <Input
                        label="Billing Email"
                        type="email"
                        value={settings.billingEmail}
                        onChange={(value) => onUpdate({ billingEmail: value })}
                        required
                        placeholder="billing@yourproshop.com"
                    />
                </div>

                <div className="mt-6">
                    <Input
                        label="Business Address"
                        value={settings.address || ''}
                        onChange={(value) => onUpdate({ address: value })}
                        placeholder="123 Main St, City, State 12345"
                        className="w-full"
                    />
                </div>
            </div>

            {/* Regional Settings */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Regional Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select
                        label="Timezone"
                        value={settings.timezone}
                        onChange={(value) => onUpdate({ timezone: value })}
                        options={timezoneOptions}
                        required
                    />

                    <Select
                        label="Currency"
                        value={settings.currency}
                        onChange={(value) => onUpdate({ currency: value })}
                        options={currencyOptions}
                        required
                    />

                    <Input
                        label="Tax Rate (%)"
                        type="number"
                        value={settings.taxRate?.toString() || ''}
                        onChange={(value) => onUpdate({ taxRate: parseFloat(value) || 0 })}
                        placeholder="8.5"
                        step="0.1"
                        min="0"
                        max="100"
                    />
                </div>
            </div>

            {/* Business Policies */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Business Policies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Default Warranty Period (Days)"
                        type="number"
                        value={settings.defaultWarrantyPeriod.toString()}
                        onChange={(value) => onUpdate({ defaultWarrantyPeriod: parseInt(value) || 90 })}
                        min="0"
                        max="365"
                        required
                    />
                </div>
            </div>

            {/* Business Hours */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Business Hours
                </h3>
                <div className="space-y-4">
                    {daysOfWeek.map((day) => {
                        const dayHours = settings.businessHours[day] || {};
                        const isClosed = dayHours.closed;

                        return (
                            <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-24">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {day}
                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={!isClosed}
                                        onChange={(e) => updateBusinessHours(day, 'closed', !e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-600">Open</span>
                                </div>

                                {!isClosed && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm text-gray-600">From:</label>
                                            <input
                                                type="time"
                                                value={dayHours.open || '09:00'}
                                                onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                                                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm text-gray-600">To:</label>
                                            <input
                                                type="time"
                                                value={dayHours.close || '21:00'}
                                                onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                                                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </>
                                )}

                                {isClosed && (
                                    <span className="text-sm text-gray-500 italic">Closed</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};