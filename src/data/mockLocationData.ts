import { locationHoursSchema } from '../../shared/api/locationHours';
import { Location } from '../types';

// Location mock data. Hours are written the old way (free text per day) and
// read through the same upgrade the API uses.
type MockLocation = Omit<Location, 'hours'> & { hours?: Record<string, string> };

const rawLocations: MockLocation[] = [
    {
        id: '1',
        companyID: 'company1',
        name: 'Main Location - Downtown',
        address: { line1: '123 Bowling Lane', city: 'Downtown City', region: 'ST', postalCode: '12345', line2: null, country: 'US' },
        phone: '(555) 123-4567',
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
        companyID: 'company1',
        name: 'Westside Branch',
        address: { line1: '456 Strike Street', city: 'Westside', region: 'ST', postalCode: '12346', line2: null, country: 'US' },
        phone: '(555) 234-5678',
        hours: {
            monday: '10:00 AM - 8:00 PM',
            tuesday: '10:00 AM - 8:00 PM',
            wednesday: '10:00 AM - 8:00 PM',
            thursday: '10:00 AM - 8:00 PM',
            friday: '10:00 AM - 9:00 PM',
            saturday: '10:00 AM - 9:00 PM',
            sunday: '1:00 PM - 7:00 PM'
        },
        settingsOverrides: {
            taxRate: 7.25,
            workflow: { defaultLaborRate: 45 },
            notifications: { notificationEmail: 'westside@strikezoneproshop.com' }
        },
        active: true,
        createdAt: '2023-06-01T00:00:00Z',
        updatedAt: '2024-01-10T14:30:00Z'
    },
    {
        id: '3',
        companyID: 'company1',
        name: 'Mobile Service Unit',
        address: { line1: 'Various tournament locations', city: '', region: '', postalCode: '', line2: null, country: 'US' },
        phone: '(555) 345-6789',
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
        companyID: 'company1',
        name: 'Eastside Location',
        address: { line1: '789 Spare Avenue', city: 'Eastside', region: 'ST', postalCode: '12347', line2: null, country: 'US' },
        phone: '(555) 456-7890',
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
        companyID: 'company1',
        name: 'North Valley Pro Shop',
        address: { line1: '321 Pin Lane', city: 'North Valley', region: 'ST', postalCode: '12348', line2: null, country: 'US' },
        phone: '(555) 567-8901',
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

export const mockLocations: Location[] = rawLocations.map(({ hours, ...location }) => ({
    ...location,
    timezone: location.timezone ?? 'America/Denver',
    hours: hours ? locationHoursSchema.parse(hours) : undefined
}));
