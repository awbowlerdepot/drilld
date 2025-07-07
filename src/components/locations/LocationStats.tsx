import React from 'react';
import { Location } from '../../types';
import { MapPin, Power, PowerOff, Wrench, Clock } from 'lucide-react';

interface LocationStatsProps {
    locations: Location[];
}

export const LocationStats: React.FC<LocationStatsProps> = ({ locations }) => {
    const stats = {
        total: locations.length,
        active: locations.filter(l => l.active).length,
        inactive: locations.filter(l => !l.active).length,
        withEquipment: locations.filter(l =>
            l.equipmentInfo?.equipment && l.equipmentInfo.equipment.length > 0
        ).length,
        openToday: locations.filter(l => {
            if (!l.hours) return false;
            const today = new Date().toLocaleString().toLowerCase().slice(0, 3);
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
            return currentDay && l.hours[currentDay] && l.hours[currentDay] !== 'Closed';
        }).length
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                    <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Locations</div>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Power className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-sm text-gray-600">Active</div>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                    <PowerOff className="w-8 h-8 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
                <div className="text-sm text-gray-600">Inactive</div>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Wrench className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.withEquipment}</div>
                <div className="text-sm text-gray-600">With Equipment</div>
            </div>

            <div className="bg-white rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                    <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.openToday}</div>
                <div className="text-sm text-gray-600">Open Today</div>
            </div>
        </div>
    );
};