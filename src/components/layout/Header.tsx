import React from 'react';
import { Search, Settings, Target } from 'lucide-react';

interface HeaderProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
                                                  searchTerm,
                                                  onSearchChange
                                              }) => {
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Target className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-xl font-bold text-gray-900">Drill Sheet Pro</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};