// src/components/customers/CustomerDetailView.tsx
import React, { useState } from 'react';
import { ArrowLeft, FileText, Target, Edit, Eye, Paperclip } from 'lucide-react';
import { Customer } from '../../types';
import { useCustomerAttachments } from '../../hooks/useCustomerAttachments';
import { useCustomerDrillSheets } from '../../hooks/useCustomerDrillSheets';
import { useCompanyBalls } from '../../hooks/useCompanyBalls';
import { useCustomers } from '../../hooks/useCustomers';
import { Button } from '../common/Button';
import { CustomerFiles } from '../attachments/CustomerFiles';
import { CustomerDrillSheets } from '../drillsheets/CustomerDrillSheets';
import { DrillSheetEditor } from '../drillsheets/editor/DrillSheetEditor';
import { CustomerBalls } from '../balls/CustomerBalls';
import { CustomerOverview } from './CustomerOverview';

interface CustomerDetailViewProps {
    customer: Customer;
    onBack: () => void;
    onEditCustomer: (customer: Customer) => void;
    /** The location picked in the sidebar; recorded on drill sheet revisions. */
    currentLocationID?: string;
    /** A drill sheet to open straight away, with its paper sheet beside it (after a paper import). */
    initialDrillSheetId?: string | null;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
                                                                          customer,
                                                                          onBack,
                                                                          onEditCustomer,
                                                                          currentLocationID,
                                                                          initialDrillSheetId
                                                                      }) => {
    const ballList = useCompanyBalls({ customerId: customer.id });
    const { customers } = useCustomers();

    const [activeTab, setActiveTab] = useState<'overview' | 'drillsheets' | 'files' | 'balls'>('overview');
    const [includeArchivedSheets, setIncludeArchivedSheets] = useState(false);
    const [creatingDrillSheet, setCreatingDrillSheet] = useState(false);
    const [openDrillSheetId, setOpenDrillSheetId] = useState<string | null>(initialDrillSheetId ?? null);
    const drillSheets = useCustomerDrillSheets(customer.id, { includeArchived: includeArchivedSheets });
    const files = useCustomerAttachments(customer.id);
    const [addingBall, setAddingBall] = useState(false);
    const customerBalls = ballList.balls;

    if (openDrillSheetId) {
        return (
            <DrillSheetEditor
                sheetId={openDrillSheetId}
                customer={customer}
                locationID={currentLocationID}
                initialPaperOpen={openDrillSheetId === initialDrillSheetId}
                onBack={() => {
                    setOpenDrillSheetId(null);
                    drillSheets.reload();
                }}
            />
        );
    }

    const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
        { id: 'drillsheets', label: 'Drill Sheets', icon: <FileText className="w-4 h-4" />, count: drillSheets.sheets.length },
        { id: 'files', label: 'Files', icon: <Paperclip className="w-4 h-4" />, count: files.attachments.length },
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
                            <p className="text-sm text-gray-900">{drillSheets.sheets.length} Drill Sheets</p>
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
                                onClick={() => setActiveTab(tab.id)}
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
                            drillSheets={drillSheets.sheets}
                            balls={customerBalls}
                            onViewDrillSheets={() => setActiveTab('drillsheets')}
                            onViewBalls={() => setActiveTab('balls')}
                            onCreateDrillSheet={() => {
                                setActiveTab('drillsheets');
                                setCreatingDrillSheet(true);
                            }}
                            onAddBall={() => {
                                setActiveTab('balls');
                                setAddingBall(true);
                            }}
                        />
                    )}

                    {activeTab === 'drillsheets' && (
                        <CustomerDrillSheets
                            customer={customer}
                            drillSheets={drillSheets}
                            includeArchived={includeArchivedSheets}
                            onIncludeArchivedChange={setIncludeArchivedSheets}
                            onOpen={sheet => setOpenDrillSheetId(sheet.id)}
                            creating={creatingDrillSheet}
                            onCreatingChange={setCreatingDrillSheet}
                        />
                    )}

                    {activeTab === 'files' && <CustomerFiles customer={customer} files={files} />}

                    {activeTab === 'balls' && (
                        <CustomerBalls customer={customer} customers={customers} balls={ballList} adding={addingBall} onAddingChange={setAddingBall} />
                    )}
                </div>
            </div>
        </div>
    );
};