// Main types index - imports and re-exports all type definitions
// This file serves as the central hub for all application types

// Re-export drillsheet types from dedicated file
export * from './drillsheet';

// Re-export employee types from dedicated file
export * from './employee';

// Import specific types that we need to reference in this file
import type { Employee } from './employee';

// ==========================================
// CUSTOMER TYPES
// ==========================================

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

// ==========================================
// BOWLING BALL TYPES
// ==========================================

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

// ==========================================
// WORK ORDER TYPES
// ==========================================

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

// ==========================================
// LOCATION TYPES
// ==========================================

export interface Location {
    id: string;
    proshopID: string;
    name: string;
    address?: string;
    phone?: string;
    equipmentInfo?: Record<string, any>;
    hours?: Record<string, string>;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    errors?: string[];
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: PaginationMeta;
}

/**
 * Filter options for various list views
 */
export interface FilterOptions {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Application state management types
 */
export interface AppState {
    user?: Employee;
    currentProshop?: string;
    currentLocation?: string;
    loading: boolean;
    error?: string;
}

// ==========================================
// LEGACY SUPPORT
// ==========================================

/**
 * @deprecated Use the new DrillSheet type from './drillsheet'
 * This is kept for backward compatibility during migration
 */
export interface LegacyDrillSheet {
    id: string;
    customerID: string;
    name: string;
    spans: {
        thumbToMiddle: { fitSpan?: number; fullSpan?: number };
        thumbToRing: { fitSpan?: number; fullSpan?: number };
        middleToRing: { fitSpan?: number; fullSpan?: number }; // This will be migrated to bridge
    };
    holes: {
        thumb?: { enabled: boolean; size: string };
        middle?: { size: string };
        ring?: { size: string };
    };
    isTemplate: boolean;
    createdAt: string;
}