import React from 'react';
import {
    BarChart3,
    Inbox,
    LogOut,
    LucideIcon,
    MapPin,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    Target,
    Users,
    Wrench,
    X
} from 'lucide-react';
import { AppSection, Location, SignedInUser } from '../../types';
import { AppLogo } from './AppLogo';

interface SidebarProps {
    activeSection: AppSection;
    onNavigate: (section: AppSection) => void;
    locations: Location[];
    currentLocationID: string;
    onLocationChange: (locationID: string) => void;
    user?: SignedInUser;
    /** Phone layouts only: whether the drawer is showing. Always visible from md up. */
    open: boolean;
    onClose: () => void;
    /** md and up: icons only. The phone drawer is always full width. */
    collapsed: boolean;
    onToggleCollapsed: () => void;
    /** Platform admins (Drilld staff) also get Leads, with the admin items. */
    showLeads?: boolean;
}

const NAV_ITEMS: { id: AppSection; label: string; icon: LucideIcon }[] = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'workorders', label: 'Work Orders', icon: Wrench },
    { id: 'balls', label: 'Bowling Balls', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
];

/**
 * Root navigation. A fixed column from md up, optionally collapsed to an icon
 * rail; on phones a drawer opened from the top bar's menu button.
 */
export const Sidebar: React.FC<SidebarProps> = ({
                                                    activeSection,
                                                    onNavigate,
                                                    locations,
                                                    currentLocationID,
                                                    onLocationChange,
                                                    user,
                                                    open,
                                                    onClose,
                                                    collapsed,
                                                    onToggleCollapsed,
                                                    showLeads = false
                                                }) => {
    const activeLocations = locations.filter(location => location.active);
    const currentLocation = activeLocations.find(location => location.id === currentLocationID);

    // Collapsed applies from md up only: labels become screen-reader text, items center their icon.
    const label = collapsed ? 'md:sr-only' : '';
    const itemClasses = (active: boolean) =>
        `flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors ${
            collapsed ? 'md:justify-center md:px-0' : ''
        } ${
            active
                ? 'bg-blue-50 font-semibold text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`;
    // Native tooltip names icon-only items when collapsed.
    const tooltip = (text: string) => (collapsed ? text : undefined);

    return (
        <>
            {open && (
                <div className="fixed inset-0 z-30 bg-gray-900/40 md:hidden" onClick={onClose} aria-hidden="true" />
            )}
            <aside
                id="app-sidebar"
                className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-5 border-r border-gray-200 bg-white py-5 transition-[transform,width] md:visible md:sticky md:top-0 md:h-screen md:translate-x-0 ${
                    collapsed ? 'px-3.5 md:w-16 md:px-2' : 'px-3.5 md:w-64'
                } ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
            >
                {/* Logo and the collapse toggle. Collapsed on desktop, only the expand button shows. */}
                <div className={`flex items-center gap-2 px-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
                    <span className={collapsed ? 'md:hidden' : undefined}><AppLogo /></span>
                    <button
                        onClick={onToggleCollapsed}
                        className={`hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:block ${collapsed ? '' : 'ml-auto'}`}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-expanded={!collapsed}
                        aria-controls="app-sidebar"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed
                            ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
                            : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                        aria-label="Close navigation"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <label className={`flex flex-col gap-1.5 px-2 text-xs font-medium uppercase tracking-wider text-gray-600 ${collapsed ? 'md:hidden' : ''}`}>
                    Location
                    <select
                        value={currentLocationID}
                        onChange={(e) => onLocationChange(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {activeLocations.map(location => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </select>
                </label>
                {collapsed && (
                    // Collapsed: the location is shown as an icon; choosing a different one needs the full sidebar.
                    <button
                        onClick={onToggleCollapsed}
                        className="hidden min-h-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:flex"
                        title={`Location: ${currentLocation?.name ?? 'none'} (expand to change)`}
                        aria-label={`Location: ${currentLocation?.name ?? 'none'}. Expand sidebar to change`}
                    >
                        <MapPin className="h-5 w-5" aria-hidden="true" />
                    </button>
                )}

                <nav aria-label="Primary" className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map(({ id, label: text, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            aria-current={activeSection === id ? 'page' : undefined}
                            className={itemClasses(activeSection === id)}
                            title={tooltip(text)}
                        >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className={label}>{text}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto flex flex-col gap-0.5 border-t border-gray-200 pt-3.5">
                    {showLeads && (
                        <button
                            onClick={() => onNavigate('leads')}
                            aria-current={activeSection === 'leads' ? 'page' : undefined}
                            className={itemClasses(activeSection === 'leads')}
                            title={tooltip('Leads')}
                        >
                            <Inbox className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className={label}>Leads</span>
                        </button>
                    )}
                    <button
                        onClick={() => onNavigate('settings')}
                        aria-current={activeSection === 'settings' ? 'page' : undefined}
                        className={itemClasses(activeSection === 'settings')}
                        title={tooltip('Settings')}
                    >
                        <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={label}>Settings</span>
                    </button>


                    {user ? (
                        <div className={`flex items-center gap-2.5 px-2.5 py-2.5 ${collapsed ? 'md:flex-col md:px-0' : ''}`}>
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
                                title={user.email}
                                aria-hidden="true"
                            >
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <span className={`min-w-0 truncate text-sm text-gray-700 ${label}`} title={user.email}>{user.email}</span>
                            <button
                                onClick={user.signOut}
                                className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${collapsed ? 'ml-auto md:ml-0' : 'ml-auto'}`}
                                aria-label="Sign out"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <p className={`px-2.5 py-2.5 text-xs text-gray-500 ${label}`}>Not signed in · mock data</p>
                    )}
                </div>
            </aside>
        </>
    );
};
