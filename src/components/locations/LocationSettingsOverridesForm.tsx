import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CompanySettings, CompanyWorkflowSettings, LocationSettingsOverrides } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { OVERRIDABLE_WORKFLOW_TOGGLES, describeOverrides, pruneOverrides } from '../../utils/LocationSettings';

interface LocationSettingsOverridesFormProps {
    overrides: LocationSettingsOverrides;
    companySettings: CompanySettings;
    onChange: (overrides: LocationSettingsOverrides) => void;
}

const parseNumber = (value: string): number | undefined => {
    if (value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseText = (value: string): string | undefined => (value.trim() === '' ? undefined : value);

export const LocationSettingsOverridesForm: React.FC<LocationSettingsOverridesFormProps> = ({
                                                                                                overrides,
                                                                                                companySettings,
                                                                                                onChange
                                                                                            }) => {
    const [expanded, setExpanded] = useState(false);
    const { general, workflow, notifications } = companySettings;
    const overrideCount = describeOverrides(companySettings, overrides).length;
    const companyLaborRate = new Intl.NumberFormat(undefined, { style: 'currency', currency: general.currency })
        .format(workflow.defaultLaborRate);

    const update = (next: LocationSettingsOverrides) => onChange(pruneOverrides(next));

    const updateWorkflow = <K extends keyof CompanyWorkflowSettings>(key: K, value: CompanyWorkflowSettings[K] | undefined) =>
        update({ ...overrides, workflow: { ...overrides.workflow, [key]: value } });

    const updateNotifications = (key: 'notificationEmail' | 'notificationPhone', value: string) =>
        update({ ...overrides, notifications: { ...overrides.notifications, [key]: parseText(value) } });

    const toggleValue = (value: boolean | undefined) => (value === undefined ? '' : value ? 'on' : 'off');

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="w-full flex items-center justify-between text-left"
                aria-expanded={expanded}
            >
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Settings Overrides
                </h3>
                <span className="flex items-center text-sm text-gray-500">
                    {overrideCount > 0 ? `${overrideCount} overridden` : 'Using company defaults'}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {expanded && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                        Leave a field blank to use the company default.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Tax Rate (%)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={overrides.taxRate?.toString() ?? ''}
                            onChange={(value) => update({ ...overrides, taxRate: parseNumber(value) })}
                            placeholder={general.taxRate?.toString() ?? ''}
                            helpText={`Company default: ${general.taxRate !== undefined ? `${general.taxRate}%` : 'not set'}`}
                        />
                        <Input
                            label="Warranty Period (Days)"
                            type="number"
                            min="0"
                            max="365"
                            value={overrides.defaultWarrantyPeriod?.toString() ?? ''}
                            onChange={(value) => update({ ...overrides, defaultWarrantyPeriod: parseNumber(value) })}
                            placeholder={general.defaultWarrantyPeriod.toString()}
                            helpText={`Company default: ${general.defaultWarrantyPeriod} days`}
                        />
                        <Input
                            label="Labor Rate (per hour)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={overrides.workflow?.defaultLaborRate?.toString() ?? ''}
                            onChange={(value) => updateWorkflow('defaultLaborRate', parseNumber(value))}
                            placeholder={workflow.defaultLaborRate.toString()}
                            helpText={`Company default: ${companyLaborRate}/hour`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {OVERRIDABLE_WORKFLOW_TOGGLES.map(({ key, label }) => (
                            <Select
                                key={key}
                                label={label}
                                value={toggleValue(overrides.workflow?.[key])}
                                onChange={(value) => updateWorkflow(key, value === '' ? undefined : value === 'on')}
                                options={[
                                    { value: '', label: `Company default (${workflow[key] ? 'On' : 'Off'})` },
                                    { value: 'on', label: 'On' },
                                    { value: 'off', label: 'Off' }
                                ]}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Notification Email"
                            type="email"
                            value={overrides.notifications?.notificationEmail ?? ''}
                            onChange={(value) => updateNotifications('notificationEmail', value)}
                            placeholder={notifications.notificationEmail ?? ''}
                            helpText="Where this location's alerts are sent"
                        />
                        <Input
                            label="Notification Phone"
                            type="tel"
                            value={overrides.notifications?.notificationPhone ?? ''}
                            onChange={(value) => updateNotifications('notificationPhone', value)}
                            placeholder={notifications.notificationPhone ?? ''}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
