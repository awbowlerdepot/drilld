import React from 'react';
import { Plus, FileText, Target } from 'lucide-react';
import { Customer } from '../../types';
import { Button } from '../ui/Button';

interface CustomerQuickActionsProps {
    customer: Customer;
    onCreateDrillSheet: () => void;
    onAddBowlingBall: () => void;
    onCreateWorkOrder: () => void;
}

export const CustomerQuickActions: React.FC<CustomerQuickActionsProps> = ({
                                                                              customer,
                                                                              onCreateDrillSheet,
                                                                              onAddBowlingBall,
                                                                              onCreateWorkOrder
                                                                          }) => {
    return (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions for {customer.firstName}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    variant="secondary"
                    onClick={onCreateDrillSheet}
                    icon={FileText}
                    className="h-20 flex-col"
                >
                    <span className="mt-2">Create Drill Sheet</span>
                </Button>
                <Button
                    variant="secondary"
                    onClick={onAddBowlingBall}
                    icon={Target}
                    className="h-20 flex-col"
                >
                    <span className="mt-2">Add Bowling Ball</span>
                </Button>
                <Button
                    variant="secondary"
                    onClick={onCreateWorkOrder}
                    icon={Plus}
                    className="h-20 flex-col"
                >
                    <span className="mt-2">Create Work Order</span>
                </Button>
            </div>
        </div>
    );
};