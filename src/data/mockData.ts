import { Customer, DrillSheet, BowlingBall, WorkOrder } from '../types';

export const mockCustomers: Customer[] = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '555-0123',
        dominantHand: 'RIGHT',
        preferredGripStyle: 'FINGERTIP',
        usesThumb: true,
        notes: 'Regular customer, prefers aggressive layouts',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '555-0456',
        dominantHand: 'LEFT',
        preferredGripStyle: 'CONVENTIONAL',
        usesThumb: true,
        notes: 'Left-handed bowler, tends to have sweaty hands',
        createdAt: '2024-01-20T14:15:00Z'
    },
    {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.wilson@email.com',
        phone: '555-0789',
        dominantHand: 'RIGHT',
        preferredGripStyle: 'TWO_HANDED_NO_THUMB',
        usesThumb: false,
        notes: 'Two-handed bowler, high rev rate',
        createdAt: '2024-02-01T09:45:00Z'
    }
];

export const mockDrillSheets: DrillSheet[] = [
    {
        id: '1',
        customerID: '1',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'John Smith - Storm Phaze II',
        gripStyle: 'FINGERTIP',
        spans: {
            thumbToMiddle: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 },
            thumbToRing: { fitSpan: 4.75, fullSpan: 5.0, cutToCutSpan: 4.5 }
        },
        bridge: { distance: 0.25 }, // Standard 1/4" bridge
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: { primary: '1', depth: 2.5 },
                    pitchForward: 0.125,
                    pitchLateral: 0.25
                },
                middle: {
                    size: { primary: '31/64', depth: 2.75 },
                    pitchForward: 0.375,
                    pitchLateral: 0.125
                },
                ring: {
                    size: { primary: '31/64', depth: 2.75 },
                    pitchForward: 0.375,
                    pitchLateral: 0.125
                }
            },
            specialNotes: 'Customer prefers slightly forward pitch on fingers',
            isTemplate: false,
            createdAt: '2024-01-15T11:00:00Z'
        },
    {
        id: '2',
        customerID: '2',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Sarah Johnson - Brunswick Quantum Bias',
        gripStyle: 'CONVENTIONAL',
        spans: {
            thumbToMiddle: { fitSpan: 4.25, fullSpan: 4.5, cutToCutSpan: 4.0 },
            thumbToRing: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 }
        },
        bridge: { distance: 0.1875 }, // 3/16" bridge (tighter than standard)
        holes: {
            thumb: {
                enabled: true,
                holeType: 'oval',
                size: { primary: '63/64', depth: 2.25 },
                pitchForward: 0.0,
                pitchLateral: -0.125
            },
            middle: {
                size: { primary: '29/64', depth: 2.25 },
                pitchForward: 0.25,
                pitchLateral: 0.0
            },
            ring: {
                size: { primary: '29/64', depth: 2.25 },
                pitchForward: 0.25,
                pitchLateral: 0.0
            }
        },
        specialNotes: 'Left-handed bowler, oval thumb hole for comfort. Uses rosin due to sweaty hands.',
        isTemplate: false,
        createdAt: '2024-01-20T15:30:00Z'
    },
    {
        id: '3',
        customerID: '3',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp2',
        name: 'Mike Wilson - Roto Grip Gem',
        gripStyle: 'TWO_HANDED_NO_THUMB',
        spans: {
            thumbToMiddle: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined },
            thumbToRing: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined }
        },
        bridge: { distance: 0.3125 }, // 5/16" bridge (wider for two-handed style)
        holes: {
            thumb: {
                enabled: false,
                holeType: 'round',
                size: { primary: '', depth: undefined }
            },
            middle: {
                size: { primary: '1/2', depth: 3.0 },
                pitchForward: 0.5,
                pitchLateral: 0.0
            },
            ring: {
                size: { primary: '1/2', depth: 3.0 },
                pitchForward: 0.5,
                pitchLateral: 0.0
            }
        },
        specialNotes: 'Two-handed bowler - no thumb hole. Deeper finger holes for better grip.',
        isTemplate: false,
        createdAt: '2024-02-01T10:15:00Z'
    },
    {
        id: '4',
        customerID: '', // Template has no customer
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Standard Fingertip Template',
        gripStyle: 'FINGERTIP',
        spans: {
            thumbToMiddle: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 },
            thumbToRing: { fitSpan: 4.75, fullSpan: 5.0, cutToCutSpan: 4.5 }
        },
        bridge: { distance: 0.25 }, // Standard 1/4" bridge
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: { primary: '1', depth: 2.5 },
                pitchForward: 0.125,
                pitchLateral: 0.25
            },
            middle: {
                size: { primary: '31/64', depth: 2.75 },
                pitchForward: 0.375,
                pitchLateral: 0.125
            },
            ring: {
                size: { primary: '31/64', depth: 2.75 },
                pitchForward: 0.375,
                pitchLateral: 0.125
            }
        },
        specialNotes: 'Standard fingertip template for right-handed bowlers',
        isTemplate: true,
        createdAt: '2024-01-10T08:00:00Z'
    },
    {
        id: '5',
        customerID: '', // Template has no customer
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Two-Handed Template',
        gripStyle: 'TWO_HANDED_NO_THUMB',
        spans: {
            thumbToMiddle: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined },
            thumbToRing: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined }
        },
        bridge: { distance: 0.3125 }, // Wider 5/16" bridge for two-handed
        holes: {
            thumb: {
                enabled: false,
                holeType: 'round',
                size: { primary: '', depth: undefined }
            },
            middle: {
                size: { primary: '1/2', depth: 3.0 },
                pitchForward: 0.5,
                pitchLateral: 0.0
            },
            ring: {
                size: { primary: '1/2', depth: 3.0 },
                pitchForward: 0.5,
                pitchLateral: 0.0
            }
        },
        specialNotes: 'Template for two-handed bowlers - no thumb, deeper finger holes',
        isTemplate: true,
        createdAt: '2024-01-10T08:30:00Z'
    }
];

