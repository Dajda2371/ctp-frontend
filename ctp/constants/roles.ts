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

// Roles that can be managed by lower-tier managers (PM/FM)
const SUBORDINATE_ROLES = [UserRole.TECHNICIAN, UserRole.CLEANING];

// All roles ordered by hierarchy (highest first)
export const ALL_ROLES = [
    UserRole.ADMIN,
    UserRole.PROPERTY_MANAGER,
    UserRole.FACILITY_MANAGER,
    UserRole.TECHNICIAN,
    UserRole.CLEANING,
];

/**
 * Normalize role strings to match enum values (lowercase, no spaces)
 */
export const normalizeRole = (role?: string): UserRole | undefined => {
    if (!role) return undefined;
    const normalized = role.toLowerCase().replace(/\s+/g, '_') as UserRole;
    if (Object.values(UserRole).includes(normalized)) {
        return normalized;
    }
    return undefined;
};

/**
 * Check if user can access User Management section
 */
export const canManageUsers = (role?: string) => {
    const normalized = normalizeRole(role);
    return [UserRole.ADMIN, UserRole.PROPERTY_MANAGER, UserRole.FACILITY_MANAGER].includes(normalized!);
};

/**
 * Get list of roles that the current user can manage (create/edit/delete)
 */
export const getManageableRoles = (role?: string): UserRole[] => {
    const normalized = normalizeRole(role);
    if (normalized === UserRole.ADMIN) {
        return ALL_ROLES; // Admin can manage everyone
    }
    if (normalized === UserRole.PROPERTY_MANAGER || normalized === UserRole.FACILITY_MANAGER) {
        return SUBORDINATE_ROLES; // PM/FM can only manage Technicians and Cleaning
    }
    return []; // Others cannot manage anyone
};

/**
 * Check if current user can edit/delete the target user based on role hierarchy
 */
export const canEditUser = (currentRole?: string, targetRole?: string): boolean => {
    if (!currentRole || !targetRole) return false;
    const normalizedCurrent = normalizeRole(currentRole);
    const normalizedTarget = normalizeRole(targetRole);

    if (!normalizedCurrent || !normalizedTarget) return false;

    const manageableRoles = getManageableRoles(normalizedCurrent);
    return manageableRoles.includes(normalizedTarget);
};

export const canManageSites = (role?: string) => {
    const normalized = normalizeRole(role);
    return [UserRole.ADMIN, UserRole.PROPERTY_MANAGER, UserRole.FACILITY_MANAGER].includes(normalized!);
};

export const canViewTasks = (role?: string) => true; // All roles can view tasks
