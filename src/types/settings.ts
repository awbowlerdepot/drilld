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

/**
 * Drill sheet settings. The readout directions say which sign the press's
 * digital readout shows for up and right: the default is up and right
 * positive (left negative). Presses differ, so it's a setting. It only
 * changes how pitch and cut positions are shown, never what's stored. It
 * moves to each press once equipment is modelled.
 */
export interface CompanyDrillSheetSettings {
    /** Show CLT (center line transformation) and Auto-CLT lateral pitch suggestions. */
    enableClt: boolean;
    verticalReadout: 'UP_POSITIVE' | 'DOWN_POSITIVE';
    horizontalReadout: 'RIGHT_POSITIVE' | 'LEFT_POSITIVE';
    /** The bevel every hole gets (insert holes too) unless a drill sheet sets its own. */
    standardBevel: 'LIGHT' | 'MEDIUM' | 'HEAVY';
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
    drillSheets: CompanyDrillSheetSettings;
    security: CompanySecuritySettings;
    notifications: CompanyNotificationSettings;
    integrations: CompanyIntegrationSettings;
}

export type CompanySettingsSection =
    | 'general'
    | 'billing'
    | 'workflow'
    | 'drillSheets'
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
    /** A location's presses may count the other way. */
    drillSheets?: Partial<Pick<CompanyDrillSheetSettings, 'verticalReadout' | 'horizontalReadout'>>;
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
    drillSheets: CompanyDrillSheetSettings;
    notifications: CompanyNotificationSettings;
}
