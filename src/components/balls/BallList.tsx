import React from 'react';
import { BowlingBall, Customer } from '../../types';
import { BallCard } from './BallCard';

interface BallListProps {
    balls: BowlingBall[];
    customers: Customer[];
    onEdit: (ball: BowlingBall) => void;
    onView: (ball: BowlingBall) => void;
    onCreateWorkOrder: (ball: BowlingBall) => void;
    onDelete: (ball: BowlingBall) => void;
}

export const BallList: React.FC<BallListProps> = ({
                                                      balls,
                                                      customers,
                                                      onEdit,
                                                      onView,
                                                      onCreateWorkOrder,
                                                      onDelete
                                                  }) => {
    const getCustomerById = (id: string) => {
        return customers.find(customer => customer.id === id);
    };

    if (balls.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bowling balls found</h3>
                <p className="text-gray-500">Get started by adding a customer's first bowling ball.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {balls.map((ball) => (
                <BallCard
                    key={ball.id}
                    ball={ball}
                    customer={getCustomerById(ball.customerID)}
                    onEdit={onEdit}
                    onView={onView}
                    onCreateWorkOrder={onCreateWorkOrder}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};