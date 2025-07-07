import { ProShopSettings } from '../types/proshopSettings';

export const mockProShopSettings: ProShopSettings = {
    general: {
        businessName: 'Strike Zone Pro Shop',
        ownerName: 'John Smith',
        phone: '555-0123',
        address: '123 Bowling Lane, Sports City, SC 12345',
        billingEmail: 'billing@strikezoneproshop.com',
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 8.5,
        defaultWarrantyPeriod: 90,
        businessHours: {
            monday: { open: '09:00', close: '21:00' },
            tuesday: { open: '09:00', close: '21:00' },
            wednesday: { open: '09:00', close: '21:00' },
            thursday: { open: '09:00', close: '21:00' },
            friday: { open: '09:00', close: '22:00' },
            saturday: { open: '08:00', close: '22:00' },
            sunday: { open: '10:00', close: '20:00' }
        }
    },
    billing: {
        subscriptionTier: 'PRO',
        billingCycle: 'MONTHLY',
        nextBillingDate: '2025-08-07',
        autoRenewal: true,
        invoiceEmail: 'billing@strikezoneproshop.com',
        taxId: '12-3456789',
        billingAddress: {
            street: '123 Bowling Lane',
            city: 'Sports City',
            state: 'SC',
            zipCode: '12345',
            country: 'US'
        }
    },
    workflow: {
        requireCustomerApproval: true,
        enableQualityChecks: true,
        defaultLaborRate: 50.0,
        enableWorkOrderTracking: true,
        enableCustomerNotifications: true,
        autoAssignTechnicians: false,
        requireSupervisorApproval: true,
        enableInventoryTracking: false,
        workOrderNumberFormat: 'WO-{YYYY}{MM}{DD}-{###}',
        priorityLevels: ['Low', 'Normal', 'High', 'Urgent']
    },
    security: {
        enableTwoFactor: false,
        passwordMinLength: 8,
        passwordRequireSpecialChars: true,
        passwordRequireNumbers: true,
        sessionTimeoutMinutes: 120,
        loginAttemptLimit: 5,
        enableAuditLog: true,
        dataRetentionDays: 2555, // 7 years
        enableBackups: true,
        backupFrequency: 'DAILY'
    },
    notifications: {
        emailNotifications: {
            workOrderUpdates: true,
            customerMessages: true,
            paymentReminders: true,
            systemUpdates: false,
            dailyReports: true
        },
        smsNotifications: {
            urgentAlerts: true,
            workOrderComplete: false,
            appointmentReminders: true
        },
        pushNotifications: {
            newWorkOrders: true,
            customerCheckins: true,
            systemAlerts: true
        },
        notificationEmail: 'alerts@strikezoneproshop.com',
        notificationPhone: '555-0124'
    },
    integrations: {
        posIntegration: {
            enabled: false,
            provider: 'Square',
            syncInterval: 300
        },
        inventoryIntegration: {
            enabled: false,
            provider: 'ShopKeep',
            autoOrderLowStock: false
        },
        paymentProcessing: {
            enabled: true,
            provider: 'Stripe',
            merchantId: 'acct_1234567890',
            testMode: false
        },
        emailProvider: {
            provider: 'SENDGRID',
            fromEmail: 'noreply@strikezoneproshop.com',
            fromName: 'Strike Zone Pro Shop'
        }
    }
};

// Additional mock data for different pro shop scenarios
export const mockProShopSettingsBasic: ProShopSettings = {
    general: {
        businessName: 'Lucky Strikes Pro Shop',
        ownerName: 'Sarah Johnson',
        phone: '555-0456',
        address: '456 Pin Street, Bowl City, BC 67890',
        billingEmail: 'sarah@luckystrikes.com',
        timezone: 'America/Chicago',
        currency: 'USD',
        taxRate: 7.25,
        defaultWarrantyPeriod: 60,
        businessHours: {
            monday: { open: '10:00', close: '20:00' },
            tuesday: { open: '10:00', close: '20:00' },
            wednesday: { closed: true },
            thursday: { open: '10:00', close: '20:00' },
            friday: { open: '10:00', close: '21:00' },
            saturday: { open: '09:00', close: '21:00' },
            sunday: { open: '12:00', close: '18:00' }
        }
    },
    billing: {
        subscriptionTier: 'BASIC',
        billingCycle: 'YEARLY',
        nextBillingDate: '2025-12-15',
        autoRenewal: true,
        invoiceEmail: 'billing@luckystrikes.com',
        billingAddress: {
            street: '456 Pin Street',
            city: 'Bowl City',
            state: 'BC',
            zipCode: '67890',
            country: 'US'
        }
    },
    workflow: {
        requireCustomerApproval: false,
        enableQualityChecks: false,
        defaultLaborRate: 35.0,
        enableWorkOrderTracking: true,
        enableCustomerNotifications: false,
        autoAssignTechnicians: true,
        requireSupervisorApproval: false,
        enableInventoryTracking: false,
        workOrderNumberFormat: 'LS-{###}',
        priorityLevels: ['Normal', 'High']
    },
    security: {
        enableTwoFactor: false,
        passwordMinLength: 6,
        passwordRequireSpecialChars: false,
        passwordRequireNumbers: true,
        sessionTimeoutMinutes: 240,
        loginAttemptLimit: 3,
        enableAuditLog: false,
        dataRetentionDays: 1095, // 3 years
        enableBackups: false,
        backupFrequency: 'WEEKLY'
    },
    notifications: {
        emailNotifications: {
            workOrderUpdates: true,
            customerMessages: false,
            paymentReminders: true,
            systemUpdates: true,
            dailyReports: false
        },
        smsNotifications: {
            urgentAlerts: false,
            workOrderComplete: false,
            appointmentReminders: false
        },
        pushNotifications: {
            newWorkOrders: false,
            customerCheckins: false,
            systemAlerts: false
        },
        notificationEmail: 'sarah@luckystrikes.com'
    },
    integrations: {
        posIntegration: {
            enabled: false,
            provider: '',
            syncInterval: 300
        },
        inventoryIntegration: {
            enabled: false,
            provider: '',
            autoOrderLowStock: false
        },
        paymentProcessing: {
            enabled: false,
            provider: '',
            testMode: true
        },
        emailProvider: {
            provider: 'AWS_SES',
            fromEmail: 'noreply@luckystrikes.com',
            fromName: 'Lucky Strikes Pro Shop'
        }
    }
};

