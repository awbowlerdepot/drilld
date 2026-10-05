/**
 * Job role at a location, in order of seniority.
 */
export type EmployeeRole =
    | 'MANAGER'
    | 'SENIOR_TECH'
    | 'TECHNICIAN'
    | 'APPRENTICE';

/**
 * Company-wide administrative access. Not a job role: owners and admins
 * can manage the whole company and every location. Everyone else gets
 * their permissions from their role at each location.
 */
export type CompanyRole = 'OWNER' | 'ADMIN';

/**
 * An employee's role at one location.
 */
export interface LocationMembership {
    locationID: string;
    role: EmployeeRole;
}

export interface Employee {
    id: string;
    companyID: string;
    cognitoUserID: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyRole?: CompanyRole;
    memberships: LocationMembership[];
    certifications: Record<string, any>;
    hireDate?: string;
    hourlyRate?: number;
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
    companyRole?: CompanyRole;
    memberships: LocationMembership[];
    certifications: Record<string, any>;
    hireDate: string;
    hourlyRate: number;
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
    APPRENTICE: [
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