// CREATE NEW FILE: src/utils/insertValidation.ts

import { HoleSize, FingerInsert, isInsertCompatible, getAvailableInsertSizes } from '../types/drillsheet'; // UPDATED IMPORT

export interface ValidationError {
    field: string;
    message: string;
}

export interface HoleValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

/**
 * Validates a hole size configuration including insert compatibility
 */
export const validateHoleSize = (
    holeSize: HoleSize, // UPDATED TYPE
    fingerName: string,
    isRequired: boolean = false
): HoleValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Basic hole size validation
    if (isRequired && !holeSize.primary) {
        errors.push({
            field: `${fingerName}_primary`,
            message: `${fingerName} hole size is required`
        });
    }

    if (holeSize.depth !== undefined) {
        if (holeSize.depth < 0.5) {
            warnings.push({
                field: `${fingerName}_depth`,
                message: `${fingerName} hole depth is unusually shallow (${holeSize.depth}"). Consider 2.0" or deeper.`
            });
        }
        if (holeSize.depth > 4.0) {
            errors.push({
                field: `${fingerName}_depth`,
                message: `${fingerName} hole depth cannot exceed 4.0"`
            });
        }
    }

    // Insert validation
    if (holeSize.hasInsert) {
        if (!holeSize.insert) {
            errors.push({
                field: `${fingerName}_insert`,
                message: `Insert configuration is required when "Use Finger Insert" is checked`
            });
        } else {
            const insertErrors = validateInsert(holeSize.insert, fingerName);
            errors.push(...insertErrors.errors);
            warnings.push(...insertErrors.warnings);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Validates insert configuration
 */
export const validateInsert = (
    insert: FingerInsert,
    fingerName: string
): HoleValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    if (!insert.outsideHoleSize) {
        errors.push({
            field: `${fingerName}_insert_outsideHole`,
            message: 'Outside hole size is required for inserts'
        });
    }

    if (!insert.insertSize) {
        errors.push({
            field: `${fingerName}_insert_size`,
            message: 'Insert size is required'
        });
    }

    if (!insert.manufacturer) {
        errors.push({
            field: `${fingerName}_insert_manufacturer`,
            message: 'Insert manufacturer is required'
        });
    }

    // Compatibility validation
    if (insert.outsideHoleSize && insert.insertSize) {
        if (!isInsertCompatible(insert.insertSize, insert.outsideHoleSize)) {
            errors.push({
                field: `${fingerName}_insert_compatibility`,
                message: `${insert.insertSize}" insert is not compatible with ${insert.outsideHoleSize}" outside hole. ` +
                    `Compatible sizes: ${getAvailableInsertSizes(insert.outsideHoleSize).join(', ')}`
            });
        }
    }

    // Warnings for missing optional but recommended fields
    if (!insert.type) {
        warnings.push({
            field: `${fingerName}_insert_type`,
            message: 'Consider specifying insert type for better identification'
        });
    }

    if (!insert.color) {
        warnings.push({
            field: `${fingerName}_insert_color`,
            message: 'Consider specifying insert color for customer preferences'
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Validates all finger holes in a drill sheet
 */
export const validateAllFingerHoles = (holes: {
    middle?: { size: HoleSize; pitch?: { forward?: number; lateral?: number } }; // UPDATED TYPE
    ring?: { size: HoleSize; pitch?: { forward?: number; lateral?: number } }; // UPDATED TYPE
    index?: { size: HoleSize; pitch?: { forward?: number; lateral?: number } }; // UPDATED TYPE
    pinky?: { size: HoleSize; pitch?: { forward?: number; lateral?: number } }; // UPDATED TYPE
}): HoleValidationResult => {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    // Validate middle finger (usually required)
    if (holes.middle) {
        const result = validateHoleSize(holes.middle.size, 'Middle', true);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }

    // Validate ring finger (usually required)
    if (holes.ring) {
        const result = validateHoleSize(holes.ring.size, 'Ring', true);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }

    // Validate optional fingers
    if (holes.index) {
        const result = validateHoleSize(holes.index.size, 'Index', false);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }

    if (holes.pinky) {
        const result = validateHoleSize(holes.pinky.size, 'Pinky', false);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    };
};

/**
 * Validates that insert sizes are within the valid range
 */
export const validateInsertSizeRange = (insertSize: string): boolean => {
    // Convert fraction to decimal for comparison
    const fractionToDecimal = (fraction: string): number => {
        if (fraction.includes('/')) {
            const [numerator, denominator] = fraction.split('/').map(Number);
            return numerator / denominator;
        }
        return parseFloat(fraction);
    };

    const sizeDecimal = fractionToDecimal(insertSize);
    const minSize = fractionToDecimal('17/32'); // 0.53125
    const maxSize = fractionToDecimal('29/32'); // 0.90625

    return sizeDecimal >= minSize && sizeDecimal <= maxSize;
};

/**
 * Helper to get recommended insert size based on finger measurements
 */
export const getRecommendedInsertSize = (fingerDiameter: number): {
    outsideHole: string;
    recommendedSizes: string[];
    notes: string;
} => {
    // These are general recommendations - actual fitting should always be done in person
    if (fingerDiameter <= 0.65) {
        return {
            outsideHole: '7/8',
            recommendedSizes: ['17/32', '35/64', '9/16'],
            notes: 'Small to medium finger - 7/8" hole with smaller inserts'
        };
    } else if (fingerDiameter <= 0.8) {
        return {
            outsideHole: '31/32',
            recommendedSizes: ['9/16', '37/64', '19/32', '5/8'],
            notes: 'Medium finger - most common insert range'
        };
    } else {
        return {
            outsideHole: '1-1/32',
            recommendedSizes: ['53/64', '27/32', '7/8'],
            notes: 'Large finger - larger insert sizes for proper fit'
        };
    }
};

/**
 * Generates a comprehensive validation report for a drill sheet
 */
export const generateDrillSheetValidationReport = (drillSheet: {
    holes: {
        thumb?: { enabled: boolean; size: HoleSize }; // UPDATED TYPE
        middle?: { size: HoleSize }; // UPDATED TYPE
        ring?: { size: HoleSize }; // UPDATED TYPE
        index?: { size: HoleSize }; // UPDATED TYPE
        pinky?: { size: HoleSize }; // UPDATED TYPE
    };
}): {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    insertSummary: {
        totalInserts: number;
        manufacturers: string[];
        potentialIssues: string[];
    };
} => {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    // Validate all holes
    const fingerHoleValidation = validateAllFingerHoles(drillSheet.holes);
    allErrors.push(...fingerHoleValidation.errors);
    allWarnings.push(...fingerHoleValidation.warnings);

    // Validate thumb hole if enabled
    if (drillSheet.holes.thumb?.enabled && drillSheet.holes.thumb.size) {
        const thumbValidation = validateHoleSize(drillSheet.holes.thumb.size, 'Thumb', true);
        allErrors.push(...thumbValidation.errors);
        allWarnings.push(...thumbValidation.warnings);
    }

    // Generate insert summary
    const insertsUsed = Object.values(drillSheet.holes)
        .filter(hole => hole?.size?.hasInsert && hole.size.insert)
        .map(hole => hole!.size.insert!);

    const manufacturers = [...new Set(insertsUsed.map(insert => insert.manufacturer))];
    const potentialIssues: string[] = [];

    // Check for mixed manufacturers
    if (manufacturers.length > 1) {
        potentialIssues.push(`Multiple insert manufacturers used: ${manufacturers.join(', ')}. Consider using consistent brand for optimal feel.`);
    }

    // Check for missing colors
    const insertsWithoutColor = insertsUsed.filter(insert => !insert.color);
    if (insertsWithoutColor.length > 0) {
        potentialIssues.push(`${insertsWithoutColor.length} insert(s) missing color specification.`);
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        insertSummary: {
            totalInserts: insertsUsed.length,
            manufacturers,
            potentialIssues
        }
    };
};