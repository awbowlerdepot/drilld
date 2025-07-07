// src/types/proshopSettings.ts

export interface ProShopGeneralSettings {
    businessName: string;
    ownerName: string;
    phone?: string;
    address?: string;
    billingEmail: string;
    timezone: string;
    currency: string;
    taxRate?: number;
    defaultWarrantyPeriod: number; // days
    businessHours: {
        [key: string]: {
            open?: string;
            close?: string;
            closed?: boolean;
        };
    };
}

export interface ProShopBillingSettings {
    subscriptionTier: 'BASIC' | 'PRO' | 'ENTERPRISE';
    billingCycle: 'MONTHLY' | 'YEARLY';
    paymentMethod?: string;
    nextBillingDate?: string;
    autoRenewal: boolean;
    invoiceEmail?: string;
    taxId?: string;
    billingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}

export interface ProShopWorkflowSettings {
    requireCustomerApproval: boolean;
    enableQualityChecks: boolean;
    defaultLaborRate: number;
    enableWorkOrderTracking: boolean;
    enableCustomerNotifications: boolean;
    autoAssignTechnicians: boolean;
    requireSupervisorApproval: boolean;
    enableInventoryTracking: boolean;
    workOrderNumberFormat: string;
    priorityLevels: string[];
}

export interface ProShopSecuritySettings {
    enableTwoFactor: boolean;
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    sessionTimeoutMinutes: number;
    loginAttemptLimit: number;
    enableAuditLog: boolean;
    dataRetentionDays: number;
    enableBackups: boolean;
    backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface ProShopNotificationSettings {
    emailNotifications: {
        workOrderUpdates: boolean;
        customerMessages: boolean;
        paymentReminders: boolean;
        systemUpdates: boolean;
        dailyReports: boolean;
    };
    smsNotifications: {
        urgentAlerts: boolean;
        workOrderComplete: boolean;
        appointmentReminders: boolean;
    };
    pushNotifications: {
        newWorkOrders: boolean;
        customerCheckins: boolean;
        systemAlerts: boolean;
    };
    notificationEmail?: string;
    notificationPhone?: string;
}

export interface ProShopIntegrationSettings {
    posIntegration?: {
        enabled: boolean;
        provider: string;
        apiKey?: string;
        syncInterval: number;
    };
    inventoryIntegration?: {
        enabled: boolean;
        provider: string;
        apiKey?: string;
        autoOrderLowStock: boolean;
    };
    paymentProcessing?: {
        enabled: boolean;
        provider: string;
        merchantId?: string;
        testMode: boolean;
    };
    emailProvider?: {
        provider: 'SENDGRID' | 'MAILCHIMP' | 'AWS_SES';
        apiKey?: string;
        fromEmail: string;
        fromName: string;
    };
}

export interface ProShopSettings {
    general: ProShopGeneralSettings;
    billing: ProShopBillingSettings;
    workflow: ProShopWorkflowSettings;
    security: ProShopSecuritySettings;
    notifications: ProShopNotificationSettings;
    integrations: ProShopIntegrationSettings;
}

export type ProShopSettingsSection =
    | 'general'
    | 'billing'
    | 'workflow'
    | 'security'
    | 'notifications'
    | 'integrations';