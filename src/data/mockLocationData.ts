import { Location } from '../types';

// Location mock data
export const mockLocations: Location[] = [
    {
        id: '1',
        proshopID: 'proshop1',
        name: 'Main Location - Downtown',
        address: '123 Bowling Lane, Downtown City, ST 12345',
        phone: '(555) 123-4567',
        equipmentInfo: {
            equipment: [
                {
                    name: 'Innovation Xtreme Pro Shop Drill',
                    model: 'XP-2000',
                    manufacturer: 'Innovation',
                    serialNumber: 'INV-2000-1234',
                    condition: 'excellent'
                },
                {
                    name: 'Digital Pitch Gauge',
                    model: 'DPG-300',
                    manufacturer: 'Brunswick',
                    serialNumber: 'BRN-DPG-5678',
                    condition: 'good'
                },
                {
                    name: 'Ball Spinner',
                    model: 'BS-Pro',
                    manufacturer: 'Jayhawk',
                    serialNumber: 'JH-BS-9012',
                    condition: 'good'
                },
                {
                    name: 'Hole Saw Set',
                    model: 'HS-Complete',
                    manufacturer: 'Generic',
                    serialNumber: 'GEN-HS-3456',
                    condition: 'excellent'
                }
            ],
            lastUpdated: '2024-01-15T10:00:00Z'
        },
        hours: {
            monday: '9:00 AM - 9:00 PM',
            tuesday: '9:00 AM - 9:00 PM',
            wednesday: '9:00 AM - 9:00 PM',
            thursday: '9:00 AM - 9:00 PM',
            friday: '9:00 AM - 10:00 PM',
            saturday: '9:00 AM - 10:00 PM',
            sunday: '12:00 PM - 8:00 PM'
        },
        active: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        proshopID: 'proshop1',
        name: 'Westside Branch',
        address: '456 Strike Street, Westside, ST 12346',
        phone: '(555) 234-5678',
        equipmentInfo: {
            equipment: [
                {
                    name: 'Standard Drill Press',
                    model: 'DP-150',
                    manufacturer: 'Generic',
                    serialNumber: 'GEN-DP-3456',
                    condition: 'fair'
                },
                {
                    name: 'Manual Pitch Gauge',
                    model: 'MPG-100',
                    manufacturer: 'Storm',
                    serialNumber: 'STM-MPG-7890',
                    condition: 'good'
                },
                {
                    name: 'Ball Resurfacer',
                    model: 'BR-200',
                    manufacturer: 'Innovative',
                    serialNumber: 'INN-BR-1122',
                    condition: 'excellent'
                }
            ],
            lastUpdated: '2024-01-10T14:30:00Z'
        },
        hours: {
            monday: '10:00 AM - 8:00 PM',
            tuesday: '10:00 AM - 8:00 PM',
            wednesday: '10:00 AM - 8:00 PM',
            thursday: '10:00 AM - 8:00 PM',
            friday: '10:00 AM - 9:00 PM',
            saturday: '10:00 AM - 9:00 PM',
            sunday: '1:00 PM - 7:00 PM'
        },
        active: true,
        createdAt: '2023-06-01T00:00:00Z',
        updatedAt: '2024-01-10T14:30:00Z'
    },
    {
        id: '3',
        proshopID: 'proshop1',
        name: 'Mobile Service Unit',
        address: 'Various tournament locations',
        phone: '(555) 345-6789',
        equipmentInfo: {
            equipment: [
                {
                    name: 'Portable Drill Kit',
                    model: 'PDK-Mobile',
                    manufacturer: 'ProShop Solutions',
                    serialNumber: 'PSS-PDK-1122',
                    condition: 'excellent'
                },
                {
                    name: 'Battery Powered Spinner',
                    model: 'BPS-200',
                    manufacturer: 'TechBowl',
                    serialNumber: 'TB-BPS-3344',
                    condition: 'good'
                },
                {
                    name: 'Portable Pitch Meter',
                    model: 'PPM-50',
                    manufacturer: 'Digital Solutions',
                    serialNumber: 'DS-PPM-5566',
                    condition: 'excellent'
                }
            ],
            lastUpdated: '2024-01-20T09:15:00Z'
        },
        hours: {
            monday: 'By Appointment',
            tuesday: 'By Appointment',
            wednesday: 'By Appointment',
            thursday: 'By Appointment',
            friday: 'By Appointment',
            saturday: 'Tournament Schedule',
            sunday: 'Tournament Schedule'
        },
        active: true,
        createdAt: '2023-09-01T00:00:00Z',
        updatedAt: '2024-01-20T09:15:00Z'
    },
    {
        id: '4',
        proshopID: 'proshop1',
        name: 'Eastside Location',
        address: '789 Spare Avenue, Eastside, ST 12347',
        phone: '(555) 456-7890',
        equipmentInfo: {
            equipment: [
                {
                    name: 'Old Drill Press',
                    model: 'ODP-90',
                    manufacturer: 'Vintage Bowling',
                    serialNumber: 'VB-ODP-5566',
                    condition: 'needs_repair'
                },
                {
                    name: 'Basic Hole Saw',
                    model: 'BHS-10',
                    manufacturer: 'Budget Tools',
                    serialNumber: 'BT-BHS-7788',
                    condition: 'fair'
                }
            ],
            lastUpdated: '2023-12-01T16:45:00Z'
        },
        hours: {
            monday: 'Closed',
            tuesday: 'Closed',
            wednesday: 'Closed',
            thursday: 'Closed',
            friday: 'Closed',
            saturday: 'Closed',
            sunday: 'Closed'
        },
        active: false,
        createdAt: '2022-03-01T00:00:00Z',
        updatedAt: '2023-12-01T16:45:00Z'
    },
    {
        id: '5',
        proshopID: 'proshop1',
        name: 'North Valley Pro Shop',
        address: '321 Pin Lane, North Valley, ST 12348',
        phone: '(555) 567-8901',
        equipmentInfo: {
            equipment: [
                {
                    name: 'Brunswick Pro Drill',
                    model: 'BPD-500',
                    manufacturer: 'Brunswick',
                    serialNumber: 'BRN-BPD-9900',
                    condition: 'excellent'
                },
                {
                    name: 'Computer Assisted Layout System',
                    model: 'CALS-Pro',
                    manufacturer: 'TechBowl',
                    serialNumber: 'TB-CALS-1122',
                    condition: 'excellent'
                },
                {
                    name: 'Ball Oven',
                    model: 'BO-300',
                    manufacturer: 'Heat Solutions',
                    serialNumber: 'HS-BO-3344',
                    condition: 'good'
                }
            ],
            lastUpdated: '2024-01-25T11:20:00Z'
        },
        hours: {
            monday: '11:00 AM - 9:00 PM',
            tuesday: '11:00 AM - 9:00 PM',
            wednesday: '11:00 AM - 9:00 PM',
            thursday: '11:00 AM - 9:00 PM',
            friday: '11:00 AM - 10:00 PM',
            saturday: '10:00 AM - 10:00 PM',
            sunday: '12:00 PM - 8:00 PM'
        },
        active: true,
        createdAt: '2023-11-15T00:00:00Z',
        updatedAt: '2024-01-25T11:20:00Z'
    }
];