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
        notes: 'Prefers aggressive drilling',
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
        notes: 'Two-handed bowler, no thumb',
        createdAt: '2024-02-01T09:15:00Z'
    }
];

export const mockDrillSheets: DrillSheet[] = [
    {
        id: '1',
        customerID: '1',
        name: "John's Fingertip Spec #1",
        gripStyle: 'FINGERTIP',
        thumbToMiddleFit: 4.40,
        thumbToRingFit: 4.90,
        middleToRingFit: 0.85,
        thumbEnabled: true,
        thumbPitchForward: 0.125,
        thumbPitchLateral: 0.25,
        middleFingerPitchForward: 0.375,
        middleFingerPitchLateral: 0.125,
        ringFingerPitchForward: 0.375,
        ringFingerPitchLateral: 0.125,
        specialNotes: 'Customer prefers slightly more forward pitch',
        isTemplate: false,
        createdAt: '2024-02-01T14:30:00Z'
    },
    {
        id: '2',
        customerID: '2',
        name: "Sarah's Conventional Setup",
        gripStyle: 'CONVENTIONAL',
        thumbToMiddleFit: 4.60,
        thumbToRingFit: 5.10,
        middleToRingFit: 0.75,
        thumbEnabled: true,
        thumbPitchForward: 0.0,
        thumbPitchLateral: 0.125,
        specialNotes: 'Standard conventional drilling',
        isTemplate: true,
        createdAt: '2024-02-05T11:15:00Z'
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
        notes: "Customer's main strike ball"
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
        notes: 'Spare ball setup'
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
        purchasePrice: 175.00
    }
];

export const mockWorkOrders: WorkOrder[] = [
    {
        id: '1',
        ballID: '1',
        drillSheetID: '1',
        locationID: '1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-15T10:00:00Z',
        laborHours: 1.5,
        laborCost: 37.50,
        materialsCost: 12.00,
        totalCost: 49.50,
        customerSatisfaction: 5,
        qualityCheck: true,
        workNotes: 'Drilled to spec, customer satisfied with fit'
    },
    {
        id: '2',
        ballID: '2',
        drillSheetID: '1',
        locationID: '1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-20T14:30:00Z',
        laborHours: 1.0,
        laborCost: 25.00,
        materialsCost: 8.00,
        totalCost: 33.00,
        customerSatisfaction: 4,
        qualityCheck: true,
        workNotes: 'Standard drilling, minor adjustment needed'
    }
];