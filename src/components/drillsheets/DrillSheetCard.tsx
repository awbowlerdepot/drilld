import React from 'react';
import { Edit, Eye, FileText } from 'lucide-react';
import { DrillSheet, Customer } from '../../types';

interface DrillSheetCardProps {
    drillSheet: DrillSheet;
    customer?: Customer;
    onEdit: (drillSheet: DrillSheet) => void;
    onView: (drillSheet: DrillSheet) => void;
    onPrint: (drillSheet: DrillSheet) => void;
}

export const DrillSheetCard: React.FC<DrillSheetCardProps> = ({
                                                                  drillSheet,
                                                                  customer,
                                                                  onEdit,
                                                                  onView,
                                                                  onPrint
                                                              }) => {
    return (
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">{drillSheet.name}</h3>
                    <p className="text-sm text-gray-500">
                        {customer?.firstName} {customer?.lastName}
                    </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                    drillSheet.isTemplate
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                }`}>
          {drillSheet.isTemplate ? 'Template' : 'Active'}
        </span>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Grip Style:</span>
                    <span className="font-medium">{drillSheet.gripStyle}</span>
                </div>
                {drillSheet.thumbToMiddleFit && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Thumb-Middle:</span>
                        <span className="font-medium">{drillSheet.thumbToMiddleFit}"</span>
                    </div>
                )}
                {drillSheet.thumbToRingFit && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Thumb-Ring:</span>
                        <span className="font-medium">{drillSheet.thumbToRingFit}"</span>
                    </div>
                )}
                {drillSheet.middleToRingFit && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Middle-Ring:</span>
                        <span className="font-medium">{drillSheet.middleToRingFit}"</span>
                    </div>
                )}
            </div>

            {drillSheet.specialNotes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    {drillSheet.specialNotes}
                </div>
            )}

            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => onEdit(drillSheet)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit drill sheet"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onView(drillSheet)}
                    className="text-green-600 hover:text-green-800"
                    title="View details"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPrint(drillSheet)}
                    className="text-purple-600 hover:text-purple-800"
                    title="Print drill sheet"
                >
                    <FileText className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};