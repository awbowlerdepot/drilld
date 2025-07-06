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

export interface DrillSheet {
    id: string;
    customerID: string;
    name: string;
    gripStyle: 'CONVENTIONAL' | 'FINGERTIP' | 'TWO_HANDED_NO_THUMB';
    thumbToMiddleFit?: number;
    thumbToRingFit?: number;
    middleToRingFit?: number;
    thumbEnabled: boolean;
    thumbPitchForward?: number;
    thumbPitchLateral?: number;
    middleFingerPitchForward?: number;
    middleFingerPitchLateral?: number;
    ringFingerPitchForward?: number;
    ringFingerPitchLateral?: number;
    specialNotes?: string;
    isTemplate: boolean;
    createdAt: string;
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
}

export interface WorkOrder {
    id: string;
    ballID: string;
    drillSheetID: string;
    locationID: string;
    workType: 'INITIAL_DRILL' | 'PLUG_REDRILL' | 'MAINTENANCE';
    workDate: string;
    laborHours?: number;
    laborCost?: number;
    materialsCost?: number;
    totalCost?: number;
    customerSatisfaction?: number;
    qualityCheck?: boolean;
    workNotes?: string;
}

export interface Location {
    id: string;
    proshopID: string;
    name: string;
    address?: string;
    phone?: string;
    active: boolean;
}

export interface Employee {
    id: string;
    proshopID: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'MANAGER' | 'SENIOR_TECH' | 'TECHNICIAN' | 'APPRENTICE';
    active: boolean;
}