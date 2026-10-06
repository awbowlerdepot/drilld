import { useState } from 'react';

const STORAGE_KEY = 'drilld.sidebarCollapsed';

/**
 * Whether the desktop sidebar is collapsed to icons. Remembered per browser;
 * storage can be unavailable (private mode, blocked), so failures fall back
 * to expanded and are otherwise ignored.
 */
export const useSidebarCollapsed = () => {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const toggleCollapsed = () => {
        setCollapsed(previous => {
            const next = !previous;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // Not remembered; still works for this visit.
            }
            return next;
        });
    };

    return { collapsed, toggleCollapsed };
};
