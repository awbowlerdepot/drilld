import { Customer, DrillSheet, BowlingBall, WorkOrder } from '../types';

export const mockCustomers: Customer[] = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@email.com',
        phone: '555-1234',
        dominantHand: 'RIGHT',
        preferredGripStyle: 'FINGERTIP',
        usesThumb: true,
        notes: 'Prefers aggressive drilling, high rev rate',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@email.com',
        phone: '555-5678',
        dominantHand: 'LEFT',
        preferredGripStyle: 'CONVENTIONAL',
        usesThumb: true,
        notes: 'League bowler, consistent approach',
        createdAt: '2024-01-20T14:20:00Z'
    },
    {
        id: '3',
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike@email.com',
        phone: '555-9012',
        dominantHand: 'RIGHT',
        preferredGripStyle: 'TWO_HANDED_NO_THUMB',
        usesThumb: false,
        notes: 'Two-handed bowler, no thumb hole',
        createdAt: '2024-02-01T09:15:00Z'
    }
];

export const mockDrillSheets: DrillSheet[] = [
    {
        id: '1',
        customerID: '1',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: "John's Fingertip Spec #1",
        gripStyle: 'FINGERTIP',
        spans: {
            thumbToMiddle: {
                fitSpan: 4.40,
                fullSpan: 4.65,
                cutToCutSpan: 4.25
            },
            thumbToRing: {
                fitSpan: 4.90,
                fullSpan: 5.15,
                cutToCutSpan: 4.75
            },
            middleToRing: {
                fitSpan: 0.85,
                fullSpan: 1.00,
                cutToCutSpan: 0.75
            }
        },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'oval',
                size: {
                    primary: '31/64',
                    depth: 2.25
                },
                pitchForward: 0.125,
                pitchLateral: 0.25,
                drillingSequence: [
                    { step: 1, bitSize: '1/2', depth: 2.0 },
                    { step: 2, bitSize: '31/64', depth: 2.25 }
                ]
            },
            middle: {
                size: {
                    primary: '31/64',
                    depth: 1.25
                },
                pitchForward: 0.375,
                pitchLateral: 0.125
            },
            ring: {
                size: {
                    primary: '31/64',
                    depth: 1.25
                },
                pitchForward: 0.375,
                pitchLateral: 0.125
            }
        },
        specialNotes: 'Customer prefers slightly more forward pitch for better rev rate',
        isTemplate: false,
        createdAt: '2024-02-01T14:30:00Z'
    },
    {
        id: '2',
        customerID: '2',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: "Sarah's Conventional Setup",
        gripStyle: 'CONVENTIONAL',
        spans: {
            thumbToMiddle: {
                fitSpan: 4.60,
                fullSpan: 4.85,
                cutToCutSpan: 4.45
            },
            thumbToRing: {
                fitSpan: 5.10,
                fullSpan: 5.35,
                cutToCutSpan: 4.95
            },
            middleToRing: {
                fitSpan: 0.75,
                fullSpan: 0.90,
                cutToCutSpan: 0.65
            }
        },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: {
                    primary: '1/2',
                    depth: 2.75
                },
                pitchForward: 0.0,
                pitchLateral: 0.125
            },
            middle: {
                size: {
                    primary: '31/64',
                    depth: 2.75
                },
                pitchForward: 0.25,
                pitchLateral: 0.0
            },
            ring: {
                size: {
                    primary: '31/64',
                    depth: 2.75
                },
                pitchForward: 0.25,
                pitchLateral: 0.0
            }
        },
        specialNotes: 'Standard conventional drilling, comfortable fit',
        isTemplate: true,
        createdAt: '2024-02-05T11:15:00Z'
    },
    {
        id: '3',
        customerID: '3',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: "Mike's Two-Handed Layout",
        gripStyle: 'TWO_HANDED_NO_THUMB',
        spans: {
            thumbToMiddle: {
                fitSpan: 0, // No thumb
                fullSpan: 0,
                cutToCutSpan: 0
            },
            thumbToRing: {
                fitSpan: 0,
                fullSpan: 0,
                cutToCutSpan: 0
            },
            middleToRing: {
                fitSpan: 0.85,
                fullSpan: 1.00,
                cutToCutSpan: 0.75
            }
        },
        holes: {
            thumb: {
                enabled: false,
                holeType: 'round',
                size: { primary: '', depth: 0 }
            },
            middle: {
                size: {
                    primary: '31/64',
                    depth: 1.50
                },
                pitchForward: 0.50,
                pitchLateral: 0.125
            },
            ring: {
                size: {
                    primary: '31/64',
                    depth: 1.50
                },
                pitchForward: 0.50,
                pitchLateral: 0.125
            },
            additionalHoles: [
                {
                    name: 'Balance Hole',
                    type: 'balance',
                    size: { primary: '1/2', depth: 1.0 },
                    position: { x: 2.5, y: -1.0 },
                    notes: 'For static weight adjustment'
                }
            ]
        },
        specialNotes: 'Two-handed style, aggressive finger pitches for rev rate',
        isTemplate: false,
        createdAt: '2024-02-10T16:45:00Z'
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
        coverstockType: 'Solid Reactive',
        coreType: 'Asymmetrical',
        purchaseDate: '2024-01-15',
        purchasePrice: 189.99,
        notes: "Customer's main strike ball",
        drillSheetID: '1'
    },
    {
        id: '2',
        customerID: '1',
        manufacturer: 'Hammer',
        model: 'Black Widow',
        weight: 15,
        status: 'ACTIVE',
        serialNumber: 'HM987654321',
        coverstockType: 'Pearl Reactive',
        coreType: 'Symmetric',
        purchaseDate: '2024-02-01',
        purchasePrice: 165.00,
        notes: 'Spare ball setup',
        drillSheetID: '1'
    },
    {
        id: '3',
        customerID: '2',
        manufacturer: 'Brunswick',
        model: 'Quantum Evo',
        weight: 14,
        status: 'ACTIVE',
        coverstockType: 'Solid Reactive',
        purchaseDate: '2024-01-25',
        purchasePrice: 175.00,
        drillSheetID: '2'
    },
    {
        id: '4',
        customerID: '3',
        manufacturer: 'Motiv',
        model: 'Venom Shock',
        weight: 16,
        status: 'ACTIVE',
        coverstockType: 'Solid Reactive',
        purchaseDate: '2024-02-10',
        purchasePrice: 155.00,
        notes: 'Two-handed drilling',
        drillSheetID: '3'
    }
];

