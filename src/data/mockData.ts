import { Customer, DrillSheet, BowlingBall } from '../types';

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