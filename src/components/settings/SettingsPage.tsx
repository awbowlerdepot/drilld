import React, { useState } from 'react';
import { Settings, Users, MapPin, Building, Bell, Shield, Database, Palette } from 'lucide-react';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { ProShopSettingsManagement } from "@/components/settings/ProShopSettingsManagment.tsx";
import { LocationManagement } from "@/components/locations/LocationManagment.tsx";

interface SettingsPageProps {
    searchTerm: string;
}

type SettingsTab =
    | 'employees'
    | 'locations'
    | 'proshop'
    | 'notifications'
    | 'security'
    | 'data'
    | 'appearance';

interface SettingsTabConfig {
    id: SettingsTab;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
    {
        id: 'proshop',
        label: 'Pro Shop Settings',
        icon: <Building className="w-5 h-5" />,
        description: 'Business information and preferences'
    },{
        id: 'employees',
        label: 'Employee Management',
        icon: <Users className="w-5 h-5" />,
        description: 'Manage staff, roles, and permissions'
    },
    {
        id: 'locations',
        label: 'Locations',
        icon: <MapPin className="w-5 h-5" />,
        description: 'Configure shop locations and equipment'
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: <Bell className="w-5 h-5" />,
        description: 'Email and system notification settings'
    },
    {
        id: 'security',
        label: 'Security',
        icon: <Shield className="w-5 h-5" />,
        description: 'Authentication and access controls'
    },
    {
        id: 'data',
        label: 'Data Management',
        icon: <Database className="w-5 h-5" />,
        description: 'Backup, export, and data policies'
    },
    {
        id: 'appearance',
        label: 'Appearance',
        icon: <Palette className="w-5 h-5" />,
        description: 'Theme and interface customization'
    }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ searchTerm }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('proshop');

    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'employees':
                return <EmployeeManagement searchTerm={searchTerm} />;
            case 'locations':
                return <LocationManagement searchTerm={searchTerm} proshopID="proshop1" />;
            case 'proshop':
                return <ProShopSettingsManagement />;
            case 'notifications':
                return <NotificationSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'data':
                return <DataManagementSettings />;
            case 'appearance':
                return <AppearanceSettings />;
            default:
                return <div className="text-center py-12">Coming soon...</div>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                </div>
                <p className="text-gray-600">
                    Configure your pro shop management system
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <nav className="space-y-1">
                            {SETTINGS_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-start gap-3 px-3 py-3 text-left rounded-md transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`mt-0.5 ${
                                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                        {tab.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium ${
                                            activeTab === tab.id ? 'text-blue-700' : 'text-gray-900'
                                        }`}>
                                            {tab.label}
                                        </div>
                                        <div className={`text-xs mt-1 ${
                                            activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                            {tab.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                    {renderActiveTabContent()}
                </div>
            </div>
        </div>
    );
};

// // Placeholder components for other settings sections
// const LocationSettings: React.FC = () => {
//     return (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Settings</h2>
//             <div className="text-center py-12">
//                 <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">Location Management</h3>
//                 <p className="text-gray-600">
//                     Configure your pro shop locations, equipment, and operating hours
//                 </p>
//                 <div className="mt-6 text-sm text-gray-500">
//                     Coming soon...
//                 </div>
//             </div>
//         </div>
//     );
// };

// const ProShopSettings: React.FC = () => {
//     return (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">Pro Shop Settings</h2>
//             <div className="text-center py-12">
//                 <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">Business Configuration</h3>
//                 <p className="text-gray-600">
//                     Update your business information, pricing, and operational preferences
//                 </p>
//                 <div className="mt-6 text-sm text-gray-500">
//                     Coming soon...
//                 </div>
//             </div>
//         </div>
//     );
// };

const NotificationSettings: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
            <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h3>
                <p className="text-gray-600">
                    Configure email alerts, reminders, and system notifications
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Coming soon...
                </div>
            </div>
        </div>
    );
};

const SecuritySettings: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
            <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Security & Access</h3>
                <p className="text-gray-600">
                    Manage authentication, password policies, and access controls
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Coming soon...
                </div>
            </div>
        </div>
    );
};

const DataManagementSettings: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Data & Backup</h3>
                <p className="text-gray-600">
                    Export data, configure backups, and manage data retention policies
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Coming soon...
                </div>
            </div>
        </div>
    );
};

const AppearanceSettings: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance Settings</h2>
            <div className="text-center py-12">
                <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Theme & Interface</h3>
                <p className="text-gray-600">
                    Customize colors, themes, and interface preferences
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Coming soon...
                </div>
            </div>
        </div>
    );
};