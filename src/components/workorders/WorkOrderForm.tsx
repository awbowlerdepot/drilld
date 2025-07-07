import React, { useState, useEffect, useMemo } from 'react';
import { WorkOrder, BowlingBall, DrillSheet, Employee, Location, Customer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { X, Wrench, DollarSign } from 'lucide-react';

interface WorkOrderFormProps {
    workOrder?: WorkOrder;
    prefilledBallID?: string;
    prefilledDrillSheetID?: string;
    balls: BowlingBall[];
    drillSheets: DrillSheet[];
    employees: Employee[];
    locations: Location[];
    customers: Customer[];
    onSave: (workOrder: Omit<WorkOrder, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
                                                                workOrder,
                                                                prefilledBallID,
                                                                prefilledDrillSheetID,
                                                                balls,
                                                                drillSheets,
                                                                employees,
                                                                locations,
                                                                customers,
                                                                onSave,
                                                                onCancel
                                                            }) => {
    const [formData, setFormData] = useState({
        ballID: workOrder?.ballID || prefilledBallID || '',
        drillSheetID: workOrder?.drillSheetID || prefilledDrillSheetID || '',
        locationID: workOrder?.locationID || '',
        performedByEmployeeID: workOrder?.performedByEmployeeID || '',
        workType: workOrder?.workType || 'INITIAL_DRILL' as const,
        workDate: workOrder?.workDate ? workOrder.workDate.split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: workOrder?.startTime || '',
        endTime: workOrder?.endTime || '',
        laborHours: workOrder?.laborHours?.toString() || '',
        laborCost: workOrder?.laborCost?.toString() || '',
        materialsCost: workOrder?.materialsCost?.toString() || '',
        workNotes: workOrder?.workNotes || '',
        specialNotes: workOrder?.specialNotes || '',
        deviationsFromSpec: workOrder?.deviationsFromSpec || '',
        customerSatisfaction: workOrder?.customerSatisfaction?.toString() || '',
        qualityCheck: workOrder?.qualityCheck ?? false,
        qualityNotes: workOrder?.qualityNotes || '',
        warrantyPeriod: workOrder?.warrantyPeriod?.toString() || '90',
        beforePhotos: workOrder?.beforePhotos || [],
        afterPhotos: workOrder?.afterPhotos || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculatedCost, setCalculatedCost] = useState(0);

    // Filter drill sheets based on selected ball's customer
    const availableDrillSheets = useMemo(() => {
        if (!formData.ballID) return drillSheets;
        const selectedBall = balls.find(b => b.id === formData.ballID);
        if (!selectedBall) return drillSheets;
        return drillSheets.filter(ds =>
            ds.customerID === selectedBall.customerID || ds.isTemplate
        );
    }, [formData.ballID, balls, drillSheets]);

    // Calculate total cost when labor or materials change
    useEffect(() => {
        const labor = parseFloat(formData.laborCost) || 0;
        const materials = parseFloat(formData.materialsCost) || 0;
        setCalculatedCost(labor + materials);
    }, [formData.laborCost, formData.materialsCost]);

    // Calculate labor cost when hours and employee change
    useEffect(() => {
        if (formData.laborHours && formData.performedByEmployeeID) {
            const employee = employees.find(e => e.id === formData.performedByEmployeeID);
            if (employee?.hourlyRate) {
                const hours = parseFloat(formData.laborHours) || 0;
                const cost = hours * employee.hourlyRate;
                setFormData(prev => ({ ...prev, laborCost: cost.toFixed(2) }));
            }
        }
    }, [formData.laborHours, formData.performedByEmployeeID, employees]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.ballID) {
            newErrors.ballID = 'Bowling ball is required';
        }

        if (!formData.drillSheetID) {
            newErrors.drillSheetID = 'Drill sheet is required';
        }

        if (!formData.locationID) {
            newErrors.locationID = 'Location is required';
        }

        if (!formData.workDate) {
            newErrors.workDate = 'Work date is required';
        }

        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
            newErrors.endTime = 'End time must be after start time';
        }

        if (formData.customerSatisfaction &&
            (parseInt(formData.customerSatisfaction) < 1 || parseInt(formData.customerSatisfaction) > 10)) {
            newErrors.customerSatisfaction = 'Customer satisfaction must be between 1 and 10';
        }

        if (formData.laborHours && parseFloat(formData.laborHours) < 0) {
            newErrors.laborHours = 'Labor hours cannot be negative';
        }

        if (formData.laborCost && parseFloat(formData.laborCost) < 0) {
            newErrors.laborCost = 'Labor cost cannot be negative';
        }

        if (formData.materialsCost && parseFloat(formData.materialsCost) < 0) {
            newErrors.materialsCost = 'Materials cost cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            onSave({
                ...formData,
                laborHours: formData.laborHours ? parseFloat(formData.laborHours) : undefined,
                laborCost: formData.laborCost ? parseFloat(formData.laborCost) : undefined,
                materialsCost: formData.materialsCost ? parseFloat(formData.materialsCost) : undefined,
                totalCost: calculatedCost > 0 ? calculatedCost : undefined,
                customerSatisfaction: formData.customerSatisfaction ? parseInt(formData.customerSatisfaction) : undefined,
                warrantyPeriod: formData.warrantyPeriod ? parseInt(formData.warrantyPeriod) : undefined
            });
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const selectedBall = balls.find(b => b.id === formData.ballID);
    const selectedDrillSheet = drillSheets.find(ds => ds.id === formData.drillSheetID);
    const selectedCustomer = selectedBall ? customers.find(c => c.id === selectedBall.customerID) : undefined;

    // Helper function to get drill sheet details for display
    const getDrillSheetInfo = (drillSheet: DrillSheet) => {
        const thumbInfo = drillSheet.holes.thumb?.enabled ? 'With Thumb' : 'No Thumb';
        const spanInfo = drillSheet.spans.thumbToMiddle.fitSpan
            ? `${drillSheet.spans.thumbToMiddle.fitSpan}"`
            : 'Custom spans';
        return `${thumbInfo} | ${spanInfo}`;
    };

    // Helper function to format employee display
    const getEmployeeDisplay = (employee: Employee) => {
        const roleDisplay = employee.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        return `${employee.firstName} ${employee.lastName} - ${roleDisplay}`;
    };

    // Helper function to format ball display
    const getBallDisplay = (ball: BowlingBall) => {
        const customer = customers.find(c => c.id === ball.customerID);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
        return `${ball.manufacturer} ${ball.model} (${ball.weight}lbs) - ${customerName}`;
    };

    // Generate options for Select components
    const ballOptions = balls.map(ball => ({
        value: ball.id,
        label: getBallDisplay(ball)
    }));

    const drillSheetOptions = availableDrillSheets.map(sheet => ({
        value: sheet.id,
        label: `${sheet.name} ${sheet.isTemplate ? '(Template)' : ''} - ${getDrillSheetInfo(sheet)}`
    }));

    const workTypeOptions = [
        { value: 'INITIAL_DRILL', label: 'Initial Drill' },
        { value: 'PLUG_REDRILL', label: 'Plug & Redrill' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
        { value: 'SURFACE_ADJUSTMENT', label: 'Surface Adjustment' }
    ];

    const locationOptions = locations.filter(loc => loc.active).map(location => ({
        value: location.id,
        label: location.name
    }));

    const employeeOptions = employees.filter(emp => emp.active).map(employee => ({
        value: employee.id,
        label: getEmployeeDisplay(employee)
    }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Wrench className="w-5 h-5 mr-2" />
                        {workOrder ? 'Edit Work Order' : 'Create Work Order'}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Ball and Drill Sheet Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Select
                                label="Bowling Ball"
                                value={formData.ballID}
                                onChange={(value) => updateField('ballID', value)}
                                options={ballOptions}
                                placeholder="Select a bowling ball"
                                required
                                error={errors.ballID}
                            />
                            {selectedBall && selectedCustomer && (
                                <p className="mt-1 text-sm text-gray-600">
                                    Customer: {selectedCustomer.firstName} {selectedCustomer.lastName}
                                </p>
                            )}
                        </div>

                        <div>
                            <Select
                                label="Drill Sheet"
                                value={formData.drillSheetID}
                                onChange={(value) => updateField('drillSheetID', value)}
                                options={drillSheetOptions}
                                placeholder="Select a drill sheet"
                                required
                                disabled={!formData.ballID}
                                error={errors.drillSheetID}
                            />
                            {selectedDrillSheet && (
                                <p className="mt-1 text-sm text-gray-600">
                                    {selectedDrillSheet.gripStyle.replace('_', ' ')} grip
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Work Type and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Select
                            label="Work Type"
                            value={formData.workType}
                            onChange={(value) => updateField('workType', value)}
                            options={workTypeOptions}
                            required
                        />

                        <Select
                            label="Location"
                            value={formData.locationID}
                            onChange={(value) => updateField('locationID', value)}
                            options={locationOptions}
                            placeholder="Select location"
                            required
                            error={errors.locationID}
                        />

                        <Select
                            label="Technician"
                            value={formData.performedByEmployeeID}
                            onChange={(value) => updateField('performedByEmployeeID', value)}
                            options={employeeOptions}
                            placeholder="Select technician"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Work Date"
                            type="text"
                            value={formData.workDate}
                            onChange={(value) => updateField('workDate', value)}
                            required
                            error={errors.workDate}
                        />

                        <Input
                            label="Start Time"
                            type="text"
                            value={formData.startTime}
                            onChange={(value) => updateField('startTime', value)}
                        />

                        <Input
                            label="End Time"
                            type="text"
                            value={formData.endTime}
                            onChange={(value) => updateField('endTime', value)}
                            error={errors.endTime}
                        />
                    </div>

                    {/* Cost Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Cost Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                label="Labor Hours"
                                type="number"
                                step="0.25"
                                min="0"
                                value={formData.laborHours}
                                onChange={(value) => updateField('laborHours', value)}
                                placeholder="0.00"
                                error={errors.laborHours}
                            />

                            <Input
                                label="Labor Cost ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.laborCost}
                                onChange={(value) => updateField('laborCost', value)}
                                placeholder="0.00"
                                error={errors.laborCost}
                            />

                            <Input
                                label="Materials Cost ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.materialsCost}
                                onChange={(value) => updateField('materialsCost', value)}
                                placeholder="0.00"
                                error={errors.materialsCost}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Cost ($)
                                </label>
                                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 font-medium h-10 flex items-center">
                                    {calculatedCost.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Textarea
                            label="Work Notes"
                            value={formData.workNotes}
                            onChange={(e) => updateField('workNotes', e.target.value)}
                            placeholder="Description of work performed..."
                            rows={4}
                        />

                        <Textarea
                            label="Special Notes"
                            value={formData.specialNotes}
                            onChange={(e) => updateField('specialNotes', e.target.value)}
                            placeholder="Special instructions or notes..."
                            rows={4}
                        />
                    </div>

                    {/* Deviations from Specification */}
                    <Textarea
                        label="Deviations from Specification"
                        value={formData.deviationsFromSpec}
                        onChange={(e) => updateField('deviationsFromSpec', e.target.value)}
                        placeholder="Any deviations from the drill sheet specifications..."
                        rows={3}
                    />

                    {/* Quality and Customer Satisfaction */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Quality & Satisfaction</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Customer Satisfaction (1-10)"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.customerSatisfaction}
                                onChange={(value) => updateField('customerSatisfaction', value)}
                                placeholder="Rate 1-10"
                                error={errors.customerSatisfaction}
                            />

                            <Input
                                label="Warranty Period (days)"
                                type="number"
                                min="0"
                                value={formData.warrantyPeriod}
                                onChange={(value) => updateField('warrantyPeriod', value)}
                                placeholder="90"
                            />

                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    id="qualityCheck"
                                    checked={formData.qualityCheck}
                                    onChange={(e) => updateField('qualityCheck', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="qualityCheck" className="ml-2 block text-sm text-gray-900">
                                    Quality Check Passed
                                </label>
                            </div>
                        </div>

                        {formData.qualityCheck && (
                            <div className="mt-4">
                                <Textarea
                                    label="Quality Notes"
                                    value={formData.qualityNotes}
                                    onChange={(e) => updateField('qualityNotes', e.target.value)}
                                    placeholder="Quality inspection notes..."
                                    rows={2}
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                        >
                            {workOrder ? 'Update Work Order' : 'Create Work Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};