export const mockBalls: BowlingBall[] = [
    {
        id: '1',
        customerID: '1',
        manufacturer: 'Storm',
        model: 'Phaze II',
        weight: 15,
        status: 'ACTIVE',
        serialNumber: 'ST123456789',
        coverstockType: 'Reactive Resin',
        coreType: 'Asymmetric',
        purchaseDate: '2024-01-15',
        purchasePrice: 189.99,
        notes: 'Customer\'s strike ball',
        drillSheetID: '1'
    },
    {
        id: '2',
        customerID: '2',
        manufacturer: 'Brunswick',
        model: 'Quantum Bias',
        weight: 14,
        status: 'ACTIVE',
        serialNumber: 'BR987654321',
        coverstockType: 'Reactive Resin',
        coreType: 'Symmetric',
        purchaseDate: '2024-01-20',
        purchasePrice: 159.99,
        notes: 'Good for medium oil conditions',
        drillSheetID: '2'
    },
    {
        id: '3',
        customerID: '3',
        manufacturer: 'Roto Grip',
        model: 'Gem',
        weight: 16,
        status: 'ACTIVE',
        serialNumber: 'RG456789123',
        coverstockType: 'Reactive Resin',
        coreType: 'Symmetric',
        purchaseDate: '2024-02-01',
        purchasePrice: 149.99,
        notes: 'Two-handed bowler ball',
        drillSheetID: '3'
    }
];

export const mockWorkOrders: WorkOrder[] = [
    {
        id: '1',
        ballID: '1', // Links to Storm Phaze II
        drillSheetID: '1',
        locationID: 'loc1',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-01-16',
        startTime: '10:00',
        endTime: '11:30',
        laborHours: 1.5,
        laborCost: 75.00,
        materialsCost: 15.00,
        totalCost: 90.00,
        workNotes: 'Initial drilling completed. Customer satisfied with grip feel.',
        specialNotes: 'Used premium finger grips per customer request.',
        customerSatisfaction: 5,
        qualityCheck: true,
        qualityNotes: 'All measurements within tolerance. Excellent finish.',
        warrantyPeriod: 90,
        createdAt: '2024-01-16T10:00:00Z'
    },
    {
        id: '2',
        ballID: '2', // Links to Brunswick Quantum Bias
        drillSheetID: '2',
        locationID: 'loc1',
        performedByEmployeeID: 'emp2',
        workType: 'INITIAL_DRILL',
        workDate: '2024-01-21',
        startTime: '14:00',
        endTime: '15:15',
        laborHours: 1.25,
        laborCost: 62.50,
        materialsCost: 12.00,
        totalCost: 74.50,
        workNotes: 'Standard drilling for conventional grip.',
        customerSatisfaction: 4,
        qualityCheck: true,
        warrantyPeriod: 90,
        createdAt: '2024-01-21T14:00:00Z'
    },
    {
        id: '3',
        ballID: '3', // Links to Roto Grip Gem
        drillSheetID: '3',
        locationID: 'loc2',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-02',
        startTime: '09:30',
        endTime: '10:45',
        laborHours: 1.25,
        laborCost: 62.50,
        materialsCost: 10.00,
        totalCost: 72.50,
        workNotes: 'Two-handed layout with no thumb hole. Extra care taken with finger hole placement.',
        specialNotes: 'Customer requested deeper finger holes for better grip.',
        customerSatisfaction: 5,
        qualityCheck: true,
        qualityNotes: 'Perfect layout for two-handed style.',
        warrantyPeriod: 90,
        createdAt: '2024-02-02T09:30:00Z'
    },
    {
        id: '4',
        ballID: '1', // Maintenance on Storm Phaze II
        drillSheetID: '1',
        locationID: 'loc1',
        performedByEmployeeID: 'emp1',
        workType: 'MAINTENANCE',
        workDate: '2024-02-15',
        startTime: '11:00',
        endTime: '11:30',
        laborHours: 0.5,
        laborCost: 25.00,
        materialsCost: 5.00,
        totalCost: 30.00,
        workNotes: 'Resurfaced ball and cleaned finger holes.',
        customerSatisfaction: 4,
        qualityCheck: true,
        warrantyPeriod: 30,
        createdAt: '2024-02-15T11:00:00Z'
    },
    {
        id: '5',
        ballID: '2', // Plug and redrill on Brunswick
        drillSheetID: '2',
        locationID: 'loc1',
        performedByEmployeeID: 'emp2',
        workType: 'PLUG_REDRILL',
        workDate: '2024-02-20',
        startTime: '13:00',
        endTime: '15:30',
        laborHours: 2.5,
        laborCost: 125.00,
        materialsCost: 25.00,
        totalCost: 150.00,
        workNotes: 'Customer wanted to change from conventional to fingertip grip.',
        deviationsFromSpec: 'Moved thumb hole 1/8" forward from original position.',
        customerSatisfaction: 5,
        qualityCheck: true,
        qualityNotes: 'Excellent plugging work. New layout feels great.',
        warrantyPeriod: 90,
        createdAt: '2024-02-20T13:00:00Z'
    },
    {
        id: '6',
        ballID: '3', // Surface adjustment on Roto Grip
        drillSheetID: '3',
        locationID: 'loc2',
        performedByEmployeeID: 'emp1',
        workType: 'SURFACE_ADJUSTMENT',
        workDate: '2024-02-25',
        startTime: '16:00',
        endTime: '16:45',
        laborHours: 0.75,
        laborCost: 37.50,
        materialsCost: 8.00,
        totalCost: 45.50,
        workNotes: 'Changed surface from 4000 grit to 2000 grit for more hook.',
        customerSatisfaction: 4,
        qualityCheck: true,
        warrantyPeriod: 30,
        createdAt: '2024-02-25T16:00:00Z'
    }
];

// Mock data for supporting entities (if not already present)
export const mockEmployees = [
    {
        id: 'emp1',
        proshopID: 'proshop1',
        cognitoUserID: 'user1',
        username: 'mike_tech',
        email: 'mike@proshop.com',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        phone: '555-0123',
        role: 'SENIOR_TECH' as const,
        permissions: ['drill', 'quality_check', 'customer_service'],
        hireDate: '2020-03-15',
        hourlyRate: 25.00,
        locations: ['loc1', 'loc2'],
        specialties: ['fingertip_drilling', 'two_handed_layouts'],
        active: true,
        createdAt: '2020-03-15T08:00:00Z'
    },
    {
        id: 'emp2',
        proshopID: 'proshop1',
        cognitoUserID: 'user2',
        username: 'sarah_drill',
        email: 'sarah@proshop.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '555-0124',
        role: 'TECHNICIAN' as const,
        permissions: ['drill', 'maintenance'],
        hireDate: '2021-06-01',
        hourlyRate: 20.00,
        locations: ['loc1'],
        specialties: ['conventional_drilling', 'surface_work'],
        active: true,
        createdAt: '2021-06-01T08:00:00Z'
    }
];

export const mockLocations = [
    {
        id: 'loc1',
        proshopID: 'proshop1',
        name: 'Main Pro Shop',
        address: '123 Bowling Lane, Sports City, SC 12345',
        phone: '555-0100',
        equipmentInfo: {
            drillPress: 'Jayhawk EZ-1',
            router: 'Switch Grip Router',
            polisher: 'Innovative Polishing System'
        },
        hours: {
            monday: '9:00 AM - 9:00 PM',
            tuesday: '9:00 AM - 9:00 PM',
            wednesday: '9:00 AM - 9:00 PM',
            thursday: '9:00 AM - 9:00 PM',
            friday: '9:00 AM - 10:00 PM',
            saturday: '8:00 AM - 10:00 PM',
            sunday: '10:00 AM - 8:00 PM'
        },
        active: true
    },
    {
        id: 'loc2',
        proshopID: 'proshop1',
        name: 'Satellite Location',
        address: '456 Strike Avenue, Bowl Town, BT 67890',
        phone: '555-0101',
        equipmentInfo: {
            drillPress: 'Turbo 2000',
            router: 'Standard Router',
            polisher: 'Brunswick Polisher'
        },
        hours: {
            monday: '12:00 PM - 8:00 PM',
            tuesday: '12:00 PM - 8:00 PM',
            wednesday: 'Closed',
            thursday: '12:00 PM - 8:00 PM',
            friday: '12:00 PM - 9:00 PM',
            saturday: '10:00 AM - 9:00 PM',
            sunday: '12:00 PM - 6:00 PM'
        },
        active: true
    }
];