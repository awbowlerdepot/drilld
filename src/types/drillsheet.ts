// DrillSheet Types - Comprehensive type definitions for bowling ball drilling
// This file contains all types related to drill sheets, measurements, and drilling specifications

// ==========================================
// CORE MEASUREMENT TYPES
// ==========================================

/**
 * Span measurement interface for finger-to-finger measurements
 * Used for thumb-to-finger spans (thumb to middle, thumb to ring)
 */
export interface SpanMeasurement {
    fitSpan?: number;        // Fit measurement (most common)
    fullSpan?: number;       // Full measurement
    cutToCutSpan?: number;   // Cut to cut measurement
    notes?: string;          // Additional notes for this measurement
}

/**
 * Bridge measurement interface - simpler than span measurements
 * Represents the distance between middle and ring finger holes
 */
export interface BridgeMeasurement {
    distance: number;        // Bridge distance in inches, default 1/4"
    notes?: string;          // Additional notes for bridge measurement
}

/**
 * Configuration for custom span measurements
 * Allows for non-standard finger combinations
 */
export interface FingerConfiguration {
    finger1: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
    finger2: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
}

/**
 * Custom span measurement with flexible finger configuration
 */
export interface CustomSpanMeasurement {
    name: string;                           // User-defined name for this span
    configuration: FingerConfiguration;    // Which fingers this span measures
    measurements: SpanMeasurement;          // The actual measurements
    isActive?: boolean;                     // Whether this span is currently used
}

// ==========================================
// HOLE SPECIFICATION TYPES
// ==========================================

/**
 * Hole size specification with primary/secondary sizes and depth
 */
export interface HoleSize {
    primary: string;           // Primary hole size (e.g., "31/64", "1/2")
    secondary?: string;        // Secondary size if needed (for stepped holes)
    depth?: number;            // Hole depth in inches
    tolerance?: number;        // Acceptable size variance
    hasInsert?: boolean;       // WHETHER THIS HOLE USES AN INSERT (NEW)
    insert?: FingerInsert;     // INSERT DETAILS IF hasInsert IS TRUE (NEW)
}


/**
 * Pitch specifications for hole angles
 */
export interface PitchSpecification {
    forward?: number;        // Forward pitch in degrees
    lateral?: number;        // Lateral pitch in degrees
    reverse?: number;        // Reverse pitch (negative forward)
}

/**
 * Drilling sequence step for complex hole drilling
 */
export interface DrillingStep {
    step: number;           // Order in drilling sequence
    bitSize: string;        // Drill bit size for this step
    depth: number;          // Depth to drill for this step
    speed?: number;         // Recommended drilling speed (RPM)
    feedRate?: number;      // Feed rate for drilling
    notes?: string;         // Special instructions for this step
}

/**
 * Complete finger hole specification
 */
export interface FingerHole {
    size: HoleSize;                     // Hole size specifications
    pitch?: PitchSpecification;         // Pitch angles
    drillingSequence?: DrillingStep[];  // Multi-step drilling if needed
    bevel?: {                           // Hole beveling specifications
        angle: number;                  // Bevel angle in degrees
        depth: number;                  // Bevel depth
    };
    insert?: {                          // Finger insert specifications
        type: string;                   // Insert type/brand
        size: string;                   // Insert size
    };
    notes?: string;                     // Additional hole-specific notes
}

export interface FingerInsert {
    manufacturer: 'VISE' | 'Turbo' | 'JoPo' | 'Other';
    insertSize: string;        // Insert size (17/32" to 29/32" in 1/64" increments)
    outsideHoleSize: '7/8' | '31/32' | '1-1/32';  // Outside hole size
    type?: string;             // Insert type/model (varies by manufacturer)
    model?: string;            // Specific insert model/part number
    color?: string;            // Insert color if applicable
    notes?: string;            // Any special notes about the insert
}

/**
 * NEW: Insert size ranges and compatibility
 */
export const INSERT_SIZE_RANGES = {
    '7/8': {
        minSize: '17/32',
        maxSize: '49/64',
        availableSizes: [
            '17/32', '35/64', '9/16', '37/64', '19/32', '39/64',
            '5/8', '41/64', '21/32', '43/64', '11/16', '45/64',
            '23/32', '47/64', '3/4', '49/64'
        ]
    },
    '31/32': {
        minSize: '9/16',
        maxSize: '13/16',
        availableSizes: [
            '9/16', '37/64', '19/32', '39/64', '5/8', '41/64',
            '21/32', '43/64', '11/16', '45/64', '23/32', '47/64',
            '3/4', '49/64', '25/32', '51/64', '13/16'
        ]
    },
    '1-1/32': {
        minSize: '53/64',
        maxSize: '29/32',
        availableSizes: [
            '53/64', '27/32', '55/64', '7/8', '57/64', '29/32'
        ]
    }
} as const;

/**
 * NEW: Insert manufacturers and their product lines
 */
export const INSERT_MANUFACTURERS = {
    VISE: {
        name: 'VISE',
        commonColors: ['Black', 'White', 'Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        notes: 'Popular for durability and grip',
        types: [
            'IT (Inner Thread)',
            'Turbo Switch',
            'Turbo Switch Grip',
            'Power Lift',
            'Power Oval',
            'Easy Out',
            'Thumb Solid',
            'Thumb IT'
        ]
    },
    Turbo: {
        name: 'Turbo',
        commonColors: ['Black', 'White', 'Red', 'Blue', 'Clear', 'Yellow'],
        notes: 'Known for smooth release',
        types: [
            'Turbo Grips',
            'Turbo Switch Grips',
            'Quad Grips',
            'Finger Inserts',
            'Thumb Slugs',
            'Switch Grip',
            'Finger Tip Grips'
        ]
    },
    JoPo: {
        name: 'JoPo',
        commonColors: ['Black', 'White', 'Clear', 'Red', 'Blue'],
        notes: 'Precision fit and feel',
        types: [
            'Standard Inserts',
            'Textured Inserts',
            'Grip Inserts',
            'Power Inserts',
            'Comfort Inserts',
            'Pro Series'
        ]
    },
    Other: {
        name: 'Other',
        commonColors: ['Black', 'White'],
        notes: 'Various manufacturers',
        types: [
            'Standard Insert',
            'Textured Insert',
            'Grip Insert',
            'Custom Insert'
        ]
    }
} as const;

/**
 * Thumb hole specification with additional thumb-specific options
 */
export interface ThumbHole extends FingerHole {
    enabled: boolean;                   // Whether thumb hole is drilled
    holeType: 'round' | 'oval';        // Thumb hole shape
    slug?: {                            // Thumb slug specifications
        type: string;                   // Slug type/material
        size: string;                   // Slug size
        tapering?: boolean;             // Whether slug is tapered
    };
    molding?: {                         // Custom thumb molding
        material: string;               // Molding material
        hardness?: string;              // Material hardness
    };
}

/**
 * Additional holes (balance, weight, vent holes, etc.)
 */
export interface AdditionalHole {
    name: string;                       // Hole name/identifier
    type: 'balance' | 'weight' | 'vent' | 'custom';
    size: HoleSize;                     // Hole specifications
    position?: {                        // Position on ball
        x: number;                      // X coordinate
        y: number;                      // Y coordinate
        reference?: string;             // Reference point for position
    };
    depth?: number;                     // Hole depth
    angle?: number;                     // Drilling angle
    purpose?: string;                   // Purpose of this hole
    notes?: string;                     // Additional notes
}

// ==========================================
// LAYOUT AND DRILLING SPECIFICATIONS
// ==========================================

/**
 * Ball layout specifications for pin and CG positioning
 */
export interface BallLayout {
    pinPosition?: {                     // Pin placement
        distance: number;               // Distance from PAP
        angle: number;                  // Angle from VAL
    };
    cgPosition?: {                      // CG placement
        distance: number;               // Distance from grip center
        angle: number;                  // Angle from midline
    };
    massBalance?: {                     // Mass balance specifications
        topWeight?: number;             // Top weight in ounces
        sideWeight?: number;            // Side weight in ounces
        fingerWeight?: number;          // Finger weight in ounces
    };
    pap?: {                             // Positive Axis Point
        horizontal: number;             // Horizontal PAP measurement
        vertical: number;               // Vertical PAP measurement
        tilt?: number;                  // Axis tilt
        rotation?: number;              // Axis rotation
    };
}

/**
 * Surface preparation specifications
 */
export interface SurfacePreparation {
    grit: number;                       // Final grit level
    pattern?: string;                   // Sanding pattern
    compound?: string;                  // Polishing compound used
    steps?: Array<{                     // Multi-step surface prep
        grit: number;
        direction: 'length' | 'width' | 'cross';
        strokes: number;
    }>;
    finish?: 'matte' | 'polished' | 'hybrid';
    notes?: string;
}

/**
 * Quality control specifications
 */
export interface QualitySpecs {
    tolerances: {                       // Acceptable tolerances
        spanTolerance: number;          // Span measurement tolerance
        holeSizeTolerance: number;      // Hole size tolerance
        pitchTolerance: number;         // Pitch angle tolerance
    };
    requiredChecks: string[];           // Required quality checks
    signoffRequired: boolean;           // Whether supervisor signoff needed
}

// ==========================================
// MAIN DRILLSHEET INTERFACE
// ==========================================

/**
 * Grip style enumeration
 */
export type GripStyle = 'CONVENTIONAL' | 'FINGERTIP' | 'TWO_HANDED_NO_THUMB';

/**
 * Drill sheet status for tracking completion
 */
export type DrillSheetStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

/**
 * Complete drill sheet specification
 */
export interface DrillSheet {
    // Basic identification
    id: string;
    customerID: string;
    proshopID: string;
    createdByEmployeeID: string;
    name: string;
    status: DrillSheetStatus;

    // Drilling style and approach
    gripStyle: GripStyle;
    isTemplate: boolean;                // Whether this is a reusable template
    templateName?: string;              // Name if used as template
    basedOnTemplateID?: string;         // ID of template this was based on

    // Core measurements
    spans: {
        thumbToMiddle: SpanMeasurement; // Thumb to middle finger span
        thumbToRing: SpanMeasurement;   // Thumb to ring finger span
        customSpans?: CustomSpanMeasurement[]; // Additional custom spans
    };

    bridge: BridgeMeasurement;          // Middle to ring finger bridge

    // Hole specifications
    holes: {
        thumb?: ThumbHole;              // Thumb hole (optional for 2-handed)
        index?: FingerHole;             // Index finger hole
        middle?: FingerHole;            // Middle finger hole
        ring?: FingerHole;              // Ring finger hole
        pinky?: FingerHole;             // Pinky hole (rare)
        additionalHoles?: AdditionalHole[]; // Balance holes, weight holes, etc.
    };

    // Ball layout and positioning
    layout?: BallLayout;                // Ball layout specifications

    // Surface and finishing
    surface?: SurfacePreparation;       // Surface preparation specs

    // Quality and compliance
    quality?: QualitySpecs;             // Quality control specifications

    // General drilling information
    drillingAngles?: Record<string, number>; // Legacy/additional angles
    specialNotes?: string;              // General notes and instructions
    customerPreferences?: string;       // Customer-specific preferences
    restrictions?: string[];            // Any drilling restrictions

    // Revision tracking
    version: number;                    // Version number for revisions
    previousVersionID?: string;         // ID of previous version
    revisionNotes?: string;             // Notes about changes made

    // Timestamps
    createdAt: string;
    updatedAt?: string;
    approvedAt?: string;                // When drill sheet was approved
    approvedByEmployeeID?: string;      // Who approved the drill sheet
}

// ==========================================
// VALIDATION AND UTILITY TYPES
// ==========================================

/**
 * Validation rules for drill sheet data
 */
export interface DrillSheetValidation {
    requiredFields: (keyof DrillSheet)[];
    spanLimits: {
        minSpan: number;
        maxSpan: number;
    };
    holeSizeLimits: {
        minSize: number;
        maxSize: number;
    };
    pitchLimits: {
        minPitch: number;
        maxPitch: number;
    };
}

/**
 * Form data structure for drill sheet creation/editing
 */
export interface DrillSheetFormData {
    // Basic info
    name: string;
    gripStyle: GripStyle;
    isTemplate: boolean;

    // Measurements
    thumbToMiddleFit?: number;
    thumbToMiddleFull?: number;
    thumbToRingFit?: number;
    thumbToRingFull?: number;
    bridgeDistance: number;

    // Thumb hole
    thumbEnabled: boolean;
    thumbHoleType: 'round' | 'oval';
    thumbHoleSize: string;
    thumbPitchForward?: number;
    thumbPitchLateral?: number;

    // Finger holes
    middleHoleSize: string;
    middlePitchForward?: number;
    middlePitchLateral?: number;
    ringHoleSize: string;
    ringPitchForward?: number;
    ringPitchLateral?: number;

    // Notes
    specialNotes?: string;
    customerPreferences?: string;
}

// ==========================================
// UTILITY FUNCTIONS AND CONSTANTS
// ==========================================

/**
 * Common drill bit sizes for different hole types
 */
export const DRILL_BIT_SIZES = {
    THUMB: [
        '1/2', '17/32', '9/16', '19/32', '5/8', '21/32',
        '11/16', '23/32', '3/4', '25/32', '13/16'
    ],
    FINGER: [
        '1/2', '17/32', '9/16', '19/32', '5/8', '21/32',
        '11/16', '23/32', '3/4', '25/32', '13/16', '27/32',
        '7/8', '29/32', '15/16', '31/32', '1'
    ]
} as const;

// ==========================================
// NEW UTILITY FUNCTIONS TO ADD
// ==========================================

/**
 * NEW: Helper function to validate insert compatibility
 */
export const isInsertCompatible = (insertSize: string, outsideHole: string): boolean => {
    const range = INSERT_SIZE_RANGES[outsideHole as keyof typeof INSERT_SIZE_RANGES];
    if (!range) return false;

    return (range.availableSizes as readonly string[]).includes(insertSize);
};

/**
 * NEW: Helper function to get available insert sizes for a given outside hole
 */
export const getAvailableInsertSizes = (outsideHole: string): string[] => {
    const range = INSERT_SIZE_RANGES[outsideHole as keyof typeof INSERT_SIZE_RANGES];
    return range ? [...range.availableSizes] : [];
};

/**
 * Standard grip measurements for different hand sizes
 */
export const STANDARD_MEASUREMENTS = {
    SPANS: {
        SMALL: { thumbToMiddle: 4.0, thumbToRing: 4.5 },
        MEDIUM: { thumbToMiddle: 4.25, thumbToRing: 4.75 },
        LARGE: { thumbToMiddle: 4.5, thumbToRing: 5.0 },
        EXTRA_LARGE: { thumbToMiddle: 4.75, thumbToRing: 5.25 }
    },
    BRIDGE: {
        STANDARD: 0.25,
        NARROW: 0.1875,
        WIDE: 0.3125
    }
} as const;

/**
 * Utility function to migrate existing drill sheet data
 */
export const migrateDrillSheetData = (oldDrillSheet: any): DrillSheet => {
    return {
        ...oldDrillSheet,
        status: oldDrillSheet.status || 'DRAFT',
        version: oldDrillSheet.version || 1,
        // Remove middleToRing from spans
        spans: {
            thumbToMiddle: oldDrillSheet.spans.thumbToMiddle,
            thumbToRing: oldDrillSheet.spans.thumbToRing,
            // customSpans remains if it exists
            ...(oldDrillSheet.spans.customSpans && {
                customSpans: oldDrillSheet.spans.customSpans
            })
        },
        // Convert middleToRing span to bridge measurement
        bridge: {
            distance: oldDrillSheet.spans.middleToRing?.fitSpan || 0.25
        }
    };
};

/**
 * Type guard to check if a drill sheet is a template
 */
export const isDrillSheetTemplate = (drillSheet: DrillSheet): boolean => {
    return drillSheet.isTemplate === true;
};

/**
 * Type guard to check if a drill sheet uses thumb hole
 */
export const usesThumbHole = (drillSheet: DrillSheet): boolean => {
    return drillSheet.gripStyle !== 'TWO_HANDED_NO_THUMB' &&
        drillSheet.holes.thumb?.enabled === true;
};

/**
 * Convert drill sheet to form data for editing
 */
export const drillSheetToFormData = (drillSheet: DrillSheet): DrillSheetFormData => {
    return {
        name: drillSheet.name,
        gripStyle: drillSheet.gripStyle,
        isTemplate: drillSheet.isTemplate,

        thumbToMiddleFit: drillSheet.spans.thumbToMiddle.fitSpan,
        thumbToMiddleFull: drillSheet.spans.thumbToMiddle.fullSpan,
        thumbToRingFit: drillSheet.spans.thumbToRing.fitSpan,
        thumbToRingFull: drillSheet.spans.thumbToRing.fullSpan,
        bridgeDistance: drillSheet.bridge.distance,

        thumbEnabled: drillSheet.holes.thumb?.enabled || false,
        thumbHoleType: drillSheet.holes.thumb?.holeType || 'round',
        thumbHoleSize: drillSheet.holes.thumb?.size.primary || '',
        thumbPitchForward: drillSheet.holes.thumb?.pitch?.forward,
        thumbPitchLateral: drillSheet.holes.thumb?.pitch?.lateral,

        middleHoleSize: drillSheet.holes.middle?.size.primary || '',
        middlePitchForward: drillSheet.holes.middle?.pitch?.forward,
        middlePitchLateral: drillSheet.holes.middle?.pitch?.lateral,
        ringHoleSize: drillSheet.holes.ring?.size.primary || '',
        ringPitchForward: drillSheet.holes.ring?.pitch?.forward,
        ringPitchLateral: drillSheet.holes.ring?.pitch?.lateral,

        specialNotes: drillSheet.specialNotes,
        customerPreferences: drillSheet.customerPreferences
    };
};

/**
 * Convert form data to drill sheet format
 */
export const formDataToDrillSheet = (
    formData: DrillSheetFormData,
    existingDrillSheet?: Partial<DrillSheet>
): Omit<DrillSheet, 'id' | 'createdAt'> => {
    return {
        customerID: existingDrillSheet?.customerID || '',
        proshopID: existingDrillSheet?.proshopID || '',
        createdByEmployeeID: existingDrillSheet?.createdByEmployeeID || '',
        name: formData.name,
        status: existingDrillSheet?.status || 'DRAFT',
        version: existingDrillSheet?.version || 1,
        gripStyle: formData.gripStyle,
        isTemplate: formData.isTemplate,

        spans: {
            thumbToMiddle: {
                fitSpan: formData.thumbToMiddleFit,
                fullSpan: formData.thumbToMiddleFull,
                cutToCutSpan: undefined
            },
            thumbToRing: {
                fitSpan: formData.thumbToRingFit,
                fullSpan: formData.thumbToRingFull,
                cutToCutSpan: undefined
            }
        },

        bridge: {
            distance: formData.bridgeDistance
        },

        holes: {
            thumb: formData.thumbEnabled ? {
                enabled: true,
                holeType: formData.thumbHoleType,
                size: { primary: formData.thumbHoleSize },
                pitch: {
                    forward: formData.thumbPitchForward,
                    lateral: formData.thumbPitchLateral
                }
            } : undefined,
            middle: {
                size: { primary: formData.middleHoleSize },
                pitch: {
                    forward: formData.middlePitchForward,
                    lateral: formData.middlePitchLateral
                }
            },
            ring: {
                size: { primary: formData.ringHoleSize },
                pitch: {
                    forward: formData.ringPitchForward,
                    lateral: formData.ringPitchLateral
                }
            }
        },

        specialNotes: formData.specialNotes,
        customerPreferences: formData.customerPreferences,
        updatedAt: new Date().toISOString()
    };
};