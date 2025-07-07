import React, { useState } from 'react';
import {
    Settings,
    Building2,
    CreditCard,
    Workflow,
    Shield,
    Bell,
    Plug,
    Save,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { useProShopSettings } from '../../hooks/useProShopSettings';
import { ProShopSettingsSection } from '../../types/proshopSettings';
import { Button } from '../ui/Button';
import { GeneralSettingsTab } from './tabs/GeneralSettingsTab';
import { BillingSettingsTab } from './tabs/BillingSettingsTab';
import { WorkflowSettingsTab } from './tabs/WorkflowSettingsTab';
import { SecuritySettingsTab } from './tabs/SecuritySettingsTab';
import { NotificationSettingsTab } from './tabs/NotificationSettingsTab';
import { IntegrationSettingsTab } from './tabs/IntegrationSettingsTab';

interface Tab {
    id: ProShopSettingsSection;
    label: string;
    icon: React.ReactNode;
    description: string;
}

export const ProShopSettingsManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ProShopSettingsSection>('general');
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const {
        settings,
        loading,
        error,
        hasUnsavedChanges,
        updateSection,
        saveSettings,
        resetSettings,
        validateSettings
    } = useProShopSettings();

    const tabs: Tab[] = [
        {
            id: 'general',
            label: 'General',
            icon: <Building2 className="w-4 h-4" />,
            description: 'Business information and basic settings'
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: <CreditCard className="w-4 h-4" />,
            description: 'Subscription and payment settings'
        },
        {
            id: 'workflow',
            label: 'Workflow',
            icon: <Workflow className="w-4 h-4" />,
            description: 'Work order and process configuration'
        },
        {
            id: 'security',
            label: 'Security',
            icon: <Shield className="w-4 h-4" />,
            description: 'Authentication and data protection'
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="w-4 h-4" />,
            description: 'Email, SMS, and push notification preferences'
        },
        {
            id: 'integrations',
            label: 'Integrations',
            icon: <Plug className="w-4 h-4" />,
            description: 'Third-party service connections'
        }
    ];

    const handleSave = async () => {
        const validation = validateSettings();

        if (!validation.isValid) {
            setSaveMessage(`Validation errors: ${validation.errors.join(', ')}`);
            return;
        }

        const success = await saveSettings();
        if (success) {
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            setSaveMessage('Failed to save settings. Please try again.');
        }
    };

    const handleReset = () => {
        if (hasUnsavedChanges && !window.confirm('Are you sure? All unsaved changes will be lost.')) {
            return;
        }
        resetSettings();
        setSaveMessage(null);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <GeneralSettingsTab
                        settings={settings.general}
                        onUpdate={(data) => updateSection('general', data)}
                    />
                );
            case 'billing':
                return (
                    <BillingSettingsTab
                        settings={settings.billing}
                        onUpdate={(data) => updateSection('billing', data)}
                    />
                );
            case 'workflow':
                return (
                    <WorkflowSettingsTab
                        settings={settings.workflow}
                        onUpdate={(data) => updateSection('workflow', data)}
                    />
                );
            case 'security':
                return (
                    <SecuritySettingsTab
                        settings={settings.security}
                        onUpdate={(data) => updateSection('security', data)}
                    />
                );
            case 'notifications':
                return (
                    <NotificationSettingsTab
                        settings={settings.notifications}
                        onUpdate={(data) => updateSection('notifications', data)}
                    />
                );
            case 'integrations':
                return (
                    <IntegrationSettingsTab
                        settings={settings.integrations}
                        onUpdate={(data) => updateSection('integrations', data)}
                    />
                );
            default:
                return null;
        }
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pro Shop Settings</h1>
                        <p className="text-gray-600">Manage your pro shop configuration and preferences</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {hasUnsavedChanges && (
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                            icon={RotateCcw}
                            size="sm"
                        >
                            Reset Changes
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        icon={loading ? Loader2 : Save}
                        disabled={loading || !hasUnsavedChanges}
                        className={loading ? 'animate-pulse' : ''}
                    >
                        {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {saveMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-700">{saveMessage}</span>
                </div>
            )}

            {hasUnsavedChanges && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-700">You have unsaved changes</span>
                </div>
            )}

            {/* Settings Interface */}
            <div className="bg-white shadow rounded-lg">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                <span className={`transition-colors ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {tab.icon}
                </span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-medium text-gray-900">
                            {tabs.find(tab => tab.id === activeTab)?.label}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {tabs.find(tab => tab.id === activeTab)?.description}
                        </p>
                    </div>

                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};