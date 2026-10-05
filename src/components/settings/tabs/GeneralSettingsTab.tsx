import React from 'react';
import { Building2, Clock, DollarSign } from 'lucide-react';
import { CompanyGeneralSettings } from '../../../types/settings';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface GeneralSettingsTabProps {
    settings: CompanyGeneralSettings;
    onUpdate: (updates: Partial<CompanyGeneralSettings>) => void;
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

    return (
        <div className="space-y-8">
            {/* Company Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    Company Information
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
                        label="Billing Email"
                        type="email"
                        value={settings.billingEmail}
                        onChange={(value) => onUpdate({ billingEmail: value })}
                        required
                        placeholder="billing@yourproshop.com"
                    />
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    Address, phone and hours are set per location under Locations.
                </p>
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
                        label="Default Tax Rate (%)"
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

        </div>
    );
};