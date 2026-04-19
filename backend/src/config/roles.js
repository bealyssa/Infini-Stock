/**
 * Role Definitions for Infini-Stock
 * Hierarchical system: highest permission first
 */

const ROLES = {
    ADMIN: 'admin',           // Full system access
    MANAGER: 'manager',       // Asset management, monitoring, reports
    TECHNICIAN: 'technician', // Scan assets, update status, swap monitors
    STAFF: 'staff',           // Read-only access (default)
    VIEWER: 'viewer',         // Audit/viewer role (minimal access)
}

/**
 * Permissions Matrix
 * Defines what each role can do
 */
const PERMISSIONS = {
    // Dashboard & Monitoring
    'dashboard:view': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'dashboard:edit': ['admin', 'manager'],
    'activity:view': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'activity:export': ['admin', 'manager'],

    // Asset Management
    'asset:create': ['admin', 'manager'],
    'asset:read': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'asset:update': ['admin', 'manager', 'technician'],
    'asset:delete': ['admin'],
    'asset:scan': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'asset:move': ['admin', 'manager', 'technician'],
    'asset:swap': ['admin', 'manager', 'technician'],

    // System Units
    'unit:create': ['admin', 'manager'],
    'unit:read': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'unit:update': ['admin', 'manager'],
    'unit:delete': ['admin'],

    // Monitors
    'monitor:create': ['admin', 'manager'],
    'monitor:read': ['admin', 'manager', 'technician', 'staff', 'viewer'],
    'monitor:update': ['admin', 'manager'],
    'monitor:delete': ['admin'],

    // QR Codes
    'qr:generate': ['admin', 'manager', 'technician'],
    'qr:view': ['admin', 'manager', 'technician', 'staff', 'viewer'],

    // User Management
    // Managers can create/read/update staff & technician users only
    // Only admins can manage admin users and assign roles
    'user:create': ['admin', 'manager'],
    'user:read': ['admin', 'manager'],
    'user:update': ['admin', 'manager'],
    'user:delete': ['admin'],
    'user:assign_role': ['admin'],

    // Reports
    'report:view': ['admin', 'manager'],
    'report:generate': ['admin', 'manager'],
    'report:export': ['admin', 'manager'],

    // Settings
    'settings:view': ['admin'],
    'settings:update': ['admin'],
}

/**
 * Role Hierarchy for fallback permissions
 * If a role isn't explicitly listed, check parent roles
 */
const ROLE_HIERARCHY = {
    admin: [],
    manager: ['technician'],
    technician: ['staff'],
    staff: ['viewer'],
    viewer: [],
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_HIERARCHY,
}
