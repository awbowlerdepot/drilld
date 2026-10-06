import React from 'react';
import { Menu, Search } from 'lucide-react';

interface TopBarProps {
    /** The current section's name. */
    title: string;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    /** Opens the sidebar drawer on phones. */
    onMenuClick: () => void;
    menuOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
                                                  title,
                                                  searchTerm,
                                                  onSearchChange,
                                                  onMenuClick,
                                                  menuOpen
                                              }) => (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-7">
        <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={menuOpen}
        >
            <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <label className="relative ml-auto flex min-w-0 items-center">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-500" aria-hidden="true" />
            <input
                type="search"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search…"
                className="w-44 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-72"
            />
        </label>
    </div>
);
