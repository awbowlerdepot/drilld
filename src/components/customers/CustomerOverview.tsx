import React from 'react';
import { FileText, Target, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Customer, DrillSheet, BowlingBall } from '../../types';
import { Button } from '../ui/Button';

interface CustomerOverviewProps {
    customer: Customer;
    drillSheets: DrillSheet[];
    balls: BowlingBall[];
    onViewDrillSheets: () => void;
    onViewBalls: () => void;
    onCreateDrillSheet: () => void;
    onAddBall: () => void;
}

export const CustomerOverview: React.FC<CustomerOverviewProps> = ({
                                                                      customer,
                                                                      drillSheets,
                                                                      balls,
                                                                      onViewDrillSheets,
                                                                      onViewBalls,
                                                                      onCreateDrillSheet,
                                                                      onAddBall
                                                                  }) => {
    const activeBalls = balls.filter(b => b.status === 'ACTIVE').length;
    const totalValue = balls.reduce((sum, ball) => sum + (ball.purchasePrice || 0), 0);
    const recentDrillSheet = drillSheets
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const recentBalls = balls
        .sort((a, b) => {
            const aDate = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
            const bDate = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
            return bDate - aDate;
        })
        .slice(0, 3);

    const stats = [
        {
            name: 'Drill Sheets',
            value: drillSheets.length,
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            action: onViewDrillSheets
        },
        {
            name: 'Bowling Balls',
            value: balls.length,
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            action: onViewBalls
        },
        {
            name: 'Active Balls',
            value: activeBalls,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            name: 'Total Value',
            value: totalValue > 0 ? `$${totalValue.toFixed(0)}` : '$0',
            icon: Calendar,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions for {customer.firstName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        onClick={onCreateDrillSheet}
                        icon={FileText}
                        className="justify-start h-12"
                    >
                        Create New Drill Sheet
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onAddBall}
                        icon={Target}
                        className="justify-start h-12"
                    >
                        Add Bowling Ball
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className={`${stat.bgColor} p-4 rounded-lg border ${stat.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={stat.action}
                    >
                        <div className="flex items-center">
                            <stat.icon className={`w-6 h-6 ${stat.color} mr-3`} />
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                        {stat.action && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                <span>View details</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Drill Sheet */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Latest Drill Sheet</h3>
                        {drillSheets.length > 1 && (
                            <button
                                onClick={onViewDrillSheets}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                View All ({drillSheets.length})
                            </button>
                        )}
                    </div>

                    {recentDrillSheet ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{recentDrillSheet.name}</h4>
                                    <p className="text-sm text-gray-600">{recentDrillSheet.gripStyle}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                                    recentDrillSheet.isTemplate
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-green-100 text-green-700'
                                }`}>
                  {recentDrillSheet.isTemplate ? 'Template' : 'Active'}
                </span>
                            </div>

                            {/* Measurements */}
                            {(recentDrillSheet.thumbToMiddleFit || recentDrillSheet.thumbToRingFit) && (
                                <div className="bg-gray-50 rounded p-3 space-y-1">
                                    {recentDrillSheet.thumbToMiddleFit && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Thumb-Middle:</span>
                                            <span className="font-medium">{recentDrillSheet.thumbToMiddleFit}"</span>
                                        </div>
                                    )}
                                    {recentDrillSheet.thumbToRingFit && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Thumb-Ring:</span>
                                            <span className="font-medium">{recentDrillSheet.thumbToRingFit}"</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-sm text-gray-500">
                                Created {new Date(recentDrillSheet.createdAt).toLocaleDateString()}
                            </div>

                            {recentDrillSheet.specialNotes && (
                                <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded">
                                    "{recentDrillSheet.specialNotes}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">No drill sheets yet</p>
                            <Button
                                size="sm"
                                onClick={onCreateDrillSheet}
                                icon={Plus}
                            >
                                Create First Drill Sheet
                            </Button>
                        </div>
                    )}
                </div>

                {/* Recent Balls */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Bowling Balls</h3>
                        {balls.length > 3 && (
                            <button
                                onClick={onViewBalls}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                View All ({balls.length})
                            </button>
                        )}
                    </div>

                    {balls.length > 0 ? (
                        <div className="space-y-3">
                            {recentBalls.map((ball) => (
                                <div key={ball.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{ball.manufacturer} {ball.model}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span>{ball.weight} lbs</span>
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                ball.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : ball.status === 'RETIRED'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                            }`}>
                        {ball.status}
                      </span>
                                        </div>
                                    </div>
                                    {ball.purchasePrice && (
                                        <span className="text-sm font-medium text-gray-900">
                      ${ball.purchasePrice}
                    </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Target className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">No bowling balls yet</p>
                            <Button
                                size="sm"
                                onClick={onAddBall}
                                icon={Plus}
                            >
                                Add First Ball
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Activity Timeline</h3>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Customer account created</p>
                            <p className="text-sm text-gray-500">
                                {new Date(customer.createdAt).toLocaleDateString()} at {new Date(customer.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {recentDrillSheet && (
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Latest drill sheet created</p>
                                <p className="text-sm text-gray-500">
                                    "{recentDrillSheet.name}" - {new Date(recentDrillSheet.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {recentBalls[0] && (
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Latest ball added</p>
                                <p className="text-sm text-gray-500">
                                    {recentBalls[0].manufacturer} {recentBalls[0].model} - {recentBalls[0].purchaseDate ? new Date(recentBalls[0].purchaseDate).toLocaleDateString() : 'Date unknown'}
                                </p>
                            </div>
                        </div>
                    )}

                    {drillSheets.length === 0 && balls.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No activity yet. Create a drill sheet or add a bowling ball to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};