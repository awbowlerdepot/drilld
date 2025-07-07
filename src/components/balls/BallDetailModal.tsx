import React from 'react';
import { X, Calendar, DollarSign, Package, Wrench } from 'lucide-react';
import { BowlingBall, Customer } from '../../types';
import { Button } from '../ui/Button';

interface BallDetailModalProps {
    ball: BowlingBall;
    customer?: Customer;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onCreateWorkOrder: () => void;
}

export const BallDetailModal: React.FC<BallDetailModalProps> = ({
                                                                    ball,
                                                                    customer,
                                                                    isOpen,
                                                                    onClose,
                                                                    onEdit,
                                                                    onCreateWorkOrder
                                                                }) => {
    if (!isOpen) return null;

    const formatDate = (date?: string) => {
        return date ? new Date(date).toLocaleDateString() : 'Not specified';
    };

    const formatPrice = (price?: number) => {
        return price ? `${price.toFixed(2)}` : 'Not specified';
    };

    const getStatusColor = (status: BowlingBall['status']) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'RETIRED':
                return 'bg-yellow-100 text-yellow-800';
            case 'DAMAGED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {ball.manufacturer} {ball.model}
                        </h3>
                        <p className="text-gray-600">
                            Owner: {customer?.firstName} {customer?.lastName}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ball.status)}`}>
              {ball.status}
            </span>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Ball Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Ball Specifications</h4>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Weight:</span>
                                <span className="font-medium">{ball.weight} lbs</span>
                            </div>

                            {ball.serialNumber && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Serial Number:</span>
                                    <span className="font-medium">{ball.serialNumber}</span>
                                </div>
                            )}

                            {ball.coverstockType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Coverstock:</span>
                                    <span className="font-medium">{ball.coverstockType}</span>
                                </div>
                            )}

                            {ball.coreType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Core Type:</span>
                                    <span className="font-medium">{ball.coreType}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Purchase Information</h4>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-500">Purchase Date:</span>
                                </div>
                                <span className="font-medium">{formatDate(ball.purchaseDate)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-500">Purchase Price:</span>
                                </div>
                                <span className="font-medium">{formatPrice(ball.purchasePrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {ball.notes && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Notes</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700">{ball.notes}</p>
                        </div>
                    </div>
                )}

                {/* Customer Information */}
                {customer && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Contact:</p>
                                    <p className="font-medium">{customer.email}</p>
                                    <p className="font-medium">{customer.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Preferences:</p>
                                    <p className="font-medium">{customer.dominantHand} handed</p>
                                    <p className="font-medium">{customer.preferredGripStyle.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="secondary"
                        icon={Package}
                        onClick={onEdit}
                    >
                        Edit Ball
                    </Button>
                    <Button
                        icon={Wrench}
                        onClick={onCreateWorkOrder}
                    >
                        Create Work Order
                    </Button>
                </div>
            </div>
        </div>
    );
};