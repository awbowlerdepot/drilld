import React from 'react';
import { Edit, Eye, FileText, Trash2, Users } from 'lucide-react';
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
    const hasThumb = drillSheet.holes.thumb?.enabled;
    const thumbHole = drillSheet.holes.thumb;
    const middleHole = drillSheet.holes.middle;
    const ringHole = drillSheet.holes.ring;

    return (
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 card-hover">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{drillSheet.name}</h3>
                    {showCustomerName && customer && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            {customer.firstName} {customer.lastName}
                        </div>
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

            {/* Grip Style */}
            <div className="mb-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Grip Style:</span>
                    <span className="font-medium">{drillSheet.gripStyle.replace(/_/g, ' ')}</span>
                </div>
            </div>

            {/* Span Measurements */}
            <div className="space-y-2 text-sm mb-4">
                <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wider">Span Measurements</h4>

                {hasThumb && drillSheet.spans.thumbToMiddle.fitSpan && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Thumb-Middle (Fit):</span>
                        <span className="font-medium">{drillSheet.spans.thumbToMiddle.fitSpan}"</span>
                    </div>
                )}

                {hasThumb && drillSheet.spans.thumbToRing.fitSpan && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Thumb-Ring (Fit):</span>
                        <span className="font-medium">{drillSheet.spans.thumbToRing.fitSpan}"</span>
                    </div>
                )}

                {drillSheet.spans.middleToRing.fitSpan && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Middle-Ring (Fit):</span>
                        <span className="font-medium">{drillSheet.spans.middleToRing.fitSpan}"</span>
                    </div>
                )}
            </div>

            {/* Hole Sizes */}
            <div className="space-y-2 text-sm mb-4">
                <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wider">Hole Sizes</h4>

                {hasThumb && thumbHole && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Thumb ({thumbHole.holeType}):</span>
                        <span className="font-medium">{thumbHole.size.primary}</span>
                    </div>
                )}

                {middleHole && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Middle:</span>
                        <span className="font-medium">{middleHole.size.primary}</span>
                    </div>
                )}

                {ringHole && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Ring:</span>
                        <span className="font-medium">{ringHole.size.primary}</span>
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