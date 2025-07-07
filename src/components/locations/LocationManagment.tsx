import React, { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Location } from '../../types';
import { useLocations } from '../../hooks/useLocations';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationForm } from './LocationForm';
import { LocationList } from './LocationList';
import { LocationStats } from './LocationStats';

interface LocationManagementProps {
    searchTerm: string;
    proshopID: string;
}

export const LocationManagement: React.FC<LocationManagementProps> = ({
                                                                          searchTerm,
                                                                          proshopID
                                                                      }) => {
    const {
        locations,
        loading,
        addLocation,
        updateLocation,
        deleteLocation,
        getLocationStats
    } = useLocations();

    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '', // active, inactive, all
        hasEquipment: false
    });
    const [showFilters, setShowFilters] = useState(false);

    const effectiveSearchTerm = searchTerm || localSearchTerm;

    // Filter locations
    const filteredLocations = useMemo(() => {
        return locations.filter(location => {
            // Text search
            const matchesSearch = !effectiveSearchTerm ||
                location.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
                location.address?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
                location.phone?.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

            // Status filter
            const matchesStatus = !filters.status ||
                (filters.status === 'active' && location.active) ||
                (filters.status === 'inactive' && !location.active);

            // Equipment filter
            const matchesEquipment = !filters.hasEquipment ||
                (location.equipmentInfo?.equipment && location.equipmentInfo.equipment.length > 0);

            return matchesSearch && matchesStatus && matchesEquipment;
        });
    }, [locations, effectiveSearchTerm, filters]);

    const getLocationStatistics = (locationId: string) => {
        // Use the hook's built-in stats method
        return getLocationStats(locationId);
    };

    const handleSave = (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (editingLocation) {
                updateLocation(editingLocation.id, locationData);
            } else {
                addLocation(locationData);
            }
            setShowForm(false);
            setEditingLocation(null);
        } catch (error) {
            console.error('Error saving location:', error);
            // Handle error (show toast, etc.)
        }
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        setShowForm(true);
    };

    const handleDelete = (locationId: string) => {
        if (window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
            try {
                deleteLocation(locationId);
            } catch (error) {
                console.error('Error deleting location:', error);
                // Handle error
            }
        }
    };

    const handleToggleActive = (locationId: string, active: boolean) => {
        try {
            updateLocation(locationId, { active });
        } catch (error) {
            console.error('Error updating location status:', error);
            // Handle error
        }
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            hasEquipment: false
        });
        setLocalSearchTerm('');
    };

    const hasActiveFilters = filters.status || filters.hasEquipment || localSearchTerm;

    if (loading) {
        return <div className="flex justify-center py-8">Loading locations...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
                    <p className="text-gray-600">Manage your pro shop locations and equipment</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                </Button>
            </div>

            {/* Stats */}
            <LocationStats locations={locations} />

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search locations..."
                            value={localSearchTerm}
                            onChange={setLocalSearchTerm}
                            className="w-full"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {Object.values(filters).filter(Boolean).length + (localSearchTerm ? 1 : 0)}
                            </span>
                        )}
                    </Button>
                </div>

                {showFilters && (
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Locations</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    id="hasEquipment"
                                    checked={filters.hasEquipment}
                                    onChange={(e) => setFilters(prev => ({ ...prev, hasEquipment: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="hasEquipment" className="ml-2 text-sm text-gray-900">
                                    Has Equipment
                                </label>
                            </div>
                            <div className="flex items-end">
                                {hasActiveFilters && (
                                    <Button
                                        variant="secondary"
                                        onClick={clearFilters}
                                        className="text-sm"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                {filteredLocations.length !== locations.length && (
                    <div className="text-sm text-gray-600 mt-4">
                        Showing {filteredLocations.length} of {locations.length} locations
                    </div>
                )}
            </div>

            {/* Location List */}
            <LocationList
                locations={filteredLocations}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                getLocationStats={getLocationStatistics}
            />

            {/* Location Form Modal */}
            {showForm && (
                <LocationForm
                    location={editingLocation || undefined}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingLocation(null);
                    }}
                    proshopID={proshopID}
                />
            )}
        </div>
    );
};