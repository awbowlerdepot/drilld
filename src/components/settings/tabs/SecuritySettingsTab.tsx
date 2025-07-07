import React from 'react';
import { Shield, Key, Clock, Database, HardDrive } from 'lucide-react';
import { ProShopSecuritySettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface SecuritySettingsTabProps {
    settings: ProShopSecuritySettings;
    onUpdate: (updates: Partial<ProShopSecuritySettings>) => void;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({
                                                                            settings,
                                                                            onUpdate
                                                                        }) => {
    const backupFrequencyOptions = [
        { value: 'DAILY', label: 'Daily' },
        { value: 'WEEKLY', label: 'Weekly' },
        { value: 'MONTHLY', label: 'Monthly' }
    ];

    return (
        <div className="space-y-8">
            {/* Authentication */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" />
                    Authentication
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableTwoFactor}
                            onChange={(e) => onUpdate({ enableTwoFactor: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</span>
                            <p className="text-xs text-gray-500">Require SMS or authenticator app verification for login</p>
                        </div>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Minimum Password Length"
                            type="number"
                            value={settings.passwordMinLength.toString()}
                            onChange={(value) => onUpdate({ passwordMinLength: parseInt(value) || 8 })}
                            min="6"
                            max="32"
                            required
                        />

                        <Input
                            label="Login Attempt Limit"
                            type="number"
                            value={settings.loginAttemptLimit.toString()}
                            onChange={(value) => onUpdate({ loginAttemptLimit: parseInt(value) || 5 })}
                            min="3"
                            max="10"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={settings.passwordRequireSpecialChars}
                                onChange={(e) => onUpdate({ passwordRequireSpecialChars: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-900">Require special characters in passwords</span>
                        </label>

                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={settings.passwordRequireNumbers}
                                onChange={(e) => onUpdate({ passwordRequireNumbers: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-900">Require numbers in passwords</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Session Management */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Session Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <Input
                        label="Session Timeout (Minutes)"
                        type="number"
                        value={settings.sessionTimeoutMinutes.toString()}
                        onChange={(value) => onUpdate({ sessionTimeoutMinutes: parseInt(value) || 120 })}
                        min="10"
                        max="480"
                        required
                    />
                </div>
            </div>

            {/* Data Protection */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    Data Protection
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableAuditLog}
                            onChange={(e) => onUpdate({ enableAuditLog: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Audit Logging</span>
                            <p className="text-xs text-gray-500">Track all user actions and system changes</p>
                        </div>
                    </label>

                    <Input
                        label="Data Retention Period (Days)"
                        type="number"
                        value={settings.dataRetentionDays.toString()}
                        onChange={(value) => onUpdate({ dataRetentionDays: parseInt(value) || 2555 })}
                        min="30"
                        max="3650"
                        required
                    />
                </div>
            </div>

            {/* Backup Settings */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-blue-600" />
                    Backup & Recovery
                </h3>
                <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableBackups}
                            onChange={(e) => onUpdate({ enableBackups: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Automatic Backups</span>
                            <p className="text-xs text-gray-500">Automatically backup your data to secure cloud storage</p>
                        </div>
                    </label>

                    {settings.enableBackups && (
                        <div className="ml-7">
                            <Select
                                label="Backup Frequency"
                                value={settings.backupFrequency}
                                onChange={(value) => onUpdate({ backupFrequency: value as 'DAILY' | 'WEEKLY' | 'MONTHLY' })}
                                options={backupFrequencyOptions}
                                required
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Security Best Practices</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Enable two-factor authentication for all admin accounts</li>
                            <li>• Use strong passwords with at least 12 characters</li>
                            <li>• Regularly review audit logs for suspicious activity</li>
                            <li>• Keep data retention periods compliant with local regulations</li>
                            <li>• Test backup restoration procedures periodically</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};