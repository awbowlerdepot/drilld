import { CompanySettings, EffectiveLocationSettings, LocationSettingsOverrides } from '../types';

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

const withoutUndefined = <T extends object>(values: T | undefined): Partial<T> =>
    Object.fromEntries(
        Object.entries(values ?? {}).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
