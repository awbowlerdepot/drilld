/** GET /me: the signed-in user, their company and their location roles. */
export interface MeDto {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        companyRole: 'OWNER' | 'ADMIN' | null;
    };
    company: { id: string; name: string };
    memberships: { locationID: string; role: 'MANAGER' | 'SENIOR_TECH' | 'TECHNICIAN' | 'APPRENTICE' }[];
}
