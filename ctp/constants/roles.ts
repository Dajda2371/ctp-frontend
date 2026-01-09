export enum UserRole {
    ADMIN = 'admin',
    PROPERTY_MANAGER = 'property_manager',
    FACILITY_MANAGER = 'facility_manager',
    TECHNICIAN = 'technician',
    CLEANING = 'cleaning',
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.PROPERTY_MANAGER]: 'Property Manager',
    [UserRole.FACILITY_MANAGER]: 'Facility Manager',
    [UserRole.TECHNICIAN]: 'Technician',
    [UserRole.CLEANING]: 'Cleaning',
};

export const canManageUsers = (role?: UserRole) => role === UserRole.ADMIN;
export const canManageSites = (role?: UserRole) => [UserRole.ADMIN, UserRole.PROPERTY_MANAGER, UserRole.FACILITY_MANAGER].includes(role!);
export const canViewTasks = (role?: UserRole) => true; // All roles can view tasks
