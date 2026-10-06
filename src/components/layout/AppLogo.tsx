import React from 'react';

/** The Drilld mark and name. */
export const AppLogo: React.FC = () => (
    <span className="flex items-center gap-2.5 text-xl font-bold text-gray-900">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2"
             className="shrink-0 text-blue-600" aria-hidden="true">
            <circle cx="14" cy="14" r="12" />
            <circle cx="14" cy="14" r="6" />
            <circle cx="14" cy="14" r="1.5" fill="currentColor" />
        </svg>
        Drilld
    </span>
);
