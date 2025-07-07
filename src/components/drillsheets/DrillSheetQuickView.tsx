import React from 'react';
import { FileText, Clock, User } from 'lucide-react';
import { DrillSheet, Customer } from '../../types';

interface DrillSheetQuickViewProps {
    drillSheets: DrillSheet[];
    customers: Customer[];
    onViewAll: () => void;
}

export const DrillSheetQuickView: React.FC<DrillSheetQuickViewProps> = ({
                                                                            drillSheets,
                                                                            customers,
                                                                            onViewAll
                                                                        }) => {
    const recentDrillSheets = drillSheets
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const getCustomerById = (id: string) => {
        return customers.find(c => c.id === id);
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Drill Sheets</h3>
                <button
                    onClick={onViewAll}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    View All →
                </button>
            </div>

            {recentDrillSheets.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drill sheets</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Drill sheets will appear here as customers create them.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentDrillSheets.map((sheet) => {
                        const customer = getCustomerById(sheet.customerID);
                        return (
                            <div key={sheet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{sheet.name}</p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <User className="w-3 h-3" />
                                            <span>{customer?.firstName} {customer?.lastName}</span>
                                            <Clock className="w-3 h-3 ml-2" />
                                            <span>{new Date(sheet.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">{sheet.gripStyle}</span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        sheet.isTemplate
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                    {sheet.isTemplate ? 'Template' : 'Active'}
                  </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};