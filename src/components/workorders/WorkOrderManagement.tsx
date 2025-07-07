import React, { useState, useMemo } from 'react';
import { WorkOrder, BowlingBall, DrillSheet, Customer, Employee, Location } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderCard } from './WorkOrderCard';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { Plus, Search, Filter, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface WorkOrderManagementProps {
    workOrders: WorkOrder[];
    balls: BowlingBall[];
    drillSheets: DrillSheet[];
    customers: Customer[];
    employees: Employee[];
    locations: Location[];
    onCreateWorkOrder: (workOrder: Omit<WorkOrder, 'id' | 'createdAt'>) => void;
    onUpdateWorkOrder: (id: string, workOrder: Partial<WorkOrder>) => void;
    onDeleteWorkOrder: (id: string) => void;
}

interface Filters {
    workType: string;
    status: string;
    locationID: string;
    employeeID: string;
    dateRange: string;
}

export const WorkOrderManagement: React.FC<WorkOrderManagementProps> = ({
                                                                            workOrders,
                                                                            balls,
                                                                            drillSheets,
                                                                            customers,
                                                                            employees,
                                                                            locations,
                                                                            onCreateWorkOrder,
                                                                            onUpdateWorkOrder,
                                                                            onDeleteWorkOrder
                                                                        }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        workType: '',
        status: '',
        locationID: '',
        employeeID: '',
        dateRange: ''
    });

    // Helper functions to get related data
    const getBallById = (id: string) => balls.find(b => b.id === id);
    const getDrillSheetById = (id: string) => drillSheets.find(ds => ds.id === id);
    const getCustomerById = (id: string) => customers.find(c => c.id === id);
    const getEmployeeById = (id: string) => employees.find(e => e.id === id);
    const getLocationById = (id: string) => locations.find(l => l.id === id);

    // Calculate statistics
    const stats = useMemo(() => {
        const today = new Date();
        const thisMonth = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            return workDate.getMonth() === today.getMonth() &&
                workDate.getFullYear() === today.getFullYear();
        });

        const totalRevenue = thisMonth.reduce((sum, wo) => sum + (wo.totalCost || 0), 0);
        const avgSatisfaction = thisMonth.length > 0
            ? thisMonth.reduce((sum, wo) => sum + (wo.customerSatisfaction || 0), 0) / thisMonth.length
            : 0;

        return {
            totalWorkOrders: workOrders.length,
            thisMonthOrders: thisMonth.length,
            totalRevenue,
            avgSatisfaction: avgSatisfaction.toFixed(1)
        };
    }, [workOrders]);

    // Filter work orders
    const filteredWorkOrders = useMemo(() => {
        return workOrders.filter(workOrder => {
            const ball = getBallById(workOrder.ballID);
            const customer = ball ? getCustomerById(ball.customerID) : null;
            const employee = workOrder.performedByEmployeeID ? getEmployeeById(workOrder.performedByEmployeeID) : null;
            const location = getLocationById(workOrder.locationID);

            // Search filter
            const searchMatch = !searchTerm || [
                ball?.manufacturer,
                ball?.model,
                customer?.firstName,
                customer?.lastName,
                employee?.firstName,
                employee?.lastName,
                location?.name,
                workOrder.workNotes
            ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

            // Other filters
            const workTypeMatch = !filters.workType || workOrder.workType === filters.workType;
            const locationMatch = !filters.locationID || workOrder.locationID === filters.locationID;
            const employeeMatch = !filters.employeeID || workOrder.performedByEmployeeID === filters.employeeID;

            // Date range filter
            let dateMatch = true;
            if (filters.dateRange) {
                const workDate = new Date(workOrder.workDate);
                const today = new Date();

                switch (filters.dateRange) {
                    case 'today':
                        dateMatch = workDate.toDateString() === today.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        dateMatch = workDate >= weekAgo;
                        break;
                    case 'month':
                        dateMatch = workDate.getMonth() === today.getMonth() &&
                            workDate.getFullYear() === today.getFullYear();
                        break;
                }
            }

            return searchMatch && workTypeMatch && locationMatch && employeeMatch && dateMatch;
        });
    }, [workOrders, searchTerm, filters, balls, customers, employees, locations]);

    const handleSave = (workOrderData: Omit<WorkOrder, 'id' | 'createdAt'>) => {
        if (editingWorkOrder) {
            onUpdateWorkOrder(editingWorkOrder.id, workOrderData);
        } else {
            onCreateWorkOrder(workOrderData);
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

        if (window.confirm(`Are you sure you want to delete the work order for ${ball?.manufacturer} ${ball?.model} (${customerName})?`)) {
            onDeleteWorkOrder(workOrder.id);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingWorkOrder(null);
    };

    const updateFilter = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            workType: '',
            status: '',
            locationID: '',
            employeeID: '',
            dateRange: ''
        });
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
                        <p className="text-gray-600 mt-1">
                            Manage drilling work orders and track progress
                        </p>
                    </div>
                    <Button icon={Plus} onClick={() => setShowForm(true)}>
                        Create Work Order
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-900">This Month</p>
                                <p className="text-lg font-semibold text-green-900">{stats.thisMonthOrders}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-yellow-900">Revenue</p>
                                <p className="text-lg font-semibold text-yellow-900">${stats.totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-purple-900">Avg Satisfaction</p>
                                <p className="text-lg font-semibold text-purple-900">{stats.avgSatisfaction}/10</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Search work orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={Filter}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                        {(searchTerm || Object.values(filters).some(f => f)) && (
                            <Button
                                variant="secondary"
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work Type
                                </label>
                                <Select
                                    value={filters.workType}
                                    onChange={(value) => updateFilter('workType', value)}
                                    placeholder="All types"
                                >
                                    <option value="INITIAL_DRILL">Initial Drill</option>
                                    <option value="PLUG_REDRILL">Plug & Redrill</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <Select
                                    value={filters.locationID}
                                    onChange={(value) => updateFilter('locationID', value)}
                                    placeholder="All locations"
                                >
                                    {locations.map(location => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Technician
                                </label>
                                <Select
                                    value={filters.employeeID}
                                    onChange={(value) => updateFilter('employeeID', value)}
                                    placeholder="All technicians"
                                >
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.firstName} {employee.lastName}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Range
                                </label>
                                <Select
                                    value={filters.dateRange}
                                    onChange={(value) => updateFilter('dateRange', value)}
                                    placeholder="All dates"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Work Order Form */}
            {showForm && (
                <WorkOrderForm
                    workOrder={editingWorkOrder || undefined}
                    balls={balls}
                    drillSheets={drillSheets}
                    employees={employees}
                    locations={locations}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            {/* Work Orders List */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Work Orders ({filteredWorkOrders.length})
                    </h3>
                </div>

                {filteredWorkOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || Object.values(filters).some(f => f)
                                ? 'Try adjusting your search or filters.'
                                : 'Get started by creating your first work order.'
                            }
                        </p>
                        {!searchTerm && !Object.values(filters).some(f => f) && (
                            <div className="mt-6">
                                <Button onClick={() => setShowForm(true)}>
                                    Create Work Order
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredWorkOrders.map(workOrder => (
                            <WorkOrderCard
                                key={workOrder.id}
                                workOrder={workOrder}
                                ball={getBallById(workOrder.ballID)}
                                customer={workOrder.ballID ? getCustomerById(getBallById(workOrder.ballID)?.customerID || '') : undefined}
                                employee={workOrder.performedByEmployeeID ? getEmployeeById(workOrder.performedByEmployeeID) : undefined}
                                location={getLocationById(workOrder.locationID)}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

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