import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CompanySettings, LocationSettingsOverrides } from '../../types';
import { describeOverrides } from '../../utils/LocationSettings';

interface LocationOverridesSummaryProps {
    overrides?: LocationSettingsOverrides;
    companySettings: CompanySettings;
}

export const LocationOverridesSummary: React.FC<LocationOverridesSummaryProps> = ({
                                                                                      overrides,
                                                                                      companySettings
                                                                                  }) => {
    const rows = describeOverrides(companySettings, overrides);

    if (rows.length === 0) return null;

    return (
        <div className="border-t pt-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                Overrides company settings ({rows.length})
            </h4>
            <dl className="space-y-1">
                {rows.map(row => (
                    <div key={row.key} className="flex items-baseline justify-between gap-4 text-sm">
                        <dt className="text-gray-600 shrink-0">{row.label}</dt>
                        <dd className="min-w-0 flex flex-col items-end text-right">
                            <span className="font-medium text-gray-900 break-all">{row.value}</span>
                            <span className="text-xs text-gray-400 break-all">company: {row.companyValue}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};
