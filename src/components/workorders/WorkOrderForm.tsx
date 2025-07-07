import React, { useState, useEffect } from 'react';
import { WorkOrder, BowlingBall, DrillSheet, Employee, Location } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Calendar, Clock, User, MapPin, Wrench, DollarSign, Camera } from 'lucide-react';

interface WorkOrderFormProps {
    workOrder?: WorkOrder;
    prefilledBallID?: string;
    prefilledDrillSheetID?: string;
    balls: BowlingBall[];
    drillSheets: DrillSheet[];
    employees: Employee[];
    locations: Location[];
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
        warrantyPeriod: workOrder?.warrantyPeriod?.toString() || '30',
        beforePhotos: workOrder?.beforePhotos || [],
        afterPhotos: workOrder?.afterPhotos || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculatedCost, setCalculatedCost] = useState(0);

    // Filter drill sheets based on selected ball's customer
    const availableDrillSheets = React.useMemo(() => {
        if (!formData.ballID) return drillSheets;
        const selectedBall = balls.find(b => b.id === formData.ballID);
        if (!selectedBall) return drillSheets;
        return drillSheets.filter(ds => ds.customerID === selectedBall.customerID);
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
                totalCost: calculatedCost,
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

    // Helper function to get drill sheet details for display
    const getDrillSheetInfo = (drillSheet: DrillSheet) => {
        const thumbInfo = drillSheet.holes.thumb?.enabled ? 'With Thumb' : 'No Thumb';
        const spanInfo = drillSheet.spans.thumbToMiddle.fitSpan
            ? `${drillSheet.spans.thumbToMiddle.fitSpan}"`
            : 'Custom spans';
        return `${thumbInfo} | ${spanInfo}`;
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Wrench className="w-5 h-5 mr-2" />
                {workOrder ? 'Edit Work Order' : 'Create Work Order'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ball and Drill Sheet Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bowling Ball *
                        </label>
                        <Select
                            value={formData.ballID}
                            onChange={(value) => updateField('ballID', value)}
                            error={errors.ballID}
                        >
                            <option value="">Select a bowling ball...</option>
                            {balls.map(ball => (
                                <option key={ball.id} value={ball.id}>
                                    {ball.manufacturer} {ball.model} - {ball.weight}lbs
                                </option>
                            ))}
                        </Select>
                        {selectedBall && (
                            <p className="text-sm text-gray-500 mt-1">
                                Status: {selectedBall.status} | Serial: {selectedBall.serialNumber || 'N/A'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Drill Sheet *
                        </label>
                        <Select
                            value={formData.drillSheetID}
                            onChange={(value) => updateField('drillSheetID', value)}
                            error={errors.drillSheetID}
                            disabled={!formData.ballID}
                        >
                            <option value="">Select a drill sheet...</option>
                            {availableDrillSheets.map(sheet => (
                                <option key={sheet.id} value={sheet.id}>
                                    {sheet.name} - {sheet.gripStyle}
                                </option>
                            ))}
                        </Select>
                        {selectedDrillSheet && (
                            <p className="text-sm text-gray-500 mt-1">
                                Grip: {selectedDrillSheet.gripStyle} | {getDrillSheetInfo(selectedDrillSheet)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Drill Sheet Details Preview */}
                {selectedDrillSheet && (
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Drill Sheet Specifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Thumb to Middle:</span>
                                <p className="font-medium">
                                    {selectedDrillSheet.spans.thumbToMiddle.fitSpan || 'Custom'}
                                    {selectedDrillSheet.spans.thumbToMiddle.fitSpan && '"'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Thumb to Ring:</span>
                                <p className="font-medium">
                                    {selectedDrillSheet.spans.thumbToRing.fitSpan || 'Custom'}
                                    {selectedDrillSheet.spans.thumbToRing.fitSpan && '"'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Bridge:</span>
                                <p className="font-medium">
                                    {selectedDrillSheet.bridge.distance}"
                                </p>
                            </div>
                        </div>
                        {selectedDrillSheet.specialNotes && (
                            <div className="mt-2">
                                <span className="text-gray-600">Special Notes:</span>
                                <p className="text-sm text-gray-700 mt-1">{selectedDrillSheet.specialNotes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Work Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Type *
                        </label>
                        <Select
                            value={formData.workType}
                            onChange={(value) => updateField('workType', value)}
                        >
                            <option value="INITIAL_DRILL">Initial Drill</option>
                            <option value="PLUG_REDRILL">Plug & Redrill</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="SURFACE_ADJUSTMENT">Surface Adjustment</option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                        </label>
                        <Select
                            value={formData.locationID}
                            onChange={(value) => updateField('locationID', value)}
                            error={errors.locationID}
                        >
                            <option value="">Select location...</option>
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technician
                        </label>
                        <Select
                            value={formData.performedByEmployeeID}
                            onChange={(value) => updateField('performedByEmployeeID', value)}
                        >
                            <option value="">Select technician...</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.firstName} {employee.lastName} - {employee.role}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Date *
                        </label>
                        <Input
                            type="date"
                            value={formData.workDate}
                            onChange={(e) => updateField('workDate', e.target.value)}
                            error={errors.workDate}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                        </label>
                        <Input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => updateField('startTime', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                        </label>
                        <Input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => updateField('endTime', e.target.value)}
                            error={errors.endTime}
                        />
                    </div>
                </div>

                {/* Cost Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Cost Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Labor Hours
                            </label>
                            <Input
                                type="number"
                                step="0.25"
                                min="0"
                                value={formData.laborHours}
                                onChange={(e) => updateField('laborHours', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Labor Cost ($)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.laborCost}
                                onChange={(e) => updateField('laborCost', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Materials Cost ($)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.materialsCost}
                                onChange={(e) => updateField('materialsCost', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total Cost ($)
                            </label>
                            <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-medium">
                                ${calculatedCost.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes and Quality */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Notes
                        </label>
                        <Textarea
                            value={formData.workNotes}
                            onChange={(e) => updateField('workNotes', e.target.value)}
                            placeholder="Describe the work performed..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Notes
                        </label>
                        <Textarea
                            value={formData.specialNotes}
                            onChange={(e) => updateField('specialNotes', e.target.value)}
                            placeholder="Any special instructions or customer requests..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deviations from Specification
                        </label>
                        <Textarea
                            value={formData.deviationsFromSpec}
                            onChange={(e) => updateField('deviationsFromSpec', e.target.value)}
                            placeholder="Note any deviations from the drill sheet specifications..."
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Satisfaction (1-10)
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.customerSatisfaction}
                                onChange={(e) => updateField('customerSatisfaction', e.target.value)}
                                error={errors.customerSatisfaction}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Warranty Period (days)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.warrantyPeriod}
                                onChange={(e) => updateField('warrantyPeriod', e.target.value)}
                            />
                        </div>

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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quality Notes
                            </label>
                            <Textarea
                                value={formData.qualityNotes}
                                onChange={(e) => updateField('qualityNotes', e.target.value)}
                                placeholder="Quality inspection notes..."
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                {/* Photo Upload Placeholders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Before Photos
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-2">
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-500 font-medium"
                                >
                                    Upload photos
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 10MB each
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            After Photos
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-2">
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-500 font-medium"
                                >
                                    Upload photos
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 10MB each
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit">
                        {workOrder ? 'Update Work Order' : 'Create Work Order'}
                    </Button>
                </div>
            </form>
        </div>
    );
};