export const mockWorkOrders: WorkOrder[] = [
    {
        id: '1',
        ballID: '1',
        drillSheetID: '1',
        locationID: '1',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-15T10:00:00Z',
        startTime: '2024-02-15T10:00:00Z',
        endTime: '2024-02-15T11:30:00Z',
        laborHours: 1.5,
        laborCost: 37.50,
        materialsCost: 12.00,
        totalCost: 49.50,
        customerSatisfaction: 5,
        qualityCheck: true,
        workNotes: 'Drilled to spec, customer satisfied with fit',
        warrantyPeriod: 30,
        createdAt: '2024-02-15T10:00:00Z'
    },
    {
        id: '2',
        ballID: '2',
        drillSheetID: '1',
        locationID: '1',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-20T14:30:00Z',
        laborHours: 1.0,
        laborCost: 25.00,
        materialsCost: 8.00,
        totalCost: 33.00,
        customerSatisfaction: 4,
        qualityCheck: true,
        workNotes: 'Standard drilling, minor adjustment needed',
        createdAt: '2024-02-20T14:30:00Z'
    },
    {
        id: '3',
        ballID: '4',
        drillSheetID: '3',
        locationID: '1',
        performedByEmployeeID: 'emp2',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-25T09:00:00Z',
        laborHours: 2.0,
        laborCost: 50.00,
        materialsCost: 15.00,
        totalCost: 65.00,
        customerSatisfaction: 5,
        qualityCheck: true,
        workNotes: 'Two-handed drilling with balance hole, excellent fit',
        specialNotes: 'Customer very happy with rev rate increase',
        warrantyPeriod: 30,
        createdAt: '2024-02-25T09:00:00Z'
    }
];