export const mockProShopSettingsEnterprise: ProShopSettings = {
    general: {
        businessName: 'Championship Lanes Pro Shop Network',
        ownerName: 'Michael Rodriguez',
        phone: '555-0789',
        address: '789 Strike Avenue, Pro City, PC 13579',
        billingEmail: 'billing@championshiplanes.com',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        taxRate: 9.75,
        defaultWarrantyPeriod: 120,
        businessHours: {
            monday: { open: '08:00', close: '22:00' },
            tuesday: { open: '08:00', close: '22:00' },
            wednesday: { open: '08:00', close: '22:00' },
            thursday: { open: '08:00', close: '22:00' },
            friday: { open: '08:00', close: '23:00' },
            saturday: { open: '07:00', close: '23:00' },
            sunday: { open: '09:00', close: '21:00' }
        }
    },
    billing: {
        subscriptionTier: 'ENTERPRISE',
        billingCycle: 'YEARLY',
        nextBillingDate: '2026-01-01',
        autoRenewal: true,
        invoiceEmail: 'accounting@championshiplanes.com',
        taxId: '98-7654321',
        billingAddress: {
            street: '789 Strike Avenue',
            city: 'Pro City',
            state: 'PC',
            zipCode: '13579',
            country: 'US'
        }
    },
    workflow: {
        requireCustomerApproval: true,
        enableQualityChecks: true,
        defaultLaborRate: 75.0,
        enableWorkOrderTracking: true,
        enableCustomerNotifications: true,
        autoAssignTechnicians: true,
        requireSupervisorApproval: true,
        enableInventoryTracking: true,
        workOrderNumberFormat: 'CL-{YYYY}-{MM}-{DD}-{####}',
        priorityLevels: ['Low', 'Normal', 'High', 'Urgent', 'Emergency']
    },
    security: {
        enableTwoFactor: true,
        passwordMinLength: 12,
        passwordRequireSpecialChars: true,
        passwordRequireNumbers: true,
        sessionTimeoutMinutes: 60,
        loginAttemptLimit: 3,
        enableAuditLog: true,
        dataRetentionDays: 3650, // 10 years
        enableBackups: true,
        backupFrequency: 'DAILY'
    },
    notifications: {
        emailNotifications: {
            workOrderUpdates: true,
            customerMessages: true,
            paymentReminders: true,
            systemUpdates: true,
            dailyReports: true
        },
        smsNotifications: {
            urgentAlerts: true,
            workOrderComplete: true,
            appointmentReminders: true
        },
        pushNotifications: {
            newWorkOrders: true,
            customerCheckins: true,
            systemAlerts: true
        },
        notificationEmail: 'alerts@championshiplanes.com',
        notificationPhone: '555-0790'
    },
    integrations: {
        posIntegration: {
            enabled: true,
            provider: 'Clover',
            apiKey: 'clover_live_key_hidden',
            syncInterval: 120
        },
        inventoryIntegration: {
            enabled: true,
            provider: 'Lightspeed',
            apiKey: 'lightspeed_api_key_hidden',
            autoOrderLowStock: true
        },
        paymentProcessing: {
            enabled: true,
            provider: 'Stripe',
            merchantId: 'acct_enterprise_hidden',
            testMode: false
        },
        emailProvider: {
            provider: 'SENDGRID',
            apiKey: 'sendgrid_api_key_hidden',
            fromEmail: 'noreply@championshiplanes.com',
            fromName: 'Championship Lanes Pro Shop'
        }
    }
};