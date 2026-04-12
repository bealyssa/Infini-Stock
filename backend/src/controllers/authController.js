const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../middleware/auth')
const { AppDataSource } = require('../config/dataSource')
const Profile = require('../models/Profile')
const { hashPassword, verifyPassword } = require('../utils/password')
const crypto = require('crypto')

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sha256Hex(value) {
    return crypto.createHash('sha256').update(value).digest('hex')
}

function isStrongEnoughPassword(password) {
    return typeof password === 'string' && password.length >= 8
}

/**
 * Generate JWT token
 */
function generateToken(userId, email, role) {
    const token = jwt.sign(
        {
            sub: userId,
            email,
            role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        },
        JWT_SECRET,
    )
    return token
}

/**
 * Register a new user
 * Default role: 'staff'
 */
async function register(req, res) {
    try {
        const { full_name, email, password, role } = req.body

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: 'Missing required fields: full_name, email, password'
            })
        }

        const profileRepo = AppDataSource.getRepository(Profile)

        // Check if user exists
        const existing = await profileRepo.findOne({ where: { email } })
        if (existing) {
            return res.status(409).json({ message: 'User already exists' })
        }

        // Hash password
        const password_hash = await hashPassword(password)

        // Create new profile with default role 'staff'
        const profile = profileRepo.create({
            full_name,
            email,
            password_hash,
            role: role || 'staff', // Default to 'staff' if not specified
            is_active: true,
        })

        const saved = await profileRepo.save(profile)

        // Generate token
        const token = generateToken(saved.id, saved.email, saved.role)

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: saved.id,
                email: saved.email,
                full_name: saved.full_name,
                role: saved.role,
            },
            token,
        })
    } catch (error) {
        console.error('Register error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Login user
 * Validate password with bcrypt
 */
async function login(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: 'Missing required fields: email, password'
            })
        }

        const profileRepo = AppDataSource.getRepository(Profile)

        // Find user by email
        const profile = await profileRepo.findOne({ where: { email } })
        if (!profile) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, profile.password_hash)
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        if (!profile.is_active) {
            return res.status(403).json({ message: 'User account is inactive' })
        }

        // Generate token
        const token = generateToken(profile.id, profile.email, profile.role)

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
            },
            token,
        })
    } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Get current user info from token
 */
async function getCurrentUser(req, res) {
    try {
        const userId = req.auth?.userId

        const profileRepo = AppDataSource.getRepository(Profile)
        const profile = await profileRepo.findOne({ where: { id: userId } })

        if (!profile) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.status(200).json({
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                is_active: profile.is_active,
                created_at: profile.created_at,
            },
        })
    } catch (error) {
        console.error('Get current user error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Update current user's basic information.
 * Body: { full_name?, email? }
 */
async function updateCurrentUser(req, res) {
    try {
        const userId = req.auth?.userId
        const { full_name, email } = req.body || {}

        if (!full_name && !email) {
            return res.status(400).json({ message: 'No fields provided to update' })
        }

        const profileRepo = AppDataSource.getRepository(Profile)
        const profile = await profileRepo.findOne({ where: { id: userId } })

        if (!profile) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (typeof full_name === 'string') {
            const trimmedName = full_name.trim()
            if (!trimmedName) {
                return res.status(400).json({ message: 'Full name is required' })
            }
            profile.full_name = trimmedName
        }

        let emailChanged = false
        if (typeof email === 'string') {
            const trimmedEmail = email.trim().toLowerCase()
            if (!isValidEmail(trimmedEmail)) {
                return res.status(400).json({ message: 'Invalid email format' })
            }

            if (trimmedEmail !== profile.email) {
                const existing = await profileRepo.findOne({ where: { email: trimmedEmail } })
                if (existing && existing.id !== profile.id) {
                    return res.status(409).json({ message: 'Email already in use' })
                }
                profile.email = trimmedEmail
                emailChanged = true
            }
        }

        const saved = await profileRepo.save(profile)

        // Refresh token if email changed so claims stay in sync.
        const token = emailChanged
            ? generateToken(saved.id, saved.email, saved.role)
            : null

        return res.status(200).json({
            message: 'Account updated',
            user: {
                id: saved.id,
                email: saved.email,
                full_name: saved.full_name,
                role: saved.role,
                is_active: saved.is_active,
            },
            token,
        })
    } catch (error) {
        console.error('Update current user error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Change current user's password.
 * Body: { current_password, new_password }
 */
async function changePassword(req, res) {
    try {
        const userId = req.auth?.userId
        const { current_password, new_password } = req.body || {}

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: 'Missing required fields: current_password, new_password',
            })
        }

        if (!isStrongEnoughPassword(new_password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' })
        }

        const profileRepo = AppDataSource.getRepository(Profile)
        const profile = await profileRepo.findOne({ where: { id: userId } })

        if (!profile) {
            return res.status(404).json({ message: 'User not found' })
        }

        const ok = await verifyPassword(current_password, profile.password_hash)
        if (!ok) {
            return res.status(400).json({ message: 'Current password is incorrect' })
        }

        profile.password_hash = await hashPassword(new_password)
        await profileRepo.save(profile)

        return res.status(200).json({ message: 'Password updated' })
    } catch (error) {
        console.error('Change password error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Verify email token and activate account.
 * Supports GET (from email link) and POST (API clients).
 */
async function verifyEmail(req, res) {
    try {
        const email = (req.query.email || req.body.email || '').trim()
        const token = (req.query.token || req.body.token || '').trim()

        if (!email || !token) {
            return res
                .status(400)
                .json({ message: 'Missing required fields: email, token' })
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' })
        }

        const profileRepo = AppDataSource.getRepository(Profile)
        const profile = await profileRepo.findOne({ where: { email } })

        if (!profile) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (profile.email_verified_at) {
            // Already verified: ensure account is active.
            if (!profile.is_active) {
                profile.is_active = true
                await profileRepo.save(profile)
            }
            return res.status(200).json({ message: 'Email already verified' })
        }

        if (!profile.email_verification_token_hash || !profile.email_verification_expires_at) {
            return res.status(400).json({ message: 'No pending email verification' })
        }

        const now = new Date()
        const expiresAt = new Date(profile.email_verification_expires_at)
        if (Number.isNaN(expiresAt.getTime()) || expiresAt < now) {
            return res.status(400).json({ message: 'Verification token expired' })
        }

        const tokenHash = sha256Hex(token)
        if (tokenHash !== profile.email_verification_token_hash) {
            return res.status(400).json({ message: 'Invalid verification token' })
        }

        profile.email_verified_at = now
        profile.is_active = true
        profile.email_verification_token_hash = null
        profile.email_verification_expires_at = null

        await profileRepo.save(profile)

        return res.status(200).json({
            message: 'Email verified successfully. Account activated.',
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                is_active: profile.is_active,
            },
        })
    } catch (error) {
        console.error('Verify email error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

module.exports = {
    register,
    login,
    getCurrentUser,
    updateCurrentUser,
    changePassword,
    generateToken,
    verifyEmail,
}
