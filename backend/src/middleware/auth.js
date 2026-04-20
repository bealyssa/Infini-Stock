const jwt = require('jsonwebtoken')
const { PERMISSIONS, ROLE_HIERARCHY } = require('../config/roles')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-auth-secret-change-me'

function getTokenFromRequest(req) {
    const raw = req.headers.authorization || ''
    const [type, token] = raw.split(' ')
    if (type !== 'Bearer' || !token) return null
    return token
}

function requireAuth(req, res, next) {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'Missing bearer token' })

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.auth = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        }
        return next()
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

/**
 * Check if a user has a specific role
 */
function requireRole(roles) {
    const allow = Array.isArray(roles) ? roles : [roles]
    return (req, res, next) => {
        const role = req.auth?.role
        if (!role || !allow.includes(role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' })
        }
        return next()
    }
}

/**
 * Check if a user has a specific permission
 */
function requirePermission(permission) {
    return (req, res, next) => {
        const role = req.auth?.role
        if (!role) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        // Check if role has permission
        const allowedRoles = PERMISSIONS[permission] || []
        if (allowedRoles.includes(role)) {
            return next()
        }

        // Check role hierarchy
        const parentRoles = ROLE_HIERARCHY[role] || []
        for (const parentRole of parentRoles) {
            if (allowedRoles.includes(parentRole)) {
                return next()
            }
        }

        return res.status(403).json({
            message: `Forbidden: Missing permission '${permission}'`
        })
    }
}

/**
 * Check if a user has multiple permissions (at least one)
 */
function requireAnyPermission(permissions) {
    const perms = Array.isArray(permissions) ? permissions : [permissions]
    return (req, res, next) => {
        const role = req.auth?.role
        if (!role) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        for (const perm of perms) {
            const allowedRoles = PERMISSIONS[perm] || []
            if (allowedRoles.includes(role)) {
                return next()
            }

            const parentRoles = ROLE_HIERARCHY[role] || []
            for (const parentRole of parentRoles) {
                if (allowedRoles.includes(parentRole)) {
                    return next()
                }
            }
        }

        return res.status(403).json({
            message: `Forbidden: Missing one of required permissions`
        })
    }
}

module.exports = {
    JWT_SECRET,
    requireAuth,
    requireRole,
    requirePermission,
    requireAnyPermission,
}
