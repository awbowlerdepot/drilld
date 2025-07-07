import React from 'react';
import { Target, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { BowlingBall } from '../../types';

interface BallStatsProps {
    balls: BowlingBall[];
}

export const BallStats: React.FC<BallStatsProps> = ({ balls }) => {
    const totalBalls = balls.length;
    const activeBalls = balls.filter(b => b.status === 'ACTIVE').length;
    const damagedBalls = balls.filter(b => b.status === 'DAMAGED').length;

    const totalValue = balls
        .filter(b => b.purchasePrice)
        .reduce((sum, b) => sum + (b.purchasePrice || 0), 0);

    const averageValue = totalValue > 0 ? totalValue / balls.filter(b => b.purchasePrice).length : 0;

    const topManufacturers = Object.entries(
        balls.reduce((acc, ball) => {
            acc[ball.manufacturer] = (acc[ball.manufacturer] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const stats = [
        {
            name: 'Total Balls',
            value: totalBalls,
            icon: Target,
            color: 'text-blue-600'
        },
        {
            name: 'Active Balls',
            value: activeBalls,
            icon: Package,
            color: 'text-green-600'
        },
        {
            name: 'Damaged Balls',
            value: damagedBalls,
            icon: AlertTriangle,
            color: 'text-red-600'
        },
        {
            name: 'Avg. Value',
            value: `$${averageValue.toFixed(0)}`,
            icon: TrendingUp,
            color: 'text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.name} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <stat.icon className={`w-6 h-6 ${stat.color} mr-3`} />
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                </div>
            ))}

            {topManufacturers.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow md:col-span-2 lg:col-span-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Top Manufacturers</h4>
                    <div className="flex flex-wrap gap-2">
                        {topManufacturers.map(([manufacturer, count]) => (
                            <span
                                key={manufacturer}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                {manufacturer} ({count})
              </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};