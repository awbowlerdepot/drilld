import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BowlingBall } from '../../types';
import { useBalls } from '../../hooks/useBalls';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../ui/Button';
import { BallForm } from './BallForm';
import { BallList } from './BallList';
import { BallFilters } from './BallFilters';
import { BallStats } from './BallStats';

interface BowlingBallManagementProps {
    searchTerm: string;
}

export const BowlingBallManagement: React.FC<BowlingBallManagementProps> = ({
                                                                                searchTerm
                                                                            }) => {
    const { balls, loading, addBall, updateBall, deleteBall } = useBalls();
    const { customers } = useCustomers();
    const [showForm, setShowForm] = useState(false);
    const [editingBall, setEditingBall] = useState<BowlingBall | null>(null);

    const [filters, setFilters] = useState({
        customerID: '',
        manufacturer: '',
        status: '',
        weight: ''
    });

    // Apply search and filters
    const filteredBalls = balls.filter(ball => {
        const customer = customers.find(c => c.id === ball.customerID);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';

        const matchesSearch =
            ball.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ball.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ball.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilters =
            (!filters.customerID || ball.customerID === filters.customerID) &&
            (!filters.manufacturer || ball.manufacturer === filters.manufacturer) &&
            (!filters.status || ball.status === filters.status) &&
            (!filters.weight || ball.weight.toString() === filters.weight);

        return matchesSearch && matchesFilters;
    });

    const handleSave = (ballData: Omit<BowlingBall, 'id'>) => {
        if (editingBall) {
            updateBall(editingBall.id, ballData);
        } else {
            addBall(ballData);
        }
        setShowForm(false);
        setEditingBall(null);
    };

    const handleEdit = (ball: BowlingBall) => {
        setEditingBall(ball);
        setShowForm(true);
    };

    const handleView = (ball: BowlingBall) => {
        // TODO: Implement view modal/page
        console.log('View ball:', ball);
    };

    const handleCreateWorkOrder = (ball: BowlingBall) => {
        // TODO: Navigate to work order creation with pre-filled ball
        console.log('Create work order for ball:', ball);
    };

    const handleDelete = (ball: BowlingBall) => {
        const customer = customers.find(c => c.id === ball.customerID);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';

        if (window.confirm(
            `Are you sure you want to delete the ${ball.manufacturer} ${ball.model} for ${customerName}?`
        )) {
            deleteBall(ball.id);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingBall(null);
    };

    const clearFilters = () => {
        setFilters({
            customerID: '',
            manufacturer: '',
            status: '',
            weight: ''
        });
    };

    if (loading) {
        return <div className="flex justify-center py-8">Loading bowling balls...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Bowling Balls</h2>
                <Button icon={Plus} onClick={() => setShowForm(true)}>
                    Add Bowling Ball
                </Button>
            </div>

            {/* Stats Overview */}
            <BallStats balls={balls} />

            {/* Filters */}
            <BallFilters
                balls={balls}
                customers={customers}
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={clearFilters}
            />

            {/* Form Modal */}
            {showForm && (
                <BallForm
                    ball={editingBall || undefined}
                    customers={customers}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            {/* Results Summary */}
            {filteredBalls.length !== balls.length && (
                <div className="text-sm text-gray-600">
                    Showing {filteredBalls.length} of {balls.length} bowling balls
                </div>
            )}

            {/* Ball List */}
            <BallList
                balls={filteredBalls}
                customers={customers}
                onEdit={handleEdit}
                onView={handleView}
                onCreateWorkOrder={handleCreateWorkOrder}
                onDelete={handleDelete}
            />
        </div>
    );
};