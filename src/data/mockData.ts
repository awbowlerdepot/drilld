// REPLACE ENTIRE CONTENTS of src/data/mockData.ts

import { Customer, BowlingBall, WorkOrder } from '../types';
import { DrillSheet } from '../types/drillsheet';

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
    },
    {
        id: '4',
        firstName: 'Lisa',
        lastName: 'Martinez',
        email: 'lisa.martinez@email.com',
        phone: '555-0321',
        dominantHand: 'RIGHT',
        preferredGripStyle: 'FINGERTIP',
        usesThumb: true,
        notes: 'Uses finger inserts, prefers VISE brand',
        createdAt: '2024-02-10T11:20:00Z'
    }
];

// Mock data for supporting entities
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
        permissions: ['read:customers', 'write:customers', 'read:workorders', 'write:workorders', 'read:balls', 'write:balls', 'read:drillsheets', 'write:drillsheets'],
        certifications: {
            'IBPSIA_Bronze': {
                issueDate: '2020-06-15',
                expiryDate: '2025-06-15',
                certificationNumber: 'IBPSIA-2020-1234'
            },
            'Finger_Insert_Specialist': {
                issueDate: '2021-03-20',
                expiryDate: '2026-03-20',
                certificationNumber: 'FIS-2021-5678'
            }
        },
        hireDate: '2020-03-15',
        hourlyRate: 25.00,
        locations: ['1', '2'],
        specialties: ['Finger Inserts', 'Ball Drilling', 'Layout Design'],
        active: true,
        createdAt: '2020-03-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z'
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
        permissions: ['read:customers', 'write:customers', 'read:workorders', 'write:workorders', 'read:balls', 'write:balls', 'read:drillsheets'],
        certifications: {
            'Basic_Drilling': {
                issueDate: '2021-07-01',
                expiryDate: '2024-07-01',
                certificationNumber: 'BD-2021-9012'
            }
        },
        hireDate: '2021-06-01',
        hourlyRate: 20.00,
        locations: ['1'],
        specialties: ['Ball Drilling', 'Surface Adjustments'],
        active: true,
        createdAt: '2021-06-01T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z'
    },
    {
        id: 'emp3',
        proshopID: 'proshop1',
        cognitoUserID: 'user3',
        username: 'alex_manager',
        email: 'alex@proshop.com',
        firstName: 'Alex',
        lastName: 'Thompson',
        phone: '555-0125',
        role: 'MANAGER' as const,
        permissions: ['read:customers', 'write:customers', 'delete:customers', 'read:workorders', 'write:workorders', 'delete:workorders', 'read:balls', 'write:balls', 'delete:balls', 'read:drillsheets', 'write:drillsheets', 'delete:drillsheets', 'read:employees', 'write:employees', 'read:analytics', 'manage:settings'],
        certifications: {
            'IBPSIA_Silver': {
                issueDate: '2019-04-10',
                expiryDate: '2024-04-10',
                certificationNumber: 'IBPSIA-2019-3456'
            },
            'Shop_Management': {
                issueDate: '2020-01-15',
                expiryDate: '2025-01-15',
                certificationNumber: 'SM-2020-7890'
            }
        },
        hireDate: '2019-01-15',
        hourlyRate: 30.00,
        locations: ['1', '2'],
        specialties: ['Customer Consultation', 'Ball Drilling', 'Equipment Maintenance', 'Finger Inserts'],
        active: true,
        createdAt: '2019-01-15T08:00:00Z',
        updatedAt: '2024-02-01T08:00:00Z'
    }
];

