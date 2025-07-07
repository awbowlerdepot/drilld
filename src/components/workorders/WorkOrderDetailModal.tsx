import React from 'react';
import { WorkOrder, BowlingBall, DrillSheet, Customer, Employee, Location } from '../../types';
import { Button } from '../ui/Button';
import {
    X,
    Edit,
    Calendar,
    User,
    MapPin,
    Star,
    CheckCircle,
    AlertTriangle,
    Target,
    FileText,
    Camera
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
        try {
            return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return timeString;
        }
    };

    const getDuration = () => {
        if (!workOrder.startTime || !workOrder.endTime) return null;

        try {
            const start = new Date(`2000-01-01T${workOrder.startTime}`);
            const end = new Date(`2000-01-01T${workOrder.endTime}`);
            const diffMs = end.getTime() - start.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            return diffHours > 0 ? diffHours.toFixed(1) : null;
        } catch (error) {
            return null;
        }
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

    const formatCurrency = (amount?: number) => {
        return amount ? `$${amount.toFixed(2)}` : 'N/A';
    };

    const formatRoleDisplay = (role?: string) => {
        if (!role) return '';
        return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(workOrder.workType)}`}>
                            {getWorkTypeLabel(workOrder.workType)}
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900">Work Order Details</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" icon={Edit} onClick={onEdit}>
                            Edit
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Ball and Customer Information */}
                    {(ball || customer) && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <Target className="w-5 h-5 mr-2" />
                                Ball & Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ball && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Bowling Ball</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-medium">Ball:</span> {ball.manufacturer} {ball.model}</p>
                                            <p><span className="font-medium">Weight:</span> {ball.weight} lbs</p>
                                            {ball.serialNumber && (
                                                <p><span className="font-medium">Serial:</span> {ball.serialNumber}</p>
                                            )}
                                            {ball.coverstockType && (
                                                <p><span className="font-medium">Coverstock:</span> {ball.coverstockType}</p>
                                            )}
                                            <p><span className="font-medium">Status:</span> {ball.status}</p>
                                        </div>
                                    </div>
                                )}

                                {customer && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}</p>
                                            {customer.email && (
                                                <p><span className="font-medium">Email:</span> {customer.email}</p>
                                            )}
                                            {customer.phone && (
                                                <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                                            )}
                                            <p><span className="font-medium">Hand:</span> {customer.dominantHand}</p>
                                            <p><span className="font-medium">Grip:</span> {customer.preferredGripStyle.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Drill Sheet Information */}
                    {drillSheet && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Drill Sheet Specifications
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><span className="font-medium">Sheet Name:</span> {drillSheet.name}</p>
                                    <p><span className="font-medium">Grip Style:</span> {drillSheet.gripStyle.replace('_', ' ')}</p>
                                    {drillSheet.spans.thumbToMiddle.fitSpan && (
                                        <p><span className="font-medium">Thumb to Middle:</span> {drillSheet.spans.thumbToMiddle.fitSpan}"</p>
                                    )}
                                    {drillSheet.spans.thumbToRing.fitSpan && (
                                        <p><span className="font-medium">Thumb to Ring:</span> {drillSheet.spans.thumbToRing.fitSpan}"</p>
                                    )}
                                </div>

                                <div>
                                    {/* Hole Information */}
                                    <div className="space-y-2">
                                        {drillSheet.holes.thumb?.enabled && (
                                            <div className="bg-white p-2 rounded border">
                                                <span className="font-medium">Thumb:</span> {drillSheet.holes.thumb.size.primary}
                                                {drillSheet.holes.thumb.pitchForward && (
                                                    <span className="ml-2 text-gray-600">Forward: {drillSheet.holes.thumb.pitchForward}"</span>
                                                )}
                                            </div>
                                        )}
                                        {drillSheet.holes.middle && (
                                            <div className="bg-white p-2 rounded border">
                                                <span className="font-medium">Middle:</span> {drillSheet.holes.middle.size.primary}
                                                {drillSheet.holes.middle.pitchForward && (
                                                    <span className="ml-2 text-gray-600">Forward: {drillSheet.holes.middle.pitchForward}"</span>
                                                )}
                                            </div>
                                        )}
                                        {drillSheet.holes.ring && (
                                            <div className="bg-white p-2 rounded border">
                                                <span className="font-medium">Ring:</span> {drillSheet.holes.ring.size.primary}
                                                {drillSheet.holes.ring.pitchForward && (
                                                    <span className="ml-2 text-gray-600">Forward: {drillSheet.holes.ring.pitchForward}"</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Special Notes */}
                            {drillSheet.specialNotes && (
                                <div className="mt-3">
                                    <span className="font-medium text-gray-700">Special Notes:</span>
                                    <p className="text-gray-600 mt-1">{drillSheet.specialNotes}</p>
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
                                            <p className="text-sm text-gray-600">{formatRoleDisplay(employee.role)}</p>
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
                                        <span className="font-medium">{formatCurrency(workOrder.laborCost)}</span>
                                    </div>
                                )}
                                {workOrder.materialsCost && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Materials:</span>
                                        <span className="font-medium">{formatCurrency(workOrder.materialsCost)}</span>
                                    </div>
                                )}
                                {workOrder.totalCost && (
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="font-semibold text-gray-900">Total Cost:</span>
                                        <span className="font-bold text-lg">{formatCurrency(workOrder.totalCost)}</span>
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
                                        Quality Check {workOrder.qualityCheck ? 'Completed' : 'Pending'}
                                    </span>
                                </div>

                                {workOrder.qualityNotes && (
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-green-800 text-sm">{workOrder.qualityNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Satisfaction */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Satisfaction</h3>
                            {workOrder.customerSatisfaction ? (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex">
                                            {getSatisfactionStars(workOrder.customerSatisfaction)}
                                        </div>
                                        <span className={`font-bold ${getSatisfactionColor(workOrder.customerSatisfaction)}`}>
                                            {workOrder.customerSatisfaction}/10
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {workOrder.customerSatisfaction >= 8 ? 'Excellent' :
                                            workOrder.customerSatisfaction >= 6 ? 'Good' : 'Needs Improvement'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-500">Not rated yet</p>
                            )}
                        </div>
                    </div>

                    {/* Photos Section */}
                    {(workOrder.beforePhotos?.length || workOrder.afterPhotos?.length) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <Camera className="w-5 h-5 mr-2" />
                                Photos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {workOrder.beforePhotos?.length && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Before</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workOrder.beforePhotos.map((photo, index) => (
                                                <img
                                                    key={index}
                                                    src={photo}
                                                    alt={`Before photo ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg border"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {workOrder.afterPhotos?.length && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">After</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workOrder.afterPhotos.map((photo, index) => (
                                                <img
                                                    key={index}
                                                    src={photo}
                                                    alt={`After photo ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg border"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Order Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <p><span className="font-medium">Work Order ID:</span> {workOrder.id}</p>
                                <p><span className="font-medium">Created:</span> {formatDate(workOrder.createdAt)}</p>
                            </div>
                            <div>
                                {ball && <p><span className="font-medium">Ball ID:</span> {workOrder.ballID}</p>}
                                {drillSheet && <p><span className="font-medium">Drill Sheet ID:</span> {workOrder.drillSheetID}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};