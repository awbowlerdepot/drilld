import React from 'react';
import { Calendar, TrendingUp, DollarSign, Clock, Award } from 'lucide-react';
import { WorkOrder, BowlingBall, Customer } from '../../types';

interface WorkOrderStatsProps {
    workOrders: WorkOrder[];
    balls: BowlingBall[];
    customers: Customer[];
}

export const WorkOrderStats: React.FC<WorkOrderStatsProps> = ({ workOrders, balls, customers }) => {
    const today = new Date();
    const thisMonth = workOrders.filter(wo => {
        const workDate = new Date(wo.workDate);
        return workDate.getMonth() === today.getMonth() &&
            workDate.getFullYear() === today.getFullYear();
    });

    const totalRevenue = thisMonth.reduce((sum, wo) => sum + (wo.totalCost || 0), 0);
    const totalHours = thisMonth.reduce((sum, wo) => sum + (wo.laborHours || 0), 0);

    const avgSatisfaction = thisMonth.length > 0
        ? thisMonth.reduce((sum, wo) => sum + (wo.customerSatisfaction || 0), 0) / thisMonth.length
        : 0;

    const workTypeBreakdown = Object.entries(
        workOrders.reduce((acc, wo) => {
            acc[wo.workType] = (acc[wo.workType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a);

    const stats = [
        {
            name: 'Total Work Orders',
            value: workOrders.length,
            icon: Calendar,
            color: 'text-blue-600'
        },
        {
            name: 'This Month',
            value: thisMonth.length,
            icon: TrendingUp,
            color: 'text-green-600'
        },
        {
            name: 'Monthly Revenue',
            value: `$${totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'text-green-600'
        },
        {
            name: 'Labor Hours',
            value: totalHours.toFixed(1),
            icon: Clock,
            color: 'text-purple-600'
        },
        {
            name: 'Avg Satisfaction',
            value: avgSatisfaction.toFixed(1),
            icon: Award,
            color: 'text-yellow-600'
        }
    ];

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Work Order Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="text-center">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-2`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.name}</div>
                    </div>
                ))}
            </div>

            {/* Work Type Breakdown */}
            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Work Type Distribution</h4>
                <div className="space-y-2">
                    {workTypeBreakdown.map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};