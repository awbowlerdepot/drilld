import React from 'react';
import { Location } from '../../types';
import {
    MapPin,
    Phone,
    Clock,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Wrench,
    Users
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LocationListProps {
    locations: Location[];
    onEdit: (location: Location) => void;
    onDelete: (locationId: string) => void;
    onToggleActive: (locationId: string, active: boolean) => void;
    getLocationStats?: (locationId: string) => {
        totalWorkOrders: number;
        activeEmployees: number;
    };
}

export const LocationList: React.FC<LocationListProps> = ({
                                                              locations,
                                                              onEdit,
                                                              onDelete,
                                                              onToggleActive,
                                                              getLocationStats
                                                          }) => {
    const formatHours = (hours?: Record<string, string>) => {
        if (!hours) return 'Hours not set';

        const today = new Date().toLocaleString().toLocaleLowerCase().slice(0, 3);
        const dayMap: Record<string, string> = {
            sun: 'sunday',
            mon: 'monday',
            tue: 'tuesday',
            wed: 'wednesday',
            thu: 'thursday',
            fri: 'friday',
            sat: 'saturday'
        };

        const currentDay = dayMap[today];
        return currentDay && hours[currentDay] ? hours[currentDay] : 'Closed';
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'excellent': return 'bg-green-100 text-green-800';
            case 'good': return 'bg-blue-100 text-blue-800';
            case 'fair': return 'bg-yellow-100 text-yellow-800';
            case 'needs_repair': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (locations.length === 0) {
        return (
            <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                <p className="text-gray-500">Add your first location to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {locations.map((location) => {
                const stats = getLocationStats?.(location.id) || { totalWorkOrders: 0, activeEmployees: 0 };
                const equipmentList = location.equipmentInfo?.equipment || [];

                return (
                    <div
                        key={location.id}
                        className={`border rounded-lg p-6 transition-all ${
                            location.active
                                ? 'border-gray-200 bg-white hover:shadow-md'
                                : 'border-gray-200 bg-gray-50 opacity-75'
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {location.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            location.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {location.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {location.address && (
                                    <p className="text-gray-600 flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {location.address}
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onEdit(location)}
                                    className="p-2"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onToggleActive(location.id, !location.active)}
                                    className="p-2"
                                >
                                    {location.active ?
                                        <PowerOff className="w-4 h-4" /> :
                                        <Power className="w-4 h-4" />
                                    }
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onDelete(location.id)}
                                    className="p-2 text-red-600 hover:text-red-800"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                            {location.phone && (
                                <p className="text-gray-600 flex items-center">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {location.phone}
                                </p>
                            )}
                            <p className="text-gray-600 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                Today: {formatHours(location.hours)}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-1">
                                    <Wrench className="w-4 h-4 text-gray-600 mr-1" />
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {stats.totalWorkOrders}
                                </div>
                                <div className="text-xs text-gray-600">Work Orders</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-1">
                                    <Users className="w-4 h-4 text-gray-600 mr-1" />
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {stats.activeEmployees}
                                </div>
                                <div className="text-xs text-gray-600">Active Staff</div>
                            </div>
                        </div>

                        {/* Equipment Summary */}
                        {equipmentList.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                    <Wrench className="w-4 h-4 mr-1" />
                                    Equipment ({equipmentList.length} items)
                                </h4>
                                <div className="space-y-1">
                                    {equipmentList.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                {item.name} {item.model && `(${item.model})`}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}
                                            >
                                                {item.condition.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                    {equipmentList.length > 3 && (
                                        <p className="text-xs text-gray-500">
                                            +{equipmentList.length - 3} more items
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};