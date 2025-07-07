import React from 'react';
import { CreditCard, MapPin, FileText, Calendar, Crown, Building } from 'lucide-react';
import { ProShopBillingSettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface BillingSettingsTabProps {
    settings: ProShopBillingSettings;
    onUpdate: (updates: Partial<ProShopBillingSettings>) => void;
}

export const BillingSettingsTab: React.FC<BillingSettingsTabProps> = ({
                                                                          settings,
                                                                          onUpdate
                                                                      }) => {
    const subscriptionTierOptions = [
        { value: 'BASIC', label: 'Basic - $29/month' },
        { value: 'PRO', label: 'Pro - $79/month' },
        { value: 'ENTERPRISE', label: 'Enterprise - Contact Sales' }
    ];

    const billingCycleOptions = [
        { value: 'MONTHLY', label: 'Monthly' },
        { value: 'YEARLY', label: 'Yearly (Save 20%)' }
    ];

    const updateBillingAddress = (field: string, value: string) => {
        onUpdate({
            billingAddress: {
                ...settings.billingAddress,
                [field]: value
            }
        });
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'BASIC':
                return <Building className="w-4 h-4" />;
            case 'PRO':
                return <Crown className="w-4 h-4" />;
            case 'ENTERPRISE':
                return <Crown className="w-4 h-4 text-yellow-600" />;
            default:
                return <Building className="w-4 h-4" />;
        }
    };

    const getTierFeatures = (tier: string) => {
        switch (tier) {
            case 'BASIC':
                return [
                    'Up to 500 customers',
                    'Basic work order management',
                    'Email support',
                    '1 location'
                ];
            case 'PRO':
                return [
                    'Unlimited customers',
                    'Advanced work order management',
                    'Priority support',
                    'Multiple locations',
                    'Analytics & reporting',
                    'Customer notifications'
                ];
            case 'ENTERPRISE':
                return [
                    'Everything in Pro',
                    'Custom integrations',
                    'Dedicated support',
                    'Advanced security',
                    'Custom training',
                    'SLA guarantee'
                ];
            default:
                return [];
        }
    };

    return (
        <div className="space-y-8">
            {/* Current Subscription */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-blue-600" />
                    Current Subscription
                </h3>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            {getTierIcon(settings.subscriptionTier)}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {settings.subscriptionTier} Plan
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Billed {settings.billingCycle.toLowerCase()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Next billing date</p>
                            <p className="font-medium text-gray-900">
                                {settings.nextBillingDate ? new Date(settings.nextBillingDate).toLocaleDateString() : 'Not set'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="City"
                            value={settings.billingAddress?.city || ''}
                            onChange={(value) => updateBillingAddress('city', value)}
                            placeholder="Your City"
                        />

                        <Input
                            label="State/Province"
                            value={settings.billingAddress?.state || ''}
                            onChange={(value) => updateBillingAddress('state', value)}
                            placeholder="State"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="ZIP/Postal Code"
                            value={settings.billingAddress?.zipCode || ''}
                            onChange={(value) => updateBillingAddress('zipCode', value)}
                            placeholder="12345"
                        />

                        <Input
                            label="Country"
                            value={settings.billingAddress?.country || ''}
                            onChange={(value) => updateBillingAddress('country', value)}
                            placeholder="United States"
                        />
                    </div>
                </div>
            </div>

            {/* Billing History */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Billing History
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Recent Invoices</h4>
                            <p className="text-sm text-gray-600">View and download your billing history</p>
                        </div>
                        <button className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium">
                            View All Invoices
                        </button>
                    </div>
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <Crown className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Upgrade Your Plan</h4>
                        <p className="text-xs text-blue-700 mb-2">
                            Get more features and capabilities with a higher tier subscription.
                        </p>
                        <button className="text-xs text-blue-700 underline hover:text-blue-800">
                            Compare Plans & Features
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};