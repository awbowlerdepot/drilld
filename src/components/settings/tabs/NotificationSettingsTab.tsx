import React from 'react';
import { Mail, MessageSquare, Bell, Phone } from 'lucide-react';
import { ProShopNotificationSettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';

interface NotificationSettingsTabProps {
    settings: ProShopNotificationSettings;
    onUpdate: (updates: Partial<ProShopNotificationSettings>) => void;
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
                                                                                    settings,
                                                                                    onUpdate
                                                                                }) => {
    const updateEmailNotifications = (key: string, value: boolean) => {
        onUpdate({
            emailNotifications: {
                ...settings.emailNotifications,
                [key]: value
            }
        });
    };

    const updateSmsNotifications = (key: string, value: boolean) => {
        onUpdate({
            smsNotifications: {
                ...settings.smsNotifications,
                [key]: value
            }
        });
    };

    const updatePushNotifications = (key: string, value: boolean) => {
        onUpdate({
            pushNotifications: {
                ...settings.pushNotifications,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Contact Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-blue-600" />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Notification Email"
                        type="email"
                        value={settings.notificationEmail || ''}
                        onChange={(value) => onUpdate({ notificationEmail: value })}
                        placeholder="alerts@yourproshop.com"
                    />

                    <Input
                        label="Notification Phone"
                        value={settings.notificationPhone || ''}
                        onChange={(value) => onUpdate({ notificationPhone: value })}
                        placeholder="(555) 123-4567"
                    />
                </div>
            </div>

            {/* Email Notifications */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Email Notifications
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Work Order Updates</span>
                            <p className="text-xs text-gray-500">Notifications when work orders are created, updated, or completed</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications.workOrderUpdates}
                            onChange={(e) => updateEmailNotifications('workOrderUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Customer Messages</span>
                            <p className="text-xs text-gray-500">Notifications when customers send messages or inquiries</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications.customerMessages}
                            onChange={(e) => updateEmailNotifications('customerMessages', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Payment Reminders</span>
                            <p className="text-xs text-gray-500">Notifications for overdue payments and billing issues</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications.paymentReminders}
                            onChange={(e) => updateEmailNotifications('paymentReminders', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">System Updates</span>
                            <p className="text-xs text-gray-500">Notifications about system maintenance and new features</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications.systemUpdates}
                            onChange={(e) => updateEmailNotifications('systemUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Daily Reports</span>
                            <p className="text-xs text-gray-500">Daily summary of work orders, sales, and key metrics</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications.dailyReports}
                            onChange={(e) => updateEmailNotifications('dailyReports', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* SMS Notifications */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                    SMS Notifications
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Urgent Alerts</span>
                            <p className="text-xs text-gray-500">Critical system alerts and emergency notifications</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.smsNotifications.urgentAlerts}
                            onChange={(e) => updateSmsNotifications('urgentAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Work Order Complete</span>
                            <p className="text-xs text-gray-500">SMS when work orders are marked as completed</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.smsNotifications.workOrderComplete}
                            onChange={(e) => updateSmsNotifications('workOrderComplete', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Appointment Reminders</span>
                            <p className="text-xs text-gray-500">Reminders for scheduled appointments and deliveries</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.smsNotifications.appointmentReminders}
                            onChange={(e) => updateSmsNotifications('appointmentReminders', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* Push Notifications */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-blue-600" />
                    Push Notifications
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">New Work Orders</span>
                            <p className="text-xs text-gray-500">Instant notifications when new work orders are created</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.pushNotifications.newWorkOrders}
                            onChange={(e) => updatePushNotifications('newWorkOrders', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">Customer Check-ins</span>
                            <p className="text-xs text-gray-500">Notifications when customers arrive for appointments</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.pushNotifications.customerCheckins}
                            onChange={(e) => updatePushNotifications('customerCheckins', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm font-medium text-gray-900">System Alerts</span>
                            <p className="text-xs text-gray-500">Important system notifications and status updates</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.pushNotifications.systemAlerts}
                            onChange={(e) => updatePushNotifications('systemAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* Notification Schedule */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                    <Bell className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">Notification Schedule</h4>
                        <p className="text-xs text-yellow-700 mb-2">
                            Notifications will be sent according to your business hours. Urgent alerts are sent immediately regardless of time.
                        </p>
                        <button className="text-xs text-yellow-700 underline hover:text-yellow-800">
                            Configure Quiet Hours
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};