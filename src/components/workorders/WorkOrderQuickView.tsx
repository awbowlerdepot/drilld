import React from 'react';
import { Wrench, Clock, DollarSign, Star, Calendar } from 'lucide-react';
import { WorkOrder, BowlingBall, Customer } from '../../types';

interface WorkOrderQuickViewProps {
    workOrders: WorkOrder[];
    balls: BowlingBall[];
    customers: Customer[];
    onViewAll: () => void;
}

export const WorkOrderQuickView: React.FC<WorkOrderQuickViewProps> = ({
                                                                          workOrders,
                                                                          balls,
                                                                          customers,
                                                                          onViewAll
                                                                      }) => {
    const recentWorkOrders = workOrders
        .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime())
        .slice(0, 5);

    const getBallById = (id: string) => balls.find(b => b.id === id);
    const getCustomerById = (id: string) => customers.find(c => c.id === id);

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

    const getSatisfactionColor = (satisfaction?: number) => {
        if (!satisfaction) return 'text-gray-400';
        if (satisfaction >= 8) return 'text-green-600';
        if (satisfaction >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Work Orders</h3>
                <button
                    onClick={onViewAll}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    View All →
                </button>
            </div>

            {recentWorkOrders.length === 0 ? (
                <div className="text-center py-8">
                    <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Work orders will appear here as they are created.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recentWorkOrders.map(workOrder => {
                        const ball = getBallById(workOrder.ballID);
                        const customer = ball ? getCustomerById(ball.customerID) : null;

                        return (
                            <div
                                key={workOrder.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getWorkTypeColor(workOrder.workType)}`}>
                                            {getWorkTypeLabel(workOrder.workType)}
                                        </span>
                                        {workOrder.qualityCheck && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Quality
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {formatDate(workOrder.workDate)}
                                    </div>
                                </div>

                                {/* Ball and Customer Info */}
                                <div className="mb-3">
                                    <h4 className="font-medium text-gray-900">
                                        {ball ? `${ball.manufacturer} ${ball.model}` : 'Unknown Ball'}
                                        {ball && <span className="text-sm text-gray-500 ml-1">({ball.weight}lbs)</span>}
                                    </h4>
                                    {customer && (
                                        <p className="text-sm text-gray-600">
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                    )}
                                </div>

                                {/* Work Details */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    {/* Duration */}
                                    {workOrder.laborHours && (
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span>{workOrder.laborHours}h</span>
                                        </div>
                                    )}

                                    {/* Cost */}
                                    {workOrder.totalCost && (
                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            <span>${workOrder.totalCost.toFixed(2)}</span>
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
                                </div>

                                {/* Work Notes Preview */}
                                {workOrder.workNotes && (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600 line-clamp-1">
                                            {workOrder.workNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Deviations Warning */}
                                {workOrder.deviationsFromSpec && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                        <p className="text-yellow-800">
                                            <span className="font-medium">Deviations:</span> {workOrder.deviationsFromSpec}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};