export const mockDrillSheets: DrillSheet[] = [
    {
        id: '1',
        customerID: '1',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'John Smith - Storm Phaze II',
        status: 'COMPLETED',
        gripStyle: 'FINGERTIP',
        isTemplate: false,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 },
            thumbToRing: { fitSpan: 4.75, fullSpan: 5.0, cutToCutSpan: 4.5 }
        },
        bridge: { distance: 0.25 },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: {
                    primary: '1',
                    depth: 2.5,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.125,
                    lateral: 0.25
                }
            },
            middle: {
                size: {
                    primary: '31/64',
                    depth: 2.75,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            },
            ring: {
                size: {
                    primary: '31/64',
                    depth: 2.75,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            }
        },
        specialNotes: 'Customer prefers slightly forward pitch on fingers',
        createdAt: '2024-01-15T11:00:00Z'
    },
    {
        id: '2',
        customerID: '2',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Sarah Johnson - Brunswick Quantum Bias',
        status: 'COMPLETED',
        gripStyle: 'CONVENTIONAL',
        isTemplate: false,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: 4.25, fullSpan: 4.5, cutToCutSpan: 4.0 },
            thumbToRing: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 }
        },
        bridge: { distance: 0.1875 },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'oval',
                size: {
                    primary: '63/64',
                    depth: 2.25,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.0,
                    lateral: -0.125
                }
            },
            middle: {
                size: {
                    primary: '29/64',
                    depth: 2.25,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.25,
                    lateral: 0.0
                }
            },
            ring: {
                size: {
                    primary: '29/64',
                    depth: 2.25,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.25,
                    lateral: 0.0
                }
            }
        },
        specialNotes: 'Left-handed bowler, oval thumb hole for comfort. Uses rosin due to sweaty hands.',
        createdAt: '2024-01-20T15:30:00Z'
    },
    {
        id: '3',
        customerID: '3',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp2',
        name: 'Mike Wilson - Roto Grip Gem',
        status: 'COMPLETED',
        gripStyle: 'TWO_HANDED_NO_THUMB',
        isTemplate: false,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined },
            thumbToRing: { fitSpan: undefined, fullSpan: undefined, cutToCutSpan: undefined }
        },
        bridge: { distance: 0.3125 },
        holes: {
            thumb: {
                enabled: false,
                holeType: 'round',
                size: {
                    primary: '',
                    depth: undefined,
                    hasInsert: false
                }
            },
            middle: {
                size: {
                    primary: '1/2',
                    depth: 3.0,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.5,
                    lateral: 0.0
                }
            },
            ring: {
                size: {
                    primary: '1/2',
                    depth: 3.0,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.5,
                    lateral: 0.0
                }
            }
        },
        specialNotes: 'Two-handed bowler - no thumb hole. Deeper finger holes for better grip.',
        createdAt: '2024-02-01T10:15:00Z'
    },
    {
        id: '4',
        customerID: '4',
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Lisa Martinez - Hammer Black Widow',
        status: 'COMPLETED',
        gripStyle: 'FINGERTIP',
        isTemplate: false,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: 4.375, fullSpan: 4.625, cutToCutSpan: 4.125 },
            thumbToRing: { fitSpan: 4.625, fullSpan: 4.875, cutToCutSpan: 4.375 }
        },
        bridge: { distance: 0.25 },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: {
                    primary: '31/32',
                    depth: 2.5,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.125,
                    lateral: 0.0
                }
            },
            middle: {
                size: {
                    primary: '31/32',
                    depth: 2.75,
                    hasInsert: true,
                    insert: {
                        manufacturer: 'VISE',
                        insertSize: '9/16',
                        outsideHoleSize: '31/32',
                        type: 'IT (Inner Thread)',
                        color: 'Black',
                        model: 'IT-916',
                        notes: 'Customer prefers VISE IT series'
                    }
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.0
                }
            },
            ring: {
                size: {
                    primary: '31/32',
                    depth: 2.75,
                    hasInsert: true,
                    insert: {
                        manufacturer: 'VISE',
                        insertSize: '19/32',
                        outsideHoleSize: '31/32',
                        type: 'IT (Inner Thread)',
                        color: 'Black',
                        model: 'IT-1932',
                        notes: 'Slightly larger insert for ring finger'
                    }
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.0
                }
            }
        },
        specialNotes: 'Customer uses finger inserts for consistent feel across all balls. Prefers VISE IT series in black.',
        createdAt: '2024-02-10T14:45:00Z'
    },
    {
        id: '5',
        customerID: '', // Template has no customer
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Standard Fingertip Template',
        status: 'APPROVED',
        gripStyle: 'FINGERTIP',
        isTemplate: true,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 },
            thumbToRing: { fitSpan: 4.75, fullSpan: 5.0, cutToCutSpan: 4.5 }
        },
        bridge: { distance: 0.25 },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: {
                    primary: '1',
                    depth: 2.5,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.125,
                    lateral: 0.25
                }
            },
            middle: {
                size: {
                    primary: '31/64',
                    depth: 2.75,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            },
            ring: {
                size: {
                    primary: '31/64',
                    depth: 2.75,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            }
        },
        specialNotes: 'Standard fingertip template for right-handed bowlers',
        createdAt: '2024-01-10T08:00:00Z'
    },
    {
        id: '6',
        customerID: '', // Template has no customer
        proshopID: 'proshop1',
        createdByEmployeeID: 'emp1',
        name: 'Insert User Template',
        status: 'APPROVED',
        gripStyle: 'FINGERTIP',
        isTemplate: true,
        version: 1,
        spans: {
            thumbToMiddle: { fitSpan: 4.5, fullSpan: 4.75, cutToCutSpan: 4.25 },
            thumbToRing: { fitSpan: 4.75, fullSpan: 5.0, cutToCutSpan: 4.5 }
        },
        bridge: { distance: 0.25 },
        holes: {
            thumb: {
                enabled: true,
                holeType: 'round',
                size: {
                    primary: '1',
                    depth: 2.5,
                    hasInsert: false
                },
                pitch: {
                    forward: 0.125,
                    lateral: 0.25
                }
            },
            middle: {
                size: {
                    primary: '7/8',
                    depth: 2.75,
                    hasInsert: true,
                    insert: {
                        manufacturer: 'Turbo',
                        insertSize: '9/16',
                        outsideHoleSize: '7/8',
                        type: 'Turbo Grips',
                        color: 'Red',
                        model: 'TG-916'
                    }
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            },
            ring: {
                size: {
                    primary: '7/8',
                    depth: 2.75,
                    hasInsert: true,
                    insert: {
                        manufacturer: 'Turbo',
                        insertSize: '19/32',
                        outsideHoleSize: '7/8',
                        type: 'Turbo Grips',
                        color: 'Red',
                        model: 'TG-1932'
                    }
                },
                pitch: {
                    forward: 0.375,
                    lateral: 0.125
                }
            }
        },
        specialNotes: 'Template for bowlers who use finger inserts - 7/8" outside holes with Turbo inserts',
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
        purchasePrice: 180.00,
        notes: 'Primary strike ball, drilled for fingertip grip',
        drillSheetID: '1'
    },
    {
        id: '2',
        customerID: '2',
        manufacturer: 'Brunswick',
        model: 'Quantum Bias',
        weight: 14,
        status: 'ACTIVE',
        serialNumber: 'BW987654321',
        coverstockType: 'Reactive Resin',
        coreType: 'Symmetric',
        purchaseDate: '2024-01-20',
        purchasePrice: 165.00,
        notes: 'Left-handed layout, oval thumb hole',
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
        coverstockType: 'Hybrid Reactive',
        coreType: 'Asymmetric',
        purchaseDate: '2024-02-01',
        purchasePrice: 195.00,
        notes: 'Two-handed drilling, no thumb hole',
        drillSheetID: '3'
    },
    {
        id: '4',
        customerID: '4',
        manufacturer: 'Hammer',
        model: 'Black Widow',
        weight: 15,
        status: 'ACTIVE',
        serialNumber: 'HM789123456',
        coverstockType: 'Solid Reactive',
        coreType: 'Asymmetric',
        purchaseDate: '2024-02-10',
        purchasePrice: 210.00,
        notes: 'Uses VISE finger inserts, aggressive layout',
        drillSheetID: '4'
    }
];

