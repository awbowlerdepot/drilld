import { useState, useEffect } from 'react';
import { Location } from '../types';
import { mockLocations } from '../data/mockData';

export const useLocations = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLocations(mockLocations);
            setLoading(false);
        }, 500);
    }, []);

    const addLocation = (location: Omit<Location, 'id'>) => {
        const newLocation: Location = {
            ...location,
            id: Date.now().toString()
        };
        setLocations(prev => [...prev, newLocation]);
        return newLocation;
    };

    const updateLocation = (id: string, updates: Partial<Location>) => {
        setLocations(prev =>
            prev.map(location =>
                location.id === id ? { ...location, ...updates } : location
            )
        );
    };

    const deleteLocation = (id: string) => {
        setLocations(prev => prev.filter(location => location.id !== id));
    };

    const deactivateLocation = (id: string) => {
        updateLocation(id, { active: false });
    };

    const activateLocation = (id: string) => {
        updateLocation(id, { active: true });
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

    const getLocationsByProShop = (proshopId: string) => {
        return locations.filter(location => location.proshopID === proshopId);
    };

    const searchLocations = (searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        return locations.filter(location =>
            location.name.toLowerCase().includes(term) ||
            location.address?.toLowerCase().includes(term) ||
            location.phone?.toLowerCase().includes(term)
        );
    };

    const getLocationsByEquipment = (equipmentType: string) => {
        return locations.filter(location =>
            location.active &&
            location.equipmentInfo &&
            Object.keys(location.equipmentInfo).some(key =>
                key.toLowerCase().includes(equipmentType.toLowerCase()) ||
                (typeof location.equipmentInfo![key] === 'string' &&
                    location.equipmentInfo![key].toLowerCase().includes(equipmentType.toLowerCase()))
            )
        );
    };

    const getLocationCapacity = (locationId: string, employees: Array<{id: string, locations: string[], active: boolean}>) => {
        const location = getLocationById(locationId);
        if (!location) return { capacity: 0, utilization: 0 };

        const assignedEmployees = employees.filter(emp =>
            emp.active && emp.locations.includes(locationId)
        ).length;

        // Estimate capacity based on equipment and staff
        const equipmentCount = location.equipmentInfo ? Object.keys(location.equipmentInfo).length : 1;
        const baseCapacity = Math.min(equipmentCount * 8, assignedEmployees * 6); // 8 hours per equipment, 6 jobs per employee per day

        return {
            capacity: baseCapacity,
            assignedEmployees,
            equipmentCount
        };
    };

    const getLocationWorkload = (locationId: string, workOrders: Array<{locationID: string, workDate: string}>) => {
        const today = new Date();
        const thisMonth = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            return wo.locationID === locationId &&
                workDate.getMonth() === today.getMonth() &&
                workDate.getFullYear() === today.getFullYear();
        });

        const thisWeek = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return wo.locationID === locationId && workDate >= weekAgo;
        });

        const today_orders = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            return wo.locationID === locationId &&
                workDate.toDateString() === today.toDateString();
        });

        return {
            today: today_orders.length,
            thisWeek: thisWeek.length,
            thisMonth: thisMonth.length,
            total: workOrders.filter(wo => wo.locationID === locationId).length
        };
    };

    const getLocationStats = (workOrders: Array<{locationID: string, totalCost?: number}> = []) => {
        const activeCount = locations.filter(l => l.active).length;
        const inactiveCount = locations.filter(l => !l.active).length;

        const locationWorkload = locations.reduce((acc, location) => {
            const orders = workOrders.filter(wo => wo.locationID === location.id);
            acc[location.id] = {
                name: location.name,
                orderCount: orders.length,
                revenue: orders.reduce((sum, wo) => sum + (wo.totalCost || 0), 0)
            };
            return acc;
        }, {} as Record<string, {name: string, orderCount: number, revenue: number}>);

        const equipmentInventory = locations.reduce((acc, location) => {
            if (location.active && location.equipmentInfo) {
                Object.keys(location.equipmentInfo).forEach(equipment => {
                    acc[equipment] = (acc[equipment] || 0) + 1;
                });
            }
            return acc;
        }, {} as Record<string, number>);

        const totalRevenue = Object.values(locationWorkload).reduce((sum, loc) => sum + loc.revenue, 0);
        const totalOrders = Object.values(locationWorkload).reduce((sum, loc) => sum + loc.orderCount, 0);

        return {
            total: locations.length,
            active: activeCount,
            inactive: inactiveCount,
            locationWorkload,
            equipmentInventory,
            totalRevenue,
            totalOrders,
            avgRevenuePerLocation: activeCount > 0 ? totalRevenue / activeCount : 0
        };
    };

    const isLocationOpenToday = (locationId: string): boolean => {
        const location = getLocationById(locationId);
        if (!location || !location.hours) return false;

        const today = new Date().getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today];

        const todayHours = location.hours[todayName];
        return todayHours !== 'Closed' && todayHours !== undefined;
    };

    const getCurrentLocationHours = (locationId: string): string => {
        const location = getLocationById(locationId);
        if (!location || !location.hours) return 'Hours not available';

        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today.getDay()];

        return location.hours[todayName] || 'Closed';
    };

    const getLocationsByDayOpen = (dayOfWeek: string) => {
        return locations.filter(location =>
            location.active &&
            location.hours &&
            location.hours[dayOfWeek.toLowerCase()] &&
            location.hours[dayOfWeek.toLowerCase()] !== 'Closed'
        );
    };

    const validateLocationHours = (hours: Record<string, string>): boolean => {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)\s?-\s?([01]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)$|^Closed$/i;

        return Object.entries(hours).every(([day, time]) =>
            validDays.includes(day.toLowerCase()) &&
            (time === 'Closed' || timeRegex.test(time))
        );
    };

    const getLocationDistance = (locationId: string, userLocation?: {lat: number, lng: number}): number | null => {
        // This would typically integrate with a geocoding service
        // For now, return null to indicate distance calculation not available
        return null;
    };

    const getLocationsByProximity = (userLocation: {lat: number, lng: number}, maxDistance: number = 25) => {
        // This would typically use actual coordinates and distance calculation
        // For now, return all active locations as a placeholder
        return getActiveLocations();
    };

    const hasLocationEquipment = (locationId: string, equipmentType: string): boolean => {
        const location = getLocationById(locationId);
        if (!location || !location.equipmentInfo) return false;

        return Object.keys(location.equipmentInfo).some(key =>
            key.toLowerCase().includes(equipmentType.toLowerCase())
        );
    };

    const getLocationEquipmentList = (locationId: string): string[] => {
        const location = getLocationById(locationId);
        if (!location || !location.equipmentInfo) return [];

        return Object.entries(location.equipmentInfo).map(([key, value]) =>
            `${key}: ${value}`
        );
    };

    return {
        locations,
        loading,
        error,
        addLocation,
        updateLocation,
        deleteLocation,
        deactivateLocation,
        activateLocation,
        getLocationById,
        getActiveLocations,
        getInactiveLocations,
        getLocationsByProShop,
        searchLocations,
        getLocationsByEquipment,
        getLocationCapacity,
        getLocationWorkload,
        getLocationStats,
        isLocationOpenToday,
        getCurrentLocationHours,
        getLocationsByDayOpen,
        validateLocationHours,
        getLocationDistance,
        getLocationsByProximity,
        hasLocationEquipment,
        getLocationEquipmentList
    };
};