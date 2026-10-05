// src/types/settings.ts

// Company-wide settings. Address, phone and hours are per location (see Location).
// Billing and security are company-only; some other sections can be
// overridden per location (see LocationSettingsOverrides).

export interface CompanyGeneralSettings {
    businessName: string;
    ownerName: string;
    billingEmail: string;
    timezone: string;
    currency: string;
    taxRate?: number;
    defaultWarrantyPeriod: number; // days
}

export interface CompanyBillingSettings {
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

export interface CompanyWorkflowSettings {
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

export interface CompanySecuritySettings {
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

export interface CompanyNotificationSettings {
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

export interface CompanyIntegrationSettings {
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

export interface CompanySettings {
    general: CompanyGeneralSettings;
    billing: CompanyBillingSettings;
    workflow: CompanyWorkflowSettings;
    security: CompanySecuritySettings;
    notifications: CompanyNotificationSettings;
    integrations: CompanyIntegrationSettings;
}

export type CompanySettingsSection =
    | 'general'
    | 'billing'
    | 'workflow'
    | 'security'
    | 'notifications'
    | 'integrations';

// ==========================================
// LOCATION OVERRIDES
// ==========================================

/**
 * Per-location overrides of company defaults. Anything not set here falls
 * back to the company value; see resolveLocationSettings.
 */
export interface LocationSettingsOverrides {
    taxRate?: number;
    defaultWarrantyPeriod?: number;
    workflow?: Partial<CompanyWorkflowSettings>;
    notifications?: Partial<Pick<CompanyNotificationSettings, 'notificationEmail' | 'notificationPhone'>>;
}

/**
 * The settings that actually apply at a location: company defaults with the
 * location's overrides applied.
 */
export interface EffectiveLocationSettings {
    timezone: string;
    currency: string;
    taxRate?: number;
    defaultWarrantyPeriod: number;
    workflow: CompanyWorkflowSettings;
    notifications: CompanyNotificationSettings;
}
