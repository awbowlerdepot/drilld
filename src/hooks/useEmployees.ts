import { useState, useEffect } from 'react';
import { Employee } from '../types';
import { mockEmployees } from '../data/mockData';

export const useEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setEmployees(mockEmployees);
            setLoading(false);
        }, 500);
    }, []);

    const addEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
        const newEmployee: Employee = {
            ...employee,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        setEmployees(prev => [...prev, newEmployee]);
        return newEmployee;
    };

    const updateEmployee = (id: string, updates: Partial<Employee>) => {
        setEmployees(prev =>
            prev.map(employee =>
                employee.id === id ? { ...employee, ...updates } : employee
            )
        );
    };

    const deleteEmployee = (id: string) => {
        setEmployees(prev => prev.filter(employee => employee.id !== id));
    };

    const deactivateEmployee = (id: string) => {
        updateEmployee(id, { active: false });
    };

    const activateEmployee = (id: string) => {
        updateEmployee(id, { active: true });
    };

    const getEmployeeById = (id: string) => {
        return employees.find(employee => employee.id === id);
    };

    const getEmployeesByRole = (role: Employee['role']) => {
        return employees.filter(employee => employee.role === role && employee.active);
    };

    const getEmployeesByLocation = (locationId: string) => {
        return employees.filter(employee =>
            employee.locations.includes(locationId) && employee.active
        );
    };

    const getEmployeesBySpecialty = (specialty: string) => {
        return employees.filter(employee =>
            employee.specialties.includes(specialty) && employee.active
        );
    };

    const getActiveEmployees = () => {
        return employees.filter(employee => employee.active);
    };

    const getInactiveEmployees = () => {
        return employees.filter(employee => !employee.active);
    };

    const getEmployeesByPermission = (permission: string) => {
        return employees.filter(employee =>
            employee.permissions.includes(permission) && employee.active
        );
    };

    const getEmployeesWithCertification = (certification: string) => {
        return employees.filter(employee =>
            employee.certifications &&
            Object.keys(employee.certifications).includes(certification) &&
            employee.active
        );
    };

    const getEmployeeWorkload = (employeeId: string, workOrders: Array<{performedByEmployeeID?: string, workDate: string}>) => {
        const today = new Date();
        const thisMonth = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            return wo.performedByEmployeeID === employeeId &&
                workDate.getMonth() === today.getMonth() &&
                workDate.getFullYear() === today.getFullYear();
        });

        const thisWeek = workOrders.filter(wo => {
            const workDate = new Date(wo.workDate);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return wo.performedByEmployeeID === employeeId && workDate >= weekAgo;
        });

        return {
            thisMonth: thisMonth.length,
            thisWeek: thisWeek.length,
            total: workOrders.filter(wo => wo.performedByEmployeeID === employeeId).length
        };
    };

    const getEmployeeStats = () => {
        const activeCount = employees.filter(e => e.active).length;
        const inactiveCount = employees.filter(e => !e.active).length;

        const roleBreakdown = employees.reduce((acc, emp) => {
            if (emp.active) {
                acc[emp.role] = (acc[emp.role] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const avgHourlyRate = employees
                .filter(e => e.active && e.hourlyRate)
                .reduce((sum, e) => sum + (e.hourlyRate || 0), 0) /
            employees.filter(e => e.active && e.hourlyRate).length || 0;

        const specialtyBreakdown = employees
            .filter(e => e.active)
            .flatMap(e => e.specialties)
            .reduce((acc, specialty) => {
                acc[specialty] = (acc[specialty] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const locationCoverage = employees
            .filter(e => e.active)
            .flatMap(e => e.locations)
            .reduce((acc, location) => {
                acc[location] = (acc[location] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        return {
            total: employees.length,
            active: activeCount,
            inactive: inactiveCount,
            roleBreakdown,
            avgHourlyRate: Number(avgHourlyRate.toFixed(2)),
            specialtyBreakdown,
            locationCoverage
        };
    };

    const searchEmployees = (searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        return employees.filter(employee =>
            employee.firstName.toLowerCase().includes(term) ||
            employee.lastName.toLowerCase().includes(term) ||
            employee.email.toLowerCase().includes(term) ||
            employee.username.toLowerCase().includes(term) ||
            employee.specialties.some(specialty => specialty.toLowerCase().includes(term))
        );
    };

    const getEmployeesAvailableForLocation = (locationId: string) => {
        return employees.filter(employee =>
            employee.active && employee.locations.includes(locationId)
        );
    };

    const getTechnicians = () => {
        return employees.filter(employee =>
            employee.active &&
            (employee.role === 'TECHNICIAN' ||
                employee.role === 'SENIOR_TECH' ||
                employee.role === 'MANAGER')
        );
    };

    return {
        employees,
        loading,
        error,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        deactivateEmployee,
        activateEmployee,
        getEmployeeById,
        getEmployeesByRole,
        getEmployeesByLocation,
        getEmployeesBySpecialty,
        getActiveEmployees,
        getInactiveEmployees,
        getEmployeesByPermission,
        getEmployeesWithCertification,
        getEmployeeWorkload,
        getEmployeeStats,
        searchEmployees,
        getEmployeesAvailableForLocation,
        getTechnicians
    };
};