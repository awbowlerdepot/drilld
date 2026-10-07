import { useState, useEffect } from 'react';
import { Location } from '../types';
import { getHoursForDay, isClosedHours } from '../utils/LocationHours';
import { mockLocations } from '../data/mockLocationData';
import { apiEnabled } from '../services/config';
import { locationsService } from '../services/locationsService';

type LocationFields = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * The company's locations. Reads and writes through the REST API when signed
 * in; otherwise (local development without auth) uses mock data. Add, update
 * and delete return promises and reject if the API refuses.
 */
export const useLocations = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = apiEnabled
            ? locationsService.list()
            : new Promise<Location[]>(resolve => setTimeout(() => resolve(mockLocations), 500));
        load
            .then(result => { if (!cancelled) setLocations(result); })
            .catch((err: Error) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const addLocation = async (locationData: LocationFields) => {
        const newLocation: Location = apiEnabled
            ? await locationsService.create(locationData)
            : { ...locationData, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setLocations(prev => [...prev, newLocation]);
        return newLocation;
    };

    const updateLocation = async (id: string, updates: Partial<LocationFields>) => {
        if (apiEnabled) {
            const updated = await locationsService.update(id, updates);
            setLocations(prev => prev.map(location => (location.id === id ? updated : location)));
            return;
        }
        setLocations(prev =>
            prev.map(location =>
                location.id === id
                    ? { ...location, ...updates, updatedAt: new Date().toISOString() }
                    : location
            )
        );
    };

    /** Locations hold history (drill sheets, work orders), so with the API they're deactivated, not deleted. */
    const deleteLocation = async (id: string) => {
        if (apiEnabled) throw new Error('Locations can\'t be deleted. Deactivate it instead.');
        setLocations(prev => prev.filter(location => location.id !== id));
    };

    const getLocationById = (id: string) => {
        return locations.find(location => location.id === id);
    };

    const getActiveLocations = () => {
        return locations.filter(location => location.active);
    };

    const getInactiveLocations = () => {
        return locations.filter(location => !location.active);
    };

    const getLocationsByCompany = (companyId: string) => {
        return locations.filter(location => location.companyID === companyId);
    };

    const searchLocations = (searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        return locations.filter(location =>
            location.name.toLowerCase().includes(term) ||
            location.address?.toLowerCase().includes(term) ||
            location.phone?.toLowerCase().includes(term)
        );
    };

    const getLocationStats = (locationId: string) => {
        // Mock stats generation based on location characteristics
        const location = getLocationById(locationId);
        if (!location) return { totalWorkOrders: 0, activeEmployees: 0 };

        const equipmentCount = location.equipmentInfo?.equipment?.length || 0;
        const isActive = location.active;

        return {
            totalWorkOrders: isActive ? Math.floor(Math.random() * 30) + equipmentCount * 5 : 0,
            activeEmployees: isActive ? Math.floor(Math.random() * 5) + 1 : 0
        };
    };

    const getLocationsByEquipment = (equipmentType: string) => {
        return locations.filter(location =>
            location.active &&
            location.equipmentInfo?.equipment?.some(equipment =>
                equipment.name.toLowerCase().includes(equipmentType.toLowerCase()) ||
                equipment.model.toLowerCase().includes(equipmentType.toLowerCase())
            )
        );
    };

    const getLocationCapacity = (locationId: string) => {
        const location = getLocationById(locationId);
        if (!location) return null;

        // Calculate capacity based on equipment and hours
        const equipmentCount = location.equipmentInfo?.equipment?.length || 0;
        const hoursPerDay = location.hours ?
            Object.values(location.hours).reduce((total, hours) => {
                if (hours === 'Closed' || hours.includes('Appointment') || hours.includes('Schedule')) return total;
                // Simple calculation - assumes 8 hour average for normal hours
                return total + 8;
            }, 0) / 7 : 8;

        return {
            maxWorkOrdersPerDay: Math.floor(equipmentCount * hoursPerDay / 2), // 2 hours per work order average
            equipmentCount,
            averageHoursPerDay: hoursPerDay
        };
    };

    const isLocationOpenNow = (locationId: string) => {
        const location = getLocationById(locationId);
        if (!location || !location.hours || !location.active) return false;

        const todayHours = getHoursForDay(location);
        if (!todayHours || isClosedHours(todayHours)) return false;

        // For appointment-based or special schedules, assume closed for "now" check
        if (todayHours.includes('Appointment') || todayHours.includes('Schedule')) return false;

        // Simple check - in a real app you'd parse the time ranges
        return true;
    };

    const getLocationWorkload = (locationId: string, days: number = 30) => {
        // Mock workload data
        const location = getLocationById(locationId);
        if (!location) return null;

        const workload = [];
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            workload.push({
                date: date.toISOString().split('T')[0],
                workOrders: location.active ? Math.floor(Math.random() * 8) : 0,
                revenue: location.active ? Math.floor(Math.random() * 1000) : 0
            });
        }
        return workload.reverse();
    };

    const validateLocationHours = (hours: Record<string, string>) => {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^(\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM))$|^(By Appointment|Tournament Schedule|Closed)$/i;

        return Object.entries(hours).every(([day, time]) =>
            validDays.includes(day.toLowerCase()) &&
            timeRegex.test(time)
        );
    };

    const getLocationEquipmentConditionSummary = (locationId: string) => {
        const location = getLocationById(locationId);
        if (!location?.equipmentInfo?.equipment) return null;

        const summary = {
            excellent: 0,
            good: 0,
            fair: 0,
            needs_repair: 0,
            total: location.equipmentInfo.equipment.length
        };

        location.equipmentInfo.equipment.forEach(equipment => {
            summary[equipment.condition as keyof typeof summary]++;
        });

        return summary;
    };

    return {
        locations,
        loading,
        error,
        addLocation,
        updateLocation,
        deleteLocation,
        getLocationById,
        getActiveLocations,
        getInactiveLocations,
        getLocationsByCompany,
        searchLocations,
        getLocationStats,
        getLocationsByEquipment,
        getLocationCapacity,
        isLocationOpenNow,
        getLocationWorkload,
        validateLocationHours,
        getLocationEquipmentConditionSummary
    };
};