export const mockWorkOrders: WorkOrder[] = [
    {
        id: '1',
        ballID: '1',
        drillSheetID: '1',
        locationID: 'loc1',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-01-15',
        startTime: '10:00',
        endTime: '11:30',
        laborHours: 1.5,
        laborCost: 75.00,
        materialsCost: 0.00,
        totalCost: 75.00,
        workNotes: 'Standard fingertip drilling, no inserts required',
        qualityCheck: true,
        qualityNotes: 'All measurements verified, customer satisfied with fit',
        customerSatisfaction: 5,
        createdAt: '2024-01-15T11:30:00Z'
    },
    {
        id: '2',
        ballID: '4',
        drillSheetID: '4',
        locationID: 'loc1',
        performedByEmployeeID: 'emp1',
        workType: 'INITIAL_DRILL',
        workDate: '2024-02-10',
        startTime: '14:00',
        endTime: '16:00',
        laborHours: 2.0,
        laborCost: 100.00,
        materialsCost: 35.00,
        totalCost: 135.00,
        workNotes: 'Drilled 31/32" holes for VISE IT inserts. Installed customer-provided black VISE inserts in middle and ring fingers.',
        qualityCheck: true,
        qualityNotes: 'Insert installation verified, proper depth and alignment confirmed',
        customerSatisfaction: 5,
        createdAt: '2024-02-10T16:00:00Z'
    }
];