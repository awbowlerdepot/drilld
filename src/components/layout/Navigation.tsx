import React from 'react';
import { Users, FileText, Target, Wrench, BarChart3 } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface NavigationProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
                                                          activeTab,
                                                          onTabChange
                                                      }) => {
    const tabs: Tab[] = [
        { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
        { id: 'drillsheets', label: 'Drill Sheets', icon: <FileText className="w-4 h-4" /> },
        { id: 'balls', label: 'Bowling Balls', icon: <Target className="w-4 h-4" /> },
        { id: 'workorders', label: 'Work Orders', icon: <Wrench className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    ];

    return (
        <nav className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};