// MODIFY EXISTING src/components/workorders/WorkOrderDetailModal.tsx
// ADD this import at the top

import React from 'react';
import { WorkOrder, DrillSheet, BowlingBall, Customer } from '../../types';
import { HoleSpecificationDisplay, DrillSheetInsertSummary } from '../drillsheets/InsertDisplay'; // ADD THIS IMPORT
import { Button } from '../ui/Button';
import { X, FileText, Settings, User } from 'lucide-react';

interface WorkOrderDetailModalProps {
    workOrder: WorkOrder;
    drillSheet?: DrillSheet;
    ball?: BowlingBall;
    customer?: Customer;
    onClose: () => void;
    onEdit?: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
                                                                              workOrder,
                                                                              drillSheet,
                                                                              ball,
                                                                              customer,
                                                                              onClose,
                                                                              onEdit
                                                                          }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Work Order Details</h2>
                    <div className="flex space-x-2">
                        {onEdit && (
                            <Button onClick={onEdit}>
                                Edit
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Work Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Order Information</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Work Type:</span> {workOrder.workType.replace('_', ' ')}</p>
                                <p><span className="font-medium">Date:</span> {new Date(workOrder.workDate).toLocaleDateString()}</p>
                                {workOrder.startTime && (
                                    <p><span className="font-medium">Start Time:</span> {workOrder.startTime}</p>
                                )}
                                {workOrder.endTime && (
                                    <p><span className="font-medium">End Time:</span> {workOrder.endTime}</p>
                                )}
                                {workOrder.laborHours && (
                                    <p><span className="font-medium">Labor Hours:</span> {workOrder.laborHours}</p>
                                )}
                                {workOrder.totalCost && (
                                    <p><span className="font-medium">Total Cost:</span> ${workOrder.totalCost.toFixed(2)}</p>
                                )}
                            </div>
                        </div>

                        {/* Customer & Ball Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Customer & Ball
                            </h3>
                            {customer && (
                                <div className="space-y-2 text-sm mb-4">
                                    <p><span className="font-medium">Customer:</span> {customer.firstName} {customer.lastName}</p>
                                    <p><span className="font-medium">Dominant Hand:</span> {customer.dominantHand}</p>
                                    <p><span className="font-medium">Grip Style:</span> {customer.preferredGripStyle.replace('_', ' ')}</p>
                                </div>
                            )}
                            {ball && (
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Ball:</span> {ball.manufacturer} {ball.model}</p>
                                    <p><span className="font-medium">Weight:</span> {ball.weight} lbs</p>
                                    {ball.serialNumber && (
                                        <p><span className="font-medium">Serial:</span> {ball.serialNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Drill Sheet Information - UPDATED with Insert Support */}
                    {drillSheet && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Drill Sheet Specifications
                            </h3>

                            {/* Basic drill sheet info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p><span className="font-medium">Sheet Name:</span> {drillSheet.name}</p>
                                    <p><span className="font-medium">Grip Style:</span> {drillSheet.gripStyle.replace('_', ' ')}</p>
                                    {drillSheet.spans.thumbToMiddle.fitSpan && (
                                        <p><span className="font-medium">Thumb to Middle:</span> {drillSheet.spans.thumbToMiddle.fitSpan}"</p>
                                    )}
                                    {drillSheet.spans.thumbToRing.fitSpan && (
                                        <p><span className="font-medium">Thumb to Ring:</span> {drillSheet.spans.thumbToRing.fitSpan}"</p>
                                    )}
                                    <p><span className="font-medium">Bridge:</span> {drillSheet.bridge.distance}"</p>
                                </div>
                            </div>

                            {/* UPDATED: Hole specifications with insert support */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Hole Specifications</h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {/* Thumb Hole */}
                                    {drillSheet.holes.thumb?.enabled && (
                                        <HoleSpecificationDisplay
                                            holeSize={drillSheet.holes.thumb.size}
                                            fingerName="Thumb"
                                            pitchForward={drillSheet.holes.thumb.pitch?.forward}
                                            pitchLateral={drillSheet.holes.thumb.pitch?.lateral}
                                            compact={true}
                                        />
                                    )}

                                    {/* Middle Finger */}
                                    {drillSheet.holes.middle && (
                                        <HoleSpecificationDisplay
                                            holeSize={drillSheet.holes.middle.size}
                                            fingerName="Middle"
                                            pitchForward={drillSheet.holes.middle.pitch?.forward}
                                            pitchLateral={drillSheet.holes.middle.pitch?.lateral}
                                            compact={true}
                                        />
                                    )}

                                    {/* Ring Finger */}
                                    {drillSheet.holes.ring && (
                                        <HoleSpecificationDisplay
                                            holeSize={drillSheet.holes.ring.size}
                                            fingerName="Ring"
                                            pitchForward={drillSheet.holes.ring.pitch?.forward}
                                            pitchLateral={drillSheet.holes.ring.pitch?.lateral}
                                            compact={true}
                                        />
                                    )}

                                    {/* Index Finger (if present) */}
                                    {drillSheet.holes.index && (
                                        <HoleSpecificationDisplay
                                            holeSize={drillSheet.holes.index.size}
                                            fingerName="Index"
                                            pitchForward={drillSheet.holes.index.pitch?.forward}
                                            pitchLateral={drillSheet.holes.index.pitch?.lateral}
                                            compact={true}
                                        />
                                    )}

                                    {/* Pinky (if present) */}
                                    {drillSheet.holes.pinky && (
                                        <HoleSpecificationDisplay
                                            holeSize={drillSheet.holes.pinky.size}
                                            fingerName="Pinky"
                                            pitchForward={drillSheet.holes.pinky.pitch?.forward}
                                            pitchLateral={drillSheet.holes.pinky.pitch?.lateral}
                                            compact={true}
                                        />
                                    )}
                                </div>

                                {/* NEW: Insert Summary */}
                                <DrillSheetInsertSummary holes={drillSheet.holes} />
                            </div>

                            {/* Special Notes */}
                            {drillSheet.specialNotes && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded border">
                                    <p className="text-sm"><span className="font-medium">Special Notes:</span> {drillSheet.specialNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Work Notes */}
                    {workOrder.workNotes && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <Settings className="w-5 h-5 mr-2" />
                                Work Notes
                            </h3>
                            <p className="text-sm text-gray-700">{workOrder.workNotes}</p>
                        </div>
                    )}

                    {/* Deviations from Spec */}
                    {workOrder.deviationsFromSpec && (
                        <div className="bg-orange-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Deviations from Specification
                            </h3>
                            <p className="text-sm text-gray-700">{workOrder.deviationsFromSpec}</p>
                        </div>
                    )}

                    {/* Quality Information */}
                    {(workOrder.qualityCheck !== undefined || workOrder.qualityNotes) && (
                        <div className="bg-green-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Quality Control
                            </h3>
                            <div className="space-y-2 text-sm">
                                {workOrder.qualityCheck !== undefined && (
                                    <p>
                                        <span className="font-medium">Quality Check:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                            workOrder.qualityCheck
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {workOrder.qualityCheck ? 'Passed' : 'Failed'}
                                        </span>
                                    </p>
                                )}
                                {workOrder.qualityNotes && (
                                    <p><span className="font-medium">Quality Notes:</span> {workOrder.qualityNotes}</p>
                                )}
                                {workOrder.customerSatisfaction && (
                                    <p><span className="font-medium">Customer Satisfaction:</span> {workOrder.customerSatisfaction}/5</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <Button onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};