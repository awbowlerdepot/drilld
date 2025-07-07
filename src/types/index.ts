export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dominantHand: 'LEFT' | 'RIGHT';
    preferredGripStyle: 'CONVENTIONAL' | 'FINGERTIP' | 'TWO_HANDED_NO_THUMB';
    usesThumb: boolean;
    notes?: string;
    createdAt: string;
}

export interface SpanMeasurement {
    fitSpan?: number;        // Fit measurement (most common)
    fullSpan?: number;       // Full measurement
    cutToCutSpan?: number;   // Cut to cut measurement
}

export interface FingerConfiguration {
    finger1: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
    finger2: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
}

export interface HoleSize {
    primary: string;         // Primary hole size (e.g., "31/64", "1/2")
    secondary?: string;      // Secondary size if needed
    depth?: number;          // Hole depth
}

export interface FingerHole {
    size: HoleSize;
    pitchForward?: number;   // Forward pitch
    pitchLateral?: number;   // Lateral pitch
    drillingSequence?: Array<{
        step: number;
        bitSize: string;
        depth: number;
        notes?: string;
    }>;
}

export interface DrillSheet {
    id: string;
    customerID: string;
    proshopID: string;
    createdByEmployeeID: string;
    name: string;
    gripStyle: 'CONVENTIONAL' | 'FINGERTIP' | 'TWO_HANDED_NO_THUMB';

    // Span measurements - now organized by measurement type
    spans: {
        // Default spans (thumb-middle, thumb-ring, middle-ring)
        thumbToMiddle: SpanMeasurement;
        thumbToRing: SpanMeasurement;
        middleToRing: SpanMeasurement;
        // Additional custom spans
        customSpans?: Array<{
            name: string;
            configuration: FingerConfiguration;
            measurements: SpanMeasurement;
        }>;
    };

    // Hole specifications
    holes: {
        thumb?: FingerHole & {
            enabled: boolean;
            holeType: 'round' | 'oval';
        };
        index?: FingerHole;
        middle?: FingerHole;
        ring?: FingerHole;
        pinky?: FingerHole;
        // Support for additional holes (balance, weight, etc.)
        additionalHoles?: Array<{
            name: string;
            type: 'balance' | 'weight' | 'vent' | 'custom';
            size: HoleSize;
            position?: { x: number; y: number };
            notes?: string;
        }>;
    };

    // General drilling information
    drillingAngles?: Record<string, number>;
    specialNotes?: string;
    isTemplate: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface BowlingBall {
    id: string;
    customerID: string;
    manufacturer: string;
    model: string;
    weight: number;
    status: 'ACTIVE' | 'RETIRED' | 'DAMAGED';
    serialNumber?: string;
    coverstockType?: string;
    coreType?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    notes?: string;
    // Link to drill sheet used
    drillSheetID?: string;
}

export interface WorkOrder {
    id: string;
    ballID: string;
    drillSheetID: string;
    locationID: string;
    performedByEmployeeID?: string;
    workType: 'INITIAL_DRILL' | 'PLUG_REDRILL' | 'MAINTENANCE' | 'SURFACE_ADJUSTMENT';
    workDate: string;
    startTime?: string;
    endTime?: string;
    laborHours?: number;
    laborCost?: number;
    materialsCost?: number;
    totalCost?: number;
    workNotes?: string;
    specialNotes?: string;
    deviationsFromSpec?: string;
    customerSatisfaction?: number;
    qualityCheck?: boolean;
    qualityNotes?: string;
    warrantyPeriod?: number;
    beforePhotos?: string[];
    afterPhotos?: string[];
    createdAt: string;
}

// Additional types for the enhanced system
export interface Location {
    id: string;
    proshopID: string;
    name: string;
    address?: string;
    phone?: string;
    equipmentInfo?: Record<string, any>;
    hours?: Record<string, string>;
    active: boolean;
}

export interface Employee {
    id: string;
    proshopID: string;
    cognitoUserID: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'MANAGER' | 'SENIOR_TECH' | 'TECHNICIAN' | 'APPRENTICE';
    permissions: string[];
    certifications?: Record<string, any>;
    hireDate?: string;
    hourlyRate?: number;
    locations: string[];
    specialties: string[];
    active: boolean;
    createdAt: string;
    updatedAt?: string;
}