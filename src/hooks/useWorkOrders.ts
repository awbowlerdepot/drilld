import { useState, useEffect } from 'react';
import { WorkOrder } from '../types';
import { mockWorkOrders } from '../data/mockData';

export const useWorkOrders = () => {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setWorkOrders(mockWorkOrders);
            setLoading(false);
        }, 500);
    }, []);

    const addWorkOrder = (workOrder: Omit<WorkOrder, 'id' | 'createdAt'>) => {
        const newWorkOrder: WorkOrder = {
            ...workOrder,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        setWorkOrders(prev => [...prev, newWorkOrder]);
        return newWorkOrder;
    };

    const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
        setWorkOrders(prev =>
            prev.map(workOrder =>
                workOrder.id === id ? { ...workOrder, ...updates } : workOrder
            )
        );
    };

    const deleteWorkOrder = (id: string) => {
        setWorkOrders(prev => prev.filter(workOrder => workOrder.id !== id));
    };

    const getWorkOrderById = (id: string) => {
        return workOrders.find(workOrder => workOrder.id === id);
    };

    const getWorkOrdersByBall = (ballId: string) => {
        return workOrders.filter(workOrder => workOrder.ballID === ballId);
    };

    const getWorkOrdersByCustomer = (customerId: string, balls: Array<{id: string, customerID: string}>) => {
        const customerBallIds = balls
            .filter(ball => ball.customerID === customerId)
            .map(ball => ball.id);

        return workOrders.filter(workOrder =>
            customerBallIds.includes(workOrder.ballID)
        );
    };

    const getWorkOrdersByEmployee = (employeeId: string) => {
        return workOrders.filter(workOrder =>
            workOrder.performedByEmployeeID === employeeId
        );
    };

    const getWorkOrdersByLocation = (locationId: string) => {
        return workOrders.filter(workOrder => workOrder.locationID === locationId);
    };

    const getWorkOrdersByWorkType = (workType: WorkOrder['workType']) => {
        return workOrders.filter(workOrder => workOrder.workType === workType);
    };

    const getWorkOrdersByDateRange = (startDate: string, endDate: string) => {
        return workOrders.filter(workOrder => {
            const workDate = new Date(workOrder.workDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return workDate >= start && workDate <= end;
        });
    };

    const getRecentWorkOrders = (limit: number = 10) => {
        return [...workOrders]
            .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime())
            .slice(0, limit);
    };

    const getWorkOrderStats = () => {
        const today = new Date();
        const thisMonth = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            return workDate.getMonth() === today.getMonth() &&
                workDate.getFullYear() === today.getFullYear();
        });

        const thisWeek = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return workDate >= weekAgo;
        });

        const totalRevenue = workOrders.reduce((sum, wo) => sum + (wo.totalCost || 0), 0);
        const monthlyRevenue = thisMonth.reduce((sum, wo) => sum + (wo.totalCost || 0), 0);
        const avgSatisfaction = workOrders.length > 0
            ? workOrders.reduce((sum, wo) => sum + (wo.customerSatisfaction || 0), 0) / workOrders.length
            : 0;

        const workTypeBreakdown = workOrders.reduce((acc, wo) => {
            acc[wo.workType] = (acc[wo.workType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const completedWithQualityCheck = workOrders.filter(wo => wo.qualityCheck).length;
        const qualityCheckRate = workOrders.length > 0
            ? (completedWithQualityCheck / workOrders.length) * 100
            : 0;

        return {
            total: workOrders.length,
            thisMonth: thisMonth.length,
            thisWeek: thisWeek.length,
            totalRevenue,
            monthlyRevenue,
            avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
            workTypeBreakdown,
            qualityCheckRate: Number(qualityCheckRate.toFixed(1))
        };
    };

    return {
        workOrders,
        loading,
        error,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        getWorkOrderById,
        getWorkOrdersByBall,
        getWorkOrdersByCustomer,
        getWorkOrdersByEmployee,
        getWorkOrdersByLocation,
        getWorkOrdersByWorkType,
        getWorkOrdersByDateRange,
        getRecentWorkOrders,
        getWorkOrderStats
    };
};