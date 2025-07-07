// src/components/customers/CustomerDetailView.tsx (Fixed - Clean Version)
import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, Target, Edit, Eye } from 'lucide-react';
import { Customer, DrillSheet, BowlingBall } from '../../types';
import { useDrillSheets } from '../../hooks/useDrillSheets';
import { useBalls } from '../../hooks/useBalls';
import { Button } from '../ui/Button';
import { DrillSheetForm } from '../drillsheets/DrillSheetForm';
import { DrillSheetCard } from '../drillsheets/DrillSheetCard';
import { BallCard } from '../balls/BallCard';
import { BallForm } from '../balls/BallForm';
import { CustomerOverview } from './CustomerOverview';

interface CustomerDetailViewProps {
    customer: Customer;
    onBack: () => void;
    onEditCustomer: (customer: Customer) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
                                                                          customer,
                                                                          onBack,
                                                                          onEditCustomer
                                                                      }) => {
    const { addDrillSheet, updateDrillSheet, deleteDrillSheet, getDrillSheetsByCustomer } = useDrillSheets();
    const { addBall, updateBall, deleteBall, getBallsByCustomer } = useBalls();

    const [activeTab, setActiveTab] = useState<'overview' | 'drillsheets' | 'balls'>('overview');
    const [showDrillSheetForm, setShowDrillSheetForm] = useState(false);
    const [editingDrillSheet, setEditingDrillSheet] = useState<DrillSheet | null>(null);
    const [showBallForm, setShowBallForm] = useState(false);
    const [editingBall, setEditingBall] = useState<BowlingBall | null>(null);

    const customerDrillSheets = getDrillSheetsByCustomer(customer.id);
    const customerBalls = getBallsByCustomer(customer.id);

    // Drill Sheet Handlers
    const handleSaveDrillSheet = (drillSheetData: Omit<DrillSheet, 'id' | 'createdAt'>) => {
        if (editingDrillSheet) {
            updateDrillSheet(editingDrillSheet.id, drillSheetData);
        } else {
            addDrillSheet({
                ...drillSheetData,
                customerID: customer.id
            });
        }
        setShowDrillSheetForm(false);
        setEditingDrillSheet(null);
    };

    const handleEditDrillSheet = (drillSheet: DrillSheet) => {
        setEditingDrillSheet(drillSheet);
        setShowDrillSheetForm(true);
    };

    const handleViewDrillSheet = (drillSheet: DrillSheet) => {
        // TODO: Implement drill sheet detail modal or navigate to detail view
        console.log('View drill sheet:', drillSheet);
        alert(`Viewing drill sheet: ${drillSheet.name}\nGrip: ${drillSheet.gripStyle}\nNotes: ${drillSheet.specialNotes || 'None'}`);
    };

    const handlePrintDrillSheet = (drillSheet: DrillSheet) => {
        // TODO: Implement print functionality
        console.log('Print drill sheet:', drillSheet);
        alert(`Printing drill sheet: ${drillSheet.name}`);
    };

    const handleDeleteDrillSheet = (drillSheet: DrillSheet) => {
        if (window.confirm(`Are you sure you want to delete "${drillSheet.name}"?`)) {
            deleteDrillSheet(drillSheet.id);
        }
    };

    const handleCancelDrillSheetForm = () => {
        setShowDrillSheetForm(false);
        setEditingDrillSheet(null);
    };

    // Ball Handlers
    const handleSaveBall = (ballData: Omit<BowlingBall, 'id'>) => {
        if (editingBall) {
            updateBall(editingBall.id, ballData);
        } else {
            addBall({
                ...ballData,
                customerID: customer.id
            });
        }
        setShowBallForm(false);
        setEditingBall(null);
    };

    const handleEditBall = (ball: BowlingBall) => {
        setEditingBall(ball);
        setShowBallForm(true);
    };

    const handleViewBall = (ball: BowlingBall) => {
        // TODO: Implement ball detail modal
        console.log('View ball:', ball);
        alert(`Viewing ball: ${ball.manufacturer} ${ball.model}\nWeight: ${ball.weight}lbs\nStatus: ${ball.status}`);
    };

    const handleCreateWorkOrder = (ball: BowlingBall) => {
        // TODO: Navigate to work order creation with pre-filled ball
        console.log('Create work order for ball:', ball);
        alert(`Creating work order for: ${ball.manufacturer} ${ball.model}`);
    };

    const handleDeleteBall = (ball: BowlingBall) => {
        if (window.confirm(`Are you sure you want to delete the ${ball.manufacturer} ${ball.model}?`)) {
            deleteBall(ball.id);
        }
    };

    const handleCancelBallForm = () => {
        setShowBallForm(false);
        setEditingBall(null);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
        { id: 'drillsheets', label: 'Drill Sheets', icon: <FileText className="w-4 h-4" />, count: customerDrillSheets.length },
        { id: 'balls', label: 'Bowling Balls', icon: <Target className="w-4 h-4" />, count: customerBalls.length }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        icon={ArrowLeft}
                        size="sm"
                    >
                        Back to Customers
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {customer.firstName} {customer.lastName}
                        </h1>
                        <p className="text-gray-600">{customer.email} • {customer.phone}</p>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => onEditCustomer(customer)}
                    icon={Edit}
                >
                    Edit Customer
                </Button>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Contact Information
                        </h3>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-900">{customer.email || 'No email provided'}</p>
                            <p className="text-sm text-gray-900">{customer.phone || 'No phone provided'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Bowling Preferences
                        </h3>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-900">{customer.dominantHand} handed</p>
                            <p className="text-sm text-gray-900">{customer.preferredGripStyle.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-900">Thumb: {customer.usesThumb ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Quick Stats
                        </h3>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-900">{customerDrillSheets.length} Drill Sheets</p>
                            <p className="text-sm text-gray-900">{customerBalls.length} Bowling Balls</p>
                            <p className="text-sm text-gray-500">
                                Customer since {new Date(customer.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                {customer.notes && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Notes
                        </h3>
                        <p className="text-sm text-gray-900">{customer.notes}</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                    {tab.count}
                  </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <CustomerOverview
                            customer={customer}
                            drillSheets={customerDrillSheets}
                            balls={customerBalls}
                            onViewDrillSheets={() => setActiveTab('drillsheets')}
                            onViewBalls={() => setActiveTab('balls')}
                            onCreateDrillSheet={() => {
                                setActiveTab('drillsheets');
                                setShowDrillSheetForm(true);
                            }}
                            onAddBall={() => {
                                setActiveTab('balls');
                                setShowBallForm(true);
                            }}
                        />
                    )}

                    {activeTab === 'drillsheets' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Drill Sheets for {customer.firstName}
                                </h3>
                                <Button
                                    onClick={() => setShowDrillSheetForm(true)}
                                    icon={Plus}
                                >
                                    Create Drill Sheet
                                </Button>
                            </div>

                            {showDrillSheetForm && (
                                <div className="animate-fade-in">
                                    <DrillSheetForm
                                        drillSheet={editingDrillSheet || undefined}
                                        customers={[customer]} // Only this customer
                                        onSave={handleSaveDrillSheet}
                                        onCancel={handleCancelDrillSheetForm}
                                        preselectedCustomerId={customer.id}
                                    />
                                </div>
                            )}

                            {customerDrillSheets.length === 0 && !showDrillSheetForm ? (
                                <div className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drill sheets</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by creating a drill sheet for {customer.firstName}.
                                    </p>
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => setShowDrillSheetForm(true)}
                                            icon={Plus}
                                        >
                                            Create First Drill Sheet
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {customerDrillSheets.map((sheet) => (
                                        <DrillSheetCard
                                            key={sheet.id}
                                            drillSheet={sheet}
                                            customer={customer}
                                            onEdit={handleEditDrillSheet}
                                            onView={handleViewDrillSheet}
                                            onPrint={handlePrintDrillSheet}
                                            onDelete={handleDeleteDrillSheet}
                                            showCustomerName={false} // Don't show customer name since we're in customer context
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'balls' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Bowling Balls for {customer.firstName}
                                </h3>
                                <Button
                                    onClick={() => setShowBallForm(true)}
                                    icon={Plus}
                                >
                                    Add Bowling Ball
                                </Button>
                            </div>

                            {showBallForm && (
                                <div className="animate-fade-in">
                                    <BallForm
                                        ball={editingBall || undefined}
                                        customers={[customer]} // Only this customer
                                        onSave={handleSaveBall}
                                        onCancel={handleCancelBallForm}
                                    />
                                </div>
                            )}

                            {customerBalls.length === 0 && !showBallForm ? (
                                <div className="text-center py-12">
                                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No bowling balls</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Add {customer.firstName}'s first bowling ball to get started.
                                    </p>
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => setShowBallForm(true)}
                                            icon={Plus}
                                        >
                                            Add First Ball
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {customerBalls.map((ball) => (
                                        <BallCard
                                            key={ball.id}
                                            ball={ball}
                                            customer={customer}
                                            onEdit={handleEditBall}
                                            onView={handleViewBall}
                                            onCreateWorkOrder={handleCreateWorkOrder}
                                            onDelete={handleDeleteBall}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};