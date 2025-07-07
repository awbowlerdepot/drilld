import React from 'react';
import { Plug, CreditCard, Package, Mail, ShoppingCart, TestTube } from 'lucide-react';
import { ProShopIntegrationSettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface IntegrationSettingsTabProps {
    settings: ProShopIntegrationSettings;
    onUpdate: (updates: Partial<ProShopIntegrationSettings>) => void;
}

export const IntegrationSettingsTab: React.FC<IntegrationSettingsTabProps> = ({
                                                                                  settings,
                                                                                  onUpdate
                                                                              }) => {
    const posProviderOptions = [
        { value: 'Square', label: 'Square' },
        { value: 'Stripe', label: 'Stripe Terminal' },
        { value: 'Clover', label: 'Clover' },
        { value: 'ShopKeep', label: 'ShopKeep' },
        { value: 'Toast', label: 'Toast POS' }
    ];

    const inventoryProviderOptions = [
        { value: 'ShopKeep', label: 'ShopKeep' },
        { value: 'Lightspeed', label: 'Lightspeed Retail' },
        { value: 'Vend', label: 'Vend' },
        { value: 'QuickBooks', label: 'QuickBooks' },
        { value: 'TradeGecko', label: 'TradeGecko' }
    ];

    const paymentProviderOptions = [
        { value: 'Stripe', label: 'Stripe' },
        { value: 'Square', label: 'Square' },
        { value: 'PayPal', label: 'PayPal' },
        { value: 'Authorize.net', label: 'Authorize.net' }
    ];

    const emailProviderOptions = [
        { value: 'SENDGRID', label: 'SendGrid' },
        { value: 'MAILCHIMP', label: 'Mailchimp' },
        { value: 'AWS_SES', label: 'Amazon SES' }
    ];

    const updatePosIntegration = (field: string, value: any) => {
        onUpdate({
            posIntegration: {
                ...settings.posIntegration,
                [field]: value
            }
        });
    };

    const updateInventoryIntegration = (field: string, value: any) => {
        onUpdate({
            inventoryIntegration: {
                ...settings.inventoryIntegration,
                [field]: value
            }
        });
    };

    const updatePaymentProcessing = (field: string, value: any) => {
        onUpdate({
            paymentProcessing: {
                ...settings.paymentProcessing,
                [field]: value
            }
        });
    };

    const updateEmailProvider = (field: string, value: any) => {
        onUpdate({
            emailProvider: {
                ...settings.emailProvider,
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* POS Integration */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                    Point of Sale (POS) Integration
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.posIntegration?.enabled || false}
                            onChange={(e) => updatePosIntegration('enabled', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable POS Integration</span>
                            <p className="text-xs text-gray-500">Sync work orders and inventory with your POS system</p>
                        </div>
                    </label>

                    {settings.posIntegration?.enabled && (
                        <div className="ml-7 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="POS Provider"
                                    value={settings.posIntegration.provider || ''}
                                    onChange={(value) => updatePosIntegration('provider', value)}
                                    options={posProviderOptions}
                                    placeholder="Select your POS provider"
                                />

                                <Input
                                    label="Sync Interval (seconds)"
                                    type="number"
                                    value={settings.posIntegration.syncInterval?.toString() || '300'}
                                    onChange={(value) => updatePosIntegration('syncInterval', parseInt(value) || 300)}
                                    min="60"
                                    max="3600"
                                />
                            </div>

                            <Input
                                label="API Key"
                                type="password"
                                value={settings.posIntegration.apiKey || ''}
                                onChange={(value) => updatePosIntegration('apiKey', value)}
                                placeholder="Enter your POS API key"
                                helpText="Your API key will be encrypted and stored securely"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Inventory Integration */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Inventory Management Integration
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.inventoryIntegration?.enabled || false}
                            onChange={(e) => updateInventoryIntegration('enabled', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Inventory Integration</span>
                            <p className="text-xs text-gray-500">Automatically track inventory levels and reorder supplies</p>
                        </div>
                    </label>

                    {settings.inventoryIntegration?.enabled && (
                        <div className="ml-7 space-y-4">
                            <Select
                                label="Inventory Provider"
                                value={settings.inventoryIntegration.provider || ''}
                                onChange={(value) => updateInventoryIntegration('provider', value)}
                                options={inventoryProviderOptions}
                                placeholder="Select your inventory system"
                            />

                            <Input
                                label="API Key"
                                type="password"
                                value={settings.inventoryIntegration.apiKey || ''}
                                onChange={(value) => updateInventoryIntegration('apiKey', value)}
                                placeholder="Enter your inventory system API key"
                            />

                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={settings.inventoryIntegration.autoOrderLowStock || false}
                                    onChange={(e) => updateInventoryIntegration('autoOrderLowStock', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900">Auto-order when stock is low</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Processing */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Payment Processing
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.paymentProcessing?.enabled || false}
                            onChange={(e) => updatePaymentProcessing('enabled', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Payment Processing</span>
                            <p className="text-xs text-gray-500">Accept credit card payments directly in the app</p>
                        </div>
                    </label>

                    {settings.paymentProcessing?.enabled && (
                        <div className="ml-7 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="Payment Provider"
                                    value={settings.paymentProcessing.provider || ''}
                                    onChange={(value) => updatePaymentProcessing('provider', value)}
                                    options={paymentProviderOptions}
                                    placeholder="Select payment provider"
                                />

                                <Input
                                    label="Merchant ID"
                                    value={settings.paymentProcessing.merchantId || ''}
                                    onChange={(value) => updatePaymentProcessing('merchantId', value)}
                                    placeholder="Enter your merchant ID"
                                />
                            </div>

                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={settings.paymentProcessing.testMode || false}
                                    onChange={(e) => updatePaymentProcessing('testMode', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-900">Test Mode</span>
                                    <TestTube className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs text-gray-500">(Use for testing payments without real charges)</span>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Provider */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Email Service Provider
                </h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            label="Email Provider"
                            value={settings.emailProvider?.provider || 'SENDGRID'}
                            onChange={(value) => updateEmailProvider('provider', value)}
                            options={emailProviderOptions}
                            required
                        />

                        <Input
                            label="From Email"
                            type="email"
                            value={settings.emailProvider?.fromEmail || ''}
                            onChange={(value) => updateEmailProvider('fromEmail', value)}
                            placeholder="noreply@yourproshop.com"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="From Name"
                            value={settings.emailProvider?.fromName || ''}
                            onChange={(value) => updateEmailProvider('fromName', value)}
                            placeholder="Your Pro Shop Name"
                            required
                        />

                        <Input
                            label="API Key"
                            type="password"
                            value={settings.emailProvider?.apiKey || ''}
                            onChange={(value) => updateEmailProvider('apiKey', value)}
                            placeholder="Enter your email provider API key"
                        />
                    </div>
                </div>
            </div>

            {/* Integration Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                    <Plug className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                    <div>
                        <h4 className="text-sm font-medium text-green-900 mb-1">Integration Health</h4>
                        <div className="text-xs text-green-700 space-y-1">
                            <p>• POS Integration: {settings.posIntegration?.enabled ? 'Active' : 'Disabled'}</p>
                            <p>• Inventory Integration: {settings.inventoryIntegration?.enabled ? 'Active' : 'Disabled'}</p>
                            <p>• Payment Processing: {settings.paymentProcessing?.enabled ? 'Active' : 'Disabled'}</p>
                            <p>• Email Provider: {settings.emailProvider?.provider ? 'Configured' : 'Not configured'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <Plug className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Need Help with Integrations?</h4>
                        <p className="text-xs text-blue-700 mb-2">
                            Our support team can help you set up and configure integrations with your existing systems.
                        </p>
                        <button className="text-xs text-blue-700 underline hover:text-blue-800">
                            Contact Integration Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};