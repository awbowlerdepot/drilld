import React from 'react';
import { Edit, Eye, Wrench, Trash2, Users } from 'lucide-react';
import { BowlingBall, Customer } from '../../types';

interface BallCardProps {
    ball: BowlingBall;
    customer?: Customer;
    onEdit: (ball: BowlingBall) => void;
    onView: (ball: BowlingBall) => void;
    onCreateWorkOrder: (ball: BowlingBall) => void;
    onDelete: (ball: BowlingBall) => void;
    showCustomerName?: boolean; // NEW: Control whether to show customer name
}

export const BallCard: React.FC<BallCardProps> = ({
                                                      ball,
                                                      customer,
                                                      onEdit,
                                                      onView,
                                                      onCreateWorkOrder,
                                                      onDelete,
                                                      showCustomerName = true // Default to true for backward compatibility
                                                  }) => {
    const getStatusColor = (status: BowlingBall['status']) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-700';
            case 'RETIRED':
                return 'bg-yellow-100 text-yellow-700';
            case 'DAMAGED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatPrice = (price?: number) => {
        return price ? `${price.toFixed(2)}` : 'N/A';
    };

    const formatDate = (date?: string) => {
        return date ? new Date(date).toLocaleDateString() : 'N/A';
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 card-hover">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                        {ball.manufacturer} {ball.model}
                    </h3>
                    {/* UPDATED: Conditionally show customer name */}
                    {showCustomerName && customer && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            {customer.firstName} {customer.lastName}
                        </div>
                    )}
                    {ball.serialNumber && (
                        <p className="text-xs text-gray-400">SN: {ball.serialNumber}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        {ball.purchaseDate ? `Purchased ${formatDate(ball.purchaseDate)}` : 'Purchase date not recorded'}
                    </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getStatusColor(ball.status)}`}>
                    {ball.status}
                </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                    <span className="text-gray-500">Weight:</span>
                    <span className="font-medium">{ball.weight} lbs</span>
                </div>

                {ball.coverstockType && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Coverstock:</span>
                        <span className="font-medium">{ball.coverstockType}</span>
                    </div>
                )}

                {ball.coreType && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Core:</span>
                        <span className="font-medium">{ball.coreType}</span>
                    </div>
                )}

                {ball.purchasePrice && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">{formatPrice(ball.purchasePrice)}</span>
                    </div>
                )}
            </div>

            {ball.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <p className="line-clamp-2">{ball.notes}</p>
                </div>
            )}

            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => onEdit(ball)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit bowling ball"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onView(ball)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="View details"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onCreateWorkOrder(ball)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                    title="Create work order"
                >
                    <Wrench className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(ball)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete bowling ball"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};