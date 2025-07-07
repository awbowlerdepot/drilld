import React from 'react';
import { WorkOrder, BowlingBall, Customer, Employee, Location } from '../../types';
import { WorkOrderCard } from './WorkOrderCard';
import { Calendar } from 'lucide-react';

interface WorkOrderListProps {
    workOrders: WorkOrder[];
    balls: BowlingBall[];
    customers: Customer[];
    employees: Employee[];
    locations: Location[];
    onEdit: (workOrder: WorkOrder) => void;
    onView: (workOrder: WorkOrder) => void;
    onDelete: (workOrder: WorkOrder) => void;
    showCustomerNames?: boolean;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
                                                                workOrders,
                                                                balls,
                                                                customers,
                                                                employees,
                                                                locations,
                                                                onEdit,
                                                                onView,
                                                                onDelete,
                                                                showCustomerNames = true
                                                            }) => {
    const getBallById = (id: string) => balls.find(ball => ball.id === id);
    const getCustomerById = (id: string) => customers.find(customer => customer.id === id);
    const getEmployeeById = (id: string) => employees.find(employee => employee.id === id);
    const getLocationById = (id: string) => locations.find(location => location.id === id);

    if (workOrders.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <Calendar className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-500">Get started by creating your first work order.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {workOrders.map((workOrder) => {
                const ball = getBallById(workOrder.ballID);
                const customer = ball ? getCustomerById(ball.customerID) : undefined;
                const employee = workOrder.performedByEmployeeID ? getEmployeeById(workOrder.performedByEmployeeID) : undefined;
                const location = getLocationById(workOrder.locationID);

                return (
                    <WorkOrderCard
                        key={workOrder.id}
                        workOrder={workOrder}
                        ball={ball}
                        customer={customer}
                        employee={employee}
                        location={location}
                        onEdit={onEdit}
                        onView={onView}
                        onDelete={onDelete}
                        showCustomerName={showCustomerNames}
                    />
                );
            })}
        </div>
    );
};