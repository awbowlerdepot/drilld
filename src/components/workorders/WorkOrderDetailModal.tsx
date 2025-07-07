import React from 'react';
import { WorkOrder, BowlingBall, DrillSheet, Customer, Employee, Location } from '../../types';
import { Button } from '../ui/Button';
import {
    X,
    Edit,
    Calendar,
    Clock,
    User,
    MapPin,
    DollarSign,
    Star,
    CheckCircle,
    AlertTriangle,
    Target,
    FileText,
    Camera,
    Wrench
} from 'lucide-react';

interface WorkOrderDetailModalProps {
    workOrder: WorkOrder;
    ball?: BowlingBall;
    drillSheet?: DrillSheet;
    customer?: Customer;
    employee?: Employee;
    location?: Location;
    onClose: () => void;
    onEdit: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
                                                                              workOrder,
                                                                              ball,
                                                                              drillSheet,
                                                                              customer,
                                                                              employee,
                                                                              location,
                                                                              onClose,
                                                                              onEdit
                                                                          }) => {
    const getWorkTypeColor = (type: string) => {
        switch (type) {
            case 'INITIAL_DRILL':
                return 'bg-blue-100 text-blue-800';
            case 'PLUG_REDRILL':
                return 'bg-orange-100 text-orange-800';
            case 'MAINTENANCE':
                return 'bg-green-100 text-green-800';
            case 'SURFACE_ADJUSTMENT':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getWorkTypeLabel = (type: string) => {
        switch (type) {
            case 'INITIAL_DRILL':
                return 'Initial Drill';
            case 'PLUG_REDRILL':
                return 'Plug & Redrill';
            case 'MAINTENANCE':
                return 'Maintenance';
            case 'SURFACE_ADJUSTMENT':
                return 'Surface Adjustment';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return 'Not specified';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDuration = () => {
        if (!workOrder.startTime || !workOrder.endTime) return null;

        const start = new Date(`2000-01-01T${workOrder.startTime}`);
        const end = new Date(`2000-01-01T${workOrder.endTime}`);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return diffHours.toFixed(1);
    };

    const getSatisfactionColor = (satisfaction?: number) => {
        if (!satisfaction) return 'text-gray-400';
        if (satisfaction >= 8) return 'text-green-600';
        if (satisfaction >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSatisfactionStars = (satisfaction?: number) => {
        if (!satisfaction) return [];
        const stars = [];
        for (let i = 1; i <= 10; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`w-4 h-4 ${i <= satisfaction ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
            );
        }
        return stars;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Wrench className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Work Order Details</h2>
                            <p className="text-sm text-gray-600">
                                Created {new Date(workOrder.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" icon={Edit} onClick={onEdit}>
                            Edit
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Work Type and Status */}
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(workOrder.workType)}`}>
                            {getWorkTypeLabel(workOrder.workType)}
                        </span>
                        {workOrder.qualityCheck && (
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Quality Approved</span>
                            </div>
                        )}
                        {workOrder.deviationsFromSpec && (
                            <div className="flex items-center text-yellow-600">
                                <AlertTriangle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Has Deviations</span>
                            </div>
                        )}
                    </div>

                    {/* Ball and Customer Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bowling Ball Info */}
                        {ball && (
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <Target className="w-5 h-5 mr-2" />
                                    Bowling Ball
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{ball.manufacturer} {ball.model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Weight:</span>
                                        <span className="font-medium">{ball.weight} lbs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="font-medium">{ball.status}</span>
                                    </div>
                                    {ball.serialNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Serial:</span>
                                            <span className="font-medium">{ball.serialNumber}</span>
                                        </div>
                                    )}
                                    {ball.coverstockType && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Coverstock:</span>
                                            <span className="font-medium">{ball.coverstockType}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Customer Info */}
                        {customer && (
                            <div className="bg-green-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Customer
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                                    </div>
                                    {customer.email && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium">{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-medium">{customer.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Hand:</span>
                                        <span className="font-medium">{customer.dominantHand}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Grip Style:</span>
                                        <span className="font-medium">{customer.preferredGripStyle.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drill Sheet Information */}
                    {drillSheet && (
                        <div className="bg-purple-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Drill Sheet: {drillSheet.name}
                            </h3>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <span className="text-gray-600">Grip Style:</span>
                                    <p className="font-medium">{drillSheet.gripStyle}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Thumb:</span>
                                    <p className="font-medium">{drillSheet.holes.thumb?.enabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Template:</span>
                                    <p className="font-medium">{drillSheet.isTemplate ? 'Yes' : 'No'}</p>
                                </div>
                            </div>

                            {/* Span Measurements */}
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Span Measurements</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Thumb to Middle:</span>
                                        <p className="font-medium">
                                            {drillSheet.spans.thumbToMiddle.fitSpan ? `${drillSheet.spans.thumbToMiddle.fitSpan}"` : 'Custom'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Thumb to Ring:</span>
                                        <p className="font-medium">
                                            {drillSheet.spans.thumbToRing.fitSpan ? `${drillSheet.spans.thumbToRing.fitSpan}"` : 'Custom'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Bridge:</span>
                                        <p className="font-medium">{drillSheet.bridge.distance}"</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hole Specifications */}
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">Hole Specifications</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                    {drillSheet.holes.thumb?.enabled && (
                                        <div className="bg-white p-2 rounded border">
                                            <span className="font-medium">Thumb</span>
                                            <p>Size: {drillSheet.holes.thumb.size.primary}</p>
                                            <p>Type: {drillSheet.holes.thumb.holeType}</p>
                                            {drillSheet.holes.thumb.pitchForward && (
                                                <p>Forward: {drillSheet.holes.thumb.pitchForward}"</p>
                                            )}
                                            {drillSheet.holes.thumb.pitchLateral && (
                                                <p>Lateral: {drillSheet.holes.thumb.pitchLateral}"</p>
                                            )}
                                        </div>
                                    )}
                                    {drillSheet.holes.middle && (
                                        <div className="bg-white p-2 rounded border">
                                            <span className="font-medium">Middle</span>
                                            <p>Size: {drillSheet.holes.middle.size.primary}</p>
                                            {drillSheet.holes.middle.pitchForward && (
                                                <p>Forward: {drillSheet.holes.middle.pitchForward}"</p>
                                            )}
                                            {drillSheet.holes.middle.pitchLateral && (
                                                <p>Lateral: {drillSheet.holes.middle.pitchLateral}"</p>
                                            )}
                                        </div>
                                    )}
                                    {drillSheet.holes.ring && (
                                        <div className="bg-white p-2 rounded border">
                                            <span className="font-medium">Ring</span>
                                            <p>Size: {drillSheet.holes.ring.size.primary}</p>
                                            {drillSheet.holes.ring.pitchForward && (
                                                <p>Forward: {drillSheet.holes.ring.pitchForward}"</p>
                                            )}
                                            {drillSheet.holes.ring.pitchLateral && (
                                                <p>Lateral: {drillSheet.holes.ring.pitchLateral}"</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Special Notes */}
                            {drillSheet.specialNotes && (
                                <div>
                                    <span className="text-gray-600">Special Notes:</span>
                                    <p className="font-medium text-sm mt-1">{drillSheet.specialNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Work Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Schedule and Location */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule & Location</h3>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="font-medium">{formatDate(workOrder.workDate)}</p>
                                        <div className="text-sm text-gray-600">
                                            {formatTime(workOrder.startTime)} - {formatTime(workOrder.endTime)}
                                            {getDuration() && (
                                                <span className="ml-2">({getDuration()}h)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {location && (
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="font-medium">{location.name}</p>
                                            {location.address && (
                                                <p className="text-sm text-gray-600">{location.address}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {employee && (
                                    <div className="flex items-center">
                                        <User className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                                            <p className="text-sm text-gray-600">{employee.role}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
                            <div className="space-y-3">
                                {workOrder.laborHours && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Labor Hours:</span>
                                        <span className="font-medium">{workOrder.laborHours}h</span>
                                    </div>
                                )}
                                {workOrder.laborCost && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Labor Cost:</span>
                                        <span className="font-medium">${workOrder.laborCost.toFixed(2)}</span>
                                    </div>
                                )}
                                {workOrder.materialsCost && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Materials:</span>
                                        <span className="font-medium">${workOrder.materialsCost.toFixed(2)}</span>
                                    </div>
                                )}
                                {workOrder.totalCost && (
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-900 font-semibold">Total Cost:</span>
                                        <span className="text-lg font-bold text-gray-900">${workOrder.totalCost.toFixed(2)}</span>
                                    </div>
                                )}
                                {workOrder.warrantyPeriod && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Warranty:</span>
                                        <span className="font-medium">{workOrder.warrantyPeriod} days</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Notes */}
                    {workOrder.workNotes && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Notes</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{workOrder.workNotes}</p>
                            </div>
                        </div>
                    )}

                    {/* Special Notes */}
                    {workOrder.specialNotes && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Notes</h3>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-blue-800 whitespace-pre-wrap">{workOrder.specialNotes}</p>
                            </div>
                        </div>
                    )}

                    {/* Deviations from Specification */}
                    {workOrder.deviationsFromSpec && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                Deviations from Specification
                            </h3>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 whitespace-pre-wrap">{workOrder.deviationsFromSpec}</p>
                            </div>
                        </div>
                    )}

                    {/* Quality Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quality Check */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Control</h3>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <CheckCircle className={`w-5 h-5 mr-2 ${workOrder.qualityCheck ? 'text-green-600' : 'text-gray-400'}`} />
                                    <span className={workOrder.qualityCheck ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                        Quality Check {workOrder.qualityCheck ? 'Passed' : 'Pending'}
                                    </span>
                                </div>
                                {workOrder.qualityNotes && (
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-sm text-gray-700">{workOrder.qualityNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Satisfaction */}
                        {workOrder.customerSatisfaction && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Feedback</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="text-gray-600 mr-2">Rating:</span>
                                        <span className={`text-lg font-bold ${getSatisfactionColor(workOrder.customerSatisfaction)}`}>
                                            {workOrder.customerSatisfaction}/10
                                        </span>
                                    </div>
                                    <div className="flex space-x-1">
                                        {getSatisfactionStars(workOrder.customerSatisfaction)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photos */}
                    {(workOrder.beforePhotos?.length || workOrder.afterPhotos?.length) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <Camera className="w-5 h-5 mr-2" />
                                Photos
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Before Photos */}
                                {workOrder.beforePhotos?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Before Work</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workOrder.beforePhotos.map((photo, index) => (
                                                <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-gray-400" />
                                                    <span className="sr-only">Before photo {index + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* After Photos */}
                                {workOrder.afterPhotos?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">After Work</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workOrder.afterPhotos.map((photo, index) => (
                                                <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-gray-400" />
                                                    <span className="sr-only">After photo {index + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                    <Button icon={Edit} onClick={onEdit}>
                        Edit Work Order
                    </Button>
                </div>
            </div>
        </div>
    );
};