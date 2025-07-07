import React from 'react';
import { Settings, DollarSign, FileText, Users, CheckSquare } from 'lucide-react';
import { ProShopWorkflowSettings } from '../../../types/proshopSettings';
import { Input } from '../../ui/Input';

interface WorkflowSettingsTabProps {
    settings: ProShopWorkflowSettings;
    onUpdate: (updates: Partial<ProShopWorkflowSettings>) => void;
}

export const WorkflowSettingsTab: React.FC<WorkflowSettingsTabProps> = ({
                                                                            settings,
                                                                            onUpdate
                                                                        }) => {
    const updatePriorityLevels = (index: number, value: string) => {
        const newLevels = [...settings.priorityLevels];
        newLevels[index] = value;
        onUpdate({ priorityLevels: newLevels });
    };

    const addPriorityLevel = () => {
        onUpdate({
            priorityLevels: [...settings.priorityLevels, 'New Priority']
        });
    };

    const removePriorityLevel = (index: number) => {
        const newLevels = settings.priorityLevels.filter((_, i) => i !== index);
        onUpdate({ priorityLevels: newLevels });
    };

    return (
        <div className="space-y-8">
            {/* Work Order Processing */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Work Order Processing
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.requireCustomerApproval}
                            onChange={(e) => onUpdate({ requireCustomerApproval: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Require Customer Approval</span>
                            <p className="text-xs text-gray-500">Customer must approve work orders before technicians can start</p>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableWorkOrderTracking}
                            onChange={(e) => onUpdate({ enableWorkOrderTracking: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Work Order Tracking</span>
                            <p className="text-xs text-gray-500">Track work order status and progress updates</p>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableCustomerNotifications}
                            onChange={(e) => onUpdate({ enableCustomerNotifications: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Customer Notifications</span>
                            <p className="text-xs text-gray-500">Automatically notify customers of work order updates</p>
                        </div>
                    </label>

                    <div className="mt-6">
                        <Input
                            label="Work Order Number Format"
                            value={settings.workOrderNumberFormat}
                            onChange={(value) => onUpdate({ workOrderNumberFormat: value })}
                            placeholder="WO-{YYYY}{MM}{DD}-{###}"
                        />
                    </div>
                </div>
            </div>

            {/* Quality Control */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
                    Quality Control
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableQualityChecks}
                            onChange={(e) => onUpdate({ enableQualityChecks: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Quality Checks</span>
                            <p className="text-xs text-gray-500">Require quality verification before completing work orders</p>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.requireSupervisorApproval}
                            onChange={(e) => onUpdate({ requireSupervisorApproval: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Require Supervisor Approval</span>
                            <p className="text-xs text-gray-500">Supervisor must approve completed work orders</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Staff Management */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Staff Management
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.autoAssignTechnicians}
                            onChange={(e) => onUpdate({ autoAssignTechnicians: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Auto-Assign Technicians</span>
                            <p className="text-xs text-gray-500">Automatically assign work orders to available technicians</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Pricing */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Default Labor Rate ($/hour)"
                        type="number"
                        value={settings.defaultLaborRate.toString()}
                        onChange={(value) => onUpdate({ defaultLaborRate: parseFloat(value) || 0 })}
                        min="0"
                        step="0.50"
                        required
                    />
                </div>
            </div>

            {/* Inventory */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-blue-600" />
                    Inventory
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.enableInventoryTracking}
                            onChange={(e) => onUpdate({ enableInventoryTracking: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">Enable Inventory Tracking</span>
                            <p className="text-xs text-gray-500">Track inventory levels and usage in work orders</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Priority Levels */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Levels</h3>
                <div className="space-y-3">
                    {settings.priorityLevels.map((level, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <Input
                                value={level}
                                onChange={(value) => updatePriorityLevels(index, value)}
                                placeholder="Priority level name"
                                className="flex-1"
                            />
                            {settings.priorityLevels.length > 1 && (
                                <button
                                    onClick={() => removePriorityLevel(index)}
                                    className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addPriorityLevel}
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                    >
                        + Add Priority Level
                    </button>
                </div>
            </div>
        </div>
    );
};