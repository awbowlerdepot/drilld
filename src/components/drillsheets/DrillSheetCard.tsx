import React from 'react';
import { Edit, Eye, FileText, Trash2 } from 'lucide-react';
import { DrillSheet, Customer } from '../../types';

interface DrillSheetCardProps {
    drillSheet: DrillSheet;
    customer?: Customer;
    onEdit: (drillSheet: DrillSheet) => void;
    onView: (drillSheet: DrillSheet) => void;
    onPrint: (drillSheet: DrillSheet) => void;
    onDelete?: (drillSheet: DrillSheet) => void;
    showCustomerName?: boolean;
}

export const DrillSheetCard: React.FC<DrillSheetCardProps> = ({
                                                                  drillSheet,
                                                                  customer,
                                                                  onEdit,
                                                                  onView,
                                                                  onPrint,
                                                                  onDelete,
                                                                  showCustomerName = false
                                                              }) => {
    return (
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{drillSheet.name}</h3>
                    {showCustomerName && customer && (
                        <p className="text-sm text-gray-500">
                            {customer.firstName} {customer.lastName}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(drillSheet.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
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
                    <p className="line-clamp-2">{drillSheet.specialNotes}</p>
                </div>
            )}

            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => onEdit(drillSheet)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit drill sheet"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onView(drillSheet)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="View details"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPrint(drillSheet)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                    title="Print drill sheet"
                >
                    <FileText className="w-4 h-4" />
                </button>
                {onDelete && (
                    <button
                        onClick={() => onDelete(drillSheet)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete drill sheet"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};