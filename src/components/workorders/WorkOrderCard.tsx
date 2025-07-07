import React from 'react';
import { WorkOrder, BowlingBall, Customer, Employee, Location } from '../../types';
import {
    Eye,
    Edit,
    Trash2,
    Calendar,
    User,
    MapPin,
    DollarSign,
    Clock,
    Star,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface WorkOrderCardProps {
    workOrder: WorkOrder;
    ball?: BowlingBall;
    customer?: Customer;
    employee?: Employee;
    location?: Location;
    onView: (workOrder: WorkOrder) => void;
    onEdit: (workOrder: WorkOrder) => void;
    onDelete: (workOrder: WorkOrder) => void;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
                                                                workOrder,
                                                                ball,
                                                                customer,
                                                                employee,
                                                                location,
                                                                onView,
                                                                onEdit,
                                                                onDelete
                                                            }) => {
    const getWorkTypeColor = (type: string) => {
        switch (type) {
            case 'INITIAL_DRILL':
                return 'bg-blue-100 text-blue-800';
            case 'PLUG_REDRILL':
                return 'bg-orange-100 text-orange-800';
            case 'MAINTENANCE':
                return 'bg-green-100 text-green-800';
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
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
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

        if (diffHours < 1) {
            const diffMinutes = Math.round(diffMs / (1000 * 60));
            return `${diffMinutes}m`;
        } else {
            return `${diffHours.toFixed(1)}h`;
        }
    };

    const getSatisfactionColor = (satisfaction?: number) => {
        if (!satisfaction) return 'text-gray-400';
        if (satisfaction >= 8) return 'text-green-600';
        if (satisfaction >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const isCompleted = workOrder.endTime && workOrder.qualityCheck;
    const hasIssues = workOrder.deviationsFromSpec || (workOrder.customerSatisfaction && workOrder.customerSatisfaction < 6);

    return (
        <div className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                        {/* Work Type Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkTypeColor(workOrder.workType)}`}>
                            {getWorkTypeLabel(workOrder.workType)}
                        </span>

                        {/* Status Indicators */}
                        {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {hasIssues && (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                    </div>

                    {/* Ball and Customer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {ball ? `${ball.manufacturer} ${ball.model}` : 'Unknown Ball'}
                            {ball && <span className="text-sm font-normal text-gray-500 ml-2">({ball.weight}lbs)</span>}
                        </h3>
                        {customer && (
                            <div className="flex items-center text-sm text-gray-600">
                                <User className="w-4 h-4 mr-1" />
                                {customer.firstName} {customer.lastName}
                            </div>
                        )}
                    </div>

                    {/* Work Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {/* Date and Time */}
                        <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <div>
                                <div>{formatDate(workOrder.workDate)}</div>
                                {workOrder.startTime && (
                                    <div className="text-xs">
                                        {formatTime(workOrder.startTime)}
                                        {workOrder.endTime && ` - ${formatTime(workOrder.endTime)}`}
                                        {getDuration() && (
                                            <span className="ml-1 text-gray-500">({getDuration()})</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {location && (
                            <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{location.name}</span>
                            </div>
                        )}

                        {/* Technician */}
                        {employee && (
                            <div className="flex items-center text-gray-600">
                                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{employee.firstName} {employee.lastName}</span>
                            </div>
                        )}

                        {/* Cost */}
                        {workOrder.totalCost && (
                            <div className="flex items-center text-gray-600">
                                <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>${workOrder.totalCost.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Additional Info Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {/* Labor Hours */}
                        {workOrder.laborHours && (
                            <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{workOrder.laborHours}h labor</span>
                            </div>
                        )}

                        {/* Customer Satisfaction */}
                        {workOrder.customerSatisfaction && (
                            <div className="flex items-center">
                                <Star className={`w-4 h-4 mr-1 ${getSatisfactionColor(workOrder.customerSatisfaction)}`} />
                                <span className={getSatisfactionColor(workOrder.customerSatisfaction)}>
                                    {workOrder.customerSatisfaction}/10
                                </span>
                            </div>
                        )}

                        {/* Quality Check */}
                        {workOrder.qualityCheck !== undefined && (
                            <div className="flex items-center">
                                <CheckCircle className={`w-4 h-4 mr-1 ${workOrder.qualityCheck ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className={workOrder.qualityCheck ? 'text-green-600' : 'text-gray-600'}>
                                    Quality {workOrder.qualityCheck ? 'Passed' : 'Pending'}
                                </span>
                            </div>
                        )}

                        {/* Warranty */}
                        {workOrder.warrantyPeriod && (
                            <div className="text-gray-600">
                                <span>{workOrder.warrantyPeriod} day warranty</span>
                            </div>
                        )}
                    </div>

                    {/* Work Notes Preview */}
                    {workOrder.workNotes && (
                        <div className="mt-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                                <span className="font-medium">Notes:</span> {workOrder.workNotes}
                            </p>
                        </div>
                    )}

                    {/* Deviations Warning */}
                    {workOrder.deviationsFromSpec && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                                <span className="font-medium">Deviations:</span> {workOrder.deviationsFromSpec}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 lg:mt-0 lg:ml-6 flex items-center space-x-2">
                    <button
                        onClick={() => onView(workOrder)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                        title="View details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(workOrder)}
                        className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-full hover:bg-green-50"
                        title="Edit work order"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(workOrder)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Delete work order"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};