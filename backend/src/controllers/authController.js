const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../middleware/auth')
const { AppDataSource } = require('../config/dataSource')
const Profile = require('../models/Profile')
const { hashPassword, verifyPassword } = require('../utils/password')

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

module.exports = {
    register,
    login,
    getCurrentUser,
    generateToken,
}
