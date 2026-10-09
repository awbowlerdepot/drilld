import { useCallback, useEffect, useState } from 'react';
import { Location } from '../types';
import { mockLocations } from '../data/mockLocationData';
import { apiEnabled } from '../services/config';
import { locationsService } from '../services/locationsService';

type LocationFields = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * The company's locations. Reads and writes through the REST API when signed
 * in; otherwise (local development without auth) uses mock data. Add and
 * update return promises and reject if the API refuses. Locations are never
 * deleted (they hold history); they're deactivated.
 */
export const useLocations = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = apiEnabled
            ? locationsService.list()
            : new Promise<Location[]>(resolve => setTimeout(() => resolve(mockLocations), 300));
        load
            .then(result => { if (!cancelled) setLocations(result); })
            .catch((err: Error) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const addLocation = useCallback(async (locationData: LocationFields) => {
        const now = new Date().toISOString();
        const created: Location = apiEnabled
            ? await locationsService.create(locationData)
            : { ...locationData, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        setLocations(prev => [...prev, created]);
        return created;
    }, []);

    const updateLocation = useCallback(async (id: string, updates: Partial<LocationFields>) => {
        const updated = apiEnabled ? await locationsService.update(id, updates) : null;
        setLocations(prev => prev.map(location => (location.id !== id ? location
            : updated ?? { ...location, ...updates, updatedAt: new Date().toISOString() })));
    }, []);

    return { locations, loading, error, addLocation, updateLocation };
};
