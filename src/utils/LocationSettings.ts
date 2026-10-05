import {
    CompanySettings,
    CompanyWorkflowSettings,
    EffectiveLocationSettings,
    LocationSettingsOverrides
} from '../types';

type BooleanKeys<T> = { [K in keyof T]-?: T[K] extends boolean ? K : never }[keyof T];

export type WorkflowToggle = BooleanKeys<CompanyWorkflowSettings>;

/**
 * Workflow on/off settings a location may override. Company-wide process
 * settings (tracking, numbering, inventory) are intentionally not listed.
 */
export const OVERRIDABLE_WORKFLOW_TOGGLES: { key: WorkflowToggle; label: string }[] = [
    { key: 'requireCustomerApproval', label: 'Require Customer Approval' },
    { key: 'enableQualityChecks', label: 'Enable Quality Checks' },
    { key: 'requireSupervisorApproval', label: 'Require Supervisor Approval' },
    { key: 'autoAssignTechnicians', label: 'Auto-Assign Technicians' }
];

/**
 * Applies a location's overrides on top of the company defaults.
 * Unset (undefined) overrides fall back to the company value.
 */
export const resolveLocationSettings = (
    company: CompanySettings,
    overrides: LocationSettingsOverrides = {}
): EffectiveLocationSettings => ({
    timezone: company.general.timezone,
    currency: company.general.currency,
    taxRate: overrides.taxRate ?? company.general.taxRate,
    defaultWarrantyPeriod: overrides.defaultWarrantyPeriod ?? company.general.defaultWarrantyPeriod,
    workflow: { ...company.workflow, ...withoutUndefined(overrides.workflow) },
    notifications: { ...company.notifications, ...withoutUndefined(overrides.notifications) }
});

/**
 * Removes unset values and empty sections, so "no overrides" is always `{}`.
 */
export const pruneOverrides = (overrides: LocationSettingsOverrides): LocationSettingsOverrides => {
    const workflow = withoutUndefined(overrides.workflow);
    const notifications = withoutUndefined(overrides.notifications);

    return withoutUndefined({
        taxRate: overrides.taxRate,
        defaultWarrantyPeriod: overrides.defaultWarrantyPeriod,
        workflow: Object.keys(workflow).length > 0 ? workflow : undefined,
        notifications: Object.keys(notifications).length > 0 ? notifications : undefined
    });
};

export interface SettingOverrideDescription {
    key: string;
    label: string;
    value: string;
    companyValue: string;
}

/**
 * Human-readable list of what a location overrides, alongside the company value.
 */
export const describeOverrides = (
    company: CompanySettings,
    overrides: LocationSettingsOverrides = {}
): SettingOverrideDescription[] => {
    const rows: SettingOverrideDescription[] = [];
    const add = <T,>(key: string, label: string, value: T | undefined, companyValue: T | undefined, format: (v: T) => string) => {
        if (value === undefined) return;
        rows.push({
            key,
            label,
            value: format(value),
            companyValue: companyValue === undefined ? 'Not set' : format(companyValue)
        });
    };

    const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: company.general.currency });
    const onOff = (v: boolean) => (v ? 'On' : 'Off');
    const text = (v: string) => v;

    add('taxRate', 'Tax Rate', overrides.taxRate, company.general.taxRate, (v) => `${v}%`);
    add('defaultWarrantyPeriod', 'Warranty Period', overrides.defaultWarrantyPeriod,
        company.general.defaultWarrantyPeriod, (v) => `${v} days`);
    add('workflow.defaultLaborRate', 'Labor Rate', overrides.workflow?.defaultLaborRate,
        company.workflow.defaultLaborRate, (v) => `${money.format(v)}/hr`);

    OVERRIDABLE_WORKFLOW_TOGGLES.forEach(({ key, label }) =>
        add(`workflow.${key}`, label, overrides.workflow?.[key], company.workflow[key], onOff)
    );

    add('notifications.notificationEmail', 'Notification Email', overrides.notifications?.notificationEmail,
        company.notifications.notificationEmail, text);
    add('notifications.notificationPhone', 'Notification Phone', overrides.notifications?.notificationPhone,
        company.notifications.notificationPhone, text);

    return rows;
};

const withoutUndefined = <T extends object>(values: T | undefined): Partial<T> =>
    Object.fromEntries(
        Object.entries(values ?? {}).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
