import React from 'react';
import { Edit, Eye, Calendar, MapPin, User, Wrench, Trash2, DollarSign, Clock } from 'lucide-react';
import { WorkOrder, BowlingBall, Customer, Employee, Location } from '../../types';

interface WorkOrderCardProps {
    workOrder: WorkOrder;
    ball?: BowlingBall;
    customer?: Customer;
    employee?: Employee;
    location?: Location;
    onEdit: (workOrder: WorkOrder) => void;
    onView: (workOrder: WorkOrder) => void;
    onDelete: (workOrder: WorkOrder) => void;
    showCustomerName?: boolean;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
                                                                workOrder,
                                                                ball,
                                                                customer,
                                                                employee,
                                                                location,
                                                                onEdit,
                                                                onView,
                                                                onDelete,
                                                                showCustomerName = true
                                                            }) => {
    const getWorkTypeColor = (workType: WorkOrder['workType']) => {
        switch (workType) {
            case 'INITIAL_DRILL':
                return 'bg-blue-100 text-blue-700';
            case 'PLUG_REDRILL':
                return 'bg-orange-100 text-orange-700';
            case 'MAINTENANCE':
                return 'bg-green-100 text-green-700';
            case 'SURFACE_ADJUSTMENT':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatWorkType = (workType: WorkOrder['workType']) => {
        return workType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCurrency = (amount?: number) => {
        return amount ? `$${amount.toFixed(2)}` : 'N/A';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString();
    };

    const formatTime = (time?: string) => {
        return time ? time : 'N/A';
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 card-hover">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                            {formatWorkType(workOrder.workType)}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWorkTypeColor(workOrder.workType)}`}>
                            {formatWorkType(workOrder.workType)}
                        </span>
                    </div>

                    {/* Ball and Customer Info */}
                    {ball && (
                        <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{ball.manufacturer} {ball.model}</span>
                            {ball.weight && <span className="text-gray-400"> • {ball.weight}lbs</span>}
                        </div>
                    )}

                    {showCustomerName && customer && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                            <User className="w-3 h-3 mr-1" />
                            {customer.firstName} {customer.lastName}
                        </div>
                    )}

                    {/* Work Details */}
                    <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(workOrder.workDate)}
                            {workOrder.startTime && (
                                <span className="ml-2 text-gray-400">
                                    {formatTime(workOrder.startTime)}
                                    {workOrder.endTime && ` - ${formatTime(workOrder.endTime)}`}
                                </span>
                            )}
                        </div>

                        {location && (
                            <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {location.name}
                            </div>
                        )}

                        {employee && (
                            <div className="flex items-center">
                                <Wrench className="w-3 h-3 mr-1" />
                                {employee.firstName} {employee.lastName}
                            </div>
                        )}

                        {workOrder.laborHours && (
                            <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {workOrder.laborHours} hours
                            </div>
                        )}

                        {workOrder.totalCost && (
                            <div className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {formatCurrency(workOrder.totalCost)}
                            </div>
                        )}
                    </div>

                    {/* Customer Satisfaction */}
                    {workOrder.customerSatisfaction && (
                        <div className="mt-2">
                            <div className="flex items-center text-sm">
                                <span className="text-gray-500 mr-2">Satisfaction:</span>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`text-sm ${i < workOrder.customerSatisfaction! ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                    <span className="ml-1 text-gray-600">({workOrder.customerSatisfaction}/5)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quality Check Indicator */}
                    {workOrder.qualityCheck && (
                        <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                ✓ Quality Checked
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-400">
                    Created {formatDate(workOrder.createdAt)}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(workOrder)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit work order"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onView(workOrder)}
                        className="text-green-600 hover:text-green-800 transition-colors p-1"
                        title="View details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(workOrder)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                        title="Delete work order"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};