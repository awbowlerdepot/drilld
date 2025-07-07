import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { WorkOrder } from '../../types';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useBalls } from '../../hooks/useBalls';
import { useCustomers } from '../../hooks/useCustomers';
import { useEmployees } from '../../hooks/useEmployees';
import { useLocations } from '../../hooks/useLocations';
import { useDrillSheets } from '../../hooks/useDrillSheets';
import { Button } from '../ui/Button';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderList } from './WorkOrderList';
import { WorkOrderFilters } from './WorkOrderFilters';
import { WorkOrderStats } from './WorkOrderStats';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';

interface WorkOrderManagementProps {
    searchTerm: string;
}

export const WorkOrderManagement: React.FC<WorkOrderManagementProps> = ({
                                                                            searchTerm
                                                                        }) => {
    const { workOrders, loading, addWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrders();
    const { balls } = useBalls();
    const { customers } = useCustomers();
    const { employees } = useEmployees();
    const { locations } = useLocations();
    const { drillSheets } = useDrillSheets();

    const [showForm, setShowForm] = useState(false);
    const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

    const [filters, setFilters] = useState({
        workType: '',
        locationID: '',
        employeeID: '',
        dateRange: ''
    });

    // Helper functions to get related data
    const getBallById = (id: string) => balls.find(b => b.id === id);
    const getCustomerById = (id: string) => customers.find(c => c.id === id);
    const getEmployeeById = (id: string) => employees.find(e => e.id === id);
    const getLocationById = (id: string) => locations.find(l => l.id === id);
    const getDrillSheetById = (id: string) => drillSheets.find(ds => ds.id === id);

    // Apply search and filters
    const filteredWorkOrders = useMemo(() => {
        return workOrders.filter(workOrder => {
            const ball = getBallById(workOrder.ballID);
            const customer = ball ? getCustomerById(ball.customerID) : null;
            const employee = workOrder.performedByEmployeeID ? getEmployeeById(workOrder.performedByEmployeeID) : null;
            const location = getLocationById(workOrder.locationID);

            // Search term matching
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || [
                ball?.manufacturer,
                ball?.model,
                customer?.firstName,
                customer?.lastName,
                employee?.firstName,
                employee?.lastName,
                location?.name,
                workOrder.workType,
                workOrder.workNotes,
                workOrder.specialNotes
            ].some(field => field?.toLowerCase().includes(searchLower));

            // Filter matching
            const matchesFilters = (
                (!filters.workType || workOrder.workType === filters.workType) &&
                (!filters.locationID || workOrder.locationID === filters.locationID) &&
                (!filters.employeeID || workOrder.performedByEmployeeID === filters.employeeID) &&
                (!filters.dateRange || matchesDateRange(workOrder.workDate, filters.dateRange))
            );

            return matchesSearch && matchesFilters;
        });
    }, [workOrders, balls, customers, employees, locations, searchTerm, filters]);

    // Date range matching helper
    const matchesDateRange = (workDate: string, range: string): boolean => {
        const date = new Date(workDate);
        const today = new Date();

        switch (range) {
            case 'today':
                return date.toDateString() === today.toDateString();
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
            case 'month':
                return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                const dateQuarter = Math.floor(date.getMonth() / 3);
                return dateQuarter === quarter && date.getFullYear() === today.getFullYear();
            case 'year':
                return date.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    };

    const handleSave = (workOrderData: Omit<WorkOrder, 'id' | 'createdAt'>) => {
        if (editingWorkOrder) {
            updateWorkOrder(editingWorkOrder.id, workOrderData);
        } else {
            addWorkOrder(workOrderData);
        }
        setShowForm(false);
        setEditingWorkOrder(null);
    };

    const handleEdit = (workOrder: WorkOrder) => {
        setEditingWorkOrder(workOrder);
        setShowForm(true);
    };

    const handleView = (workOrder: WorkOrder) => {
        setSelectedWorkOrder(workOrder);
    };

    const handleDelete = (workOrder: WorkOrder) => {
        const ball = getBallById(workOrder.ballID);
        const customer = ball ? getCustomerById(ball.customerID) : null;
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
        const workType = workOrder.workType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

        if (window.confirm(
            `Are you sure you want to delete the ${workType} work order for ${customerName}?`
        )) {
            deleteWorkOrder(workOrder.id);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingWorkOrder(null);
    };

    const clearFilters = () => {
        setFilters({
            workType: '',
            locationID: '',
            employeeID: '',
            dateRange: ''
        });
    };

    if (loading) {
        return <div className="flex justify-center py-8">Loading work orders...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
                <Button icon={Plus} onClick={() => setShowForm(true)}>
                    Create Work Order
                </Button>
            </div>

            {/* Stats Overview */}
            <WorkOrderStats
                workOrders={workOrders}
                balls={balls}
                customers={customers}
            />

            {/* Filters */}
            <WorkOrderFilters
                workOrders={workOrders}
                employees={employees}
                locations={locations}
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={clearFilters}
            />

            {/* Form Modal */}
            {showForm && (
                <WorkOrderForm
                    workOrder={editingWorkOrder || undefined}
                    balls={balls}
                    customers={customers}
                    employees={employees}
                    locations={locations}
                    drillSheets={drillSheets}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            {/* Results Summary */}
            {filteredWorkOrders.length !== workOrders.length && (
                <div className="text-sm text-gray-600">
                    Showing {filteredWorkOrders.length} of {workOrders.length} work orders
                </div>
            )}

            {/* Work Order List */}
            <WorkOrderList
                workOrders={filteredWorkOrders}
                balls={balls}
                customers={customers}
                employees={employees}
                locations={locations}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
            />

            {/* Work Order Detail Modal */}
            {selectedWorkOrder && (
                <WorkOrderDetailModal
                    workOrder={selectedWorkOrder}
                    ball={getBallById(selectedWorkOrder.ballID)}
                    drillSheet={getDrillSheetById(selectedWorkOrder.drillSheetID)}
                    customer={selectedWorkOrder.ballID ? getCustomerById(getBallById(selectedWorkOrder.ballID)?.customerID || '') : undefined}
                    employee={selectedWorkOrder.performedByEmployeeID ? getEmployeeById(selectedWorkOrder.performedByEmployeeID) : undefined}
                    location={getLocationById(selectedWorkOrder.locationID)}
                    onClose={() => setSelectedWorkOrder(null)}
                    onEdit={() => {
                        setSelectedWorkOrder(null);
                        handleEdit(selectedWorkOrder);
                    }}
                />
            )}
        </div>
    );
};