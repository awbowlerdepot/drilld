export type EmployeeRole =
    | 'MANAGER'
    | 'SENIOR_TECH'
    | 'TECHNICIAN'
    | 'PART_TIME'
    | 'INTERN';

export interface Employee {
    id: string;
    proshopID: string;
    cognitoUserID: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: EmployeeRole;
    permissions: string[];
    certifications: Record<string, any>;
    hireDate?: string;
    hourlyRate?: number;
    locations: string[];
    specialties: string[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeFormData {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: EmployeeRole;
    permissions: string[];
    certifications: Record<string, any>;
    hireDate: string;
    hourlyRate: number;
    locations: string[];
    specialties: string[];
}

export interface EmployeeStats {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    employeesByRole: Record<EmployeeRole, number>;
    averageHourlyRate: number;
    totalSpecialties: number;
}

export interface EmployeeWorkload {
    employeeId: string;
    activeWorkOrders: number;
    completedWorkOrders: number;
    averageCompletionTime: number;
    specialtyUtilization: Record<string, number>;
}

// Permission categories for easier management
export const PERMISSION_CATEGORIES = {
    CUSTOMERS: ['read:customers', 'write:customers', 'delete:customers'],
    WORK_ORDERS: ['read:workorders', 'write:workorders', 'delete:workorders'],
    BOWLING_BALLS: ['read:balls', 'write:balls', 'delete:balls'],
    DRILL_SHEETS: ['read:drillsheets', 'write:drillsheets', 'delete:drillsheets'],
    EMPLOYEES: ['read:employees', 'write:employees', 'delete:employees'],
    ANALYTICS: ['read:analytics'],
    SETTINGS: ['manage:settings']
} as const;

// Default permissions by role
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<EmployeeRole, string[]> = {
    MANAGER: [
        ...PERMISSION_CATEGORIES.CUSTOMERS,
        ...PERMISSION_CATEGORIES.WORK_ORDERS,
        ...PERMISSION_CATEGORIES.BOWLING_BALLS,
        ...PERMISSION_CATEGORIES.DRILL_SHEETS,
        ...PERMISSION_CATEGORIES.EMPLOYEES,
        ...PERMISSION_CATEGORIES.ANALYTICS,
        ...PERMISSION_CATEGORIES.SETTINGS
    ],
    SENIOR_TECH: [
        ...PERMISSION_CATEGORIES.CUSTOMERS,
        ...PERMISSION_CATEGORIES.WORK_ORDERS,
        ...PERMISSION_CATEGORIES.BOWLING_BALLS,
        ...PERMISSION_CATEGORIES.DRILL_SHEETS,
        'read:employees',
        'read:analytics'
    ],
    TECHNICIAN: [
        'read:customers', 'write:customers',
        ...PERMISSION_CATEGORIES.WORK_ORDERS,
        ...PERMISSION_CATEGORIES.BOWLING_BALLS,
        'read:drillsheets', 'write:drillsheets',
        'read:employees'
    ],
    PART_TIME: [
        'read:customers',
        'read:workorders', 'write:workorders',
        'read:balls', 'write:balls',
        'read:drillsheets'
    ],
    INTERN: [
        'read:customers',
        'read:workorders',
        'read:balls',
        'read:drillsheets'
    ]
};

// Specialty categories
export const SPECIALTY_CATEGORIES = {
    DRILLING: ['Ball Drilling', 'Layout Design', 'Weight Holes'],
    MODIFICATIONS: ['Surface Adjustments', 'Thumb Slugs', 'Finger Inserts'],
    CONSULTATION: ['Customer Consultation', 'Ball Recommendation'],
    MAINTENANCE: ['Equipment Maintenance', 'Shop Operations']
} as const;