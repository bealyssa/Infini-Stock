/**
 * Check if user has edit/delete permissions
 * Staff and Viewer roles are read-only
 */
export function canEditData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user?.role?.toLowerCase()
    
    // Staff and Viewer are read-only
    return role !== 'staff' && role !== 'viewer'
}

/**
 * Check if user is in view-only mode
 */
export function isViewOnly() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user?.role?.toLowerCase()

    return role === 'staff' || role === 'viewer'
}

/**
 * Check if user is Technician with limited operations
 * Technician can edit but NOT create/add new items
 */
export function isTechnicianLimitedOps() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user?.role?.toLowerCase()

    return role === 'technician'
}

/**
 * Get user role
 */
export function getUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user?.role || 'unknown'
}

/**
 * Get operation status message for Technician
 */
export function getTechnicianOperations() {
    return {
        canAdd: false,
        canEdit: true,
        canDelete: false,
        display: 'Edit & Scan',
    }
}

/**
 * Check if user is Manager
 */
export function isManager() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user?.role?.toLowerCase()

    return role === 'manager'
}

/**
 * Get operation status message for Manager
 */
export function getManagerOperations() {
    return {
        canAdd: true,
        canEdit: true,
        canDelete: true,
        display: 'Manage Staff & Technician',
    }
}
