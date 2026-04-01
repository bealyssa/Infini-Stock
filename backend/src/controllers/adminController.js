const { AppDataSource } = require('../config/dataSource')
const Profile = require('../models/Profile')
const { hashPassword } = require('../utils/password')

/**
 * Get all users
 * Admin only
 */
async function getAllUsers(req, res) {
    try {
        const profileRepo = AppDataSource.getRepository(Profile)

        const users = await profileRepo.find({
            order: {
                created_at: 'DESC',
            },
        })

        const sanitized = users.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }))

        return res.status(200).json(sanitized)
    } catch (error) {
        console.error('Get all users error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Create a new user
 * Admin only
 */
async function createUser(req, res) {
    try {
        const { full_name, email, password, role } = req.body

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: 'Missing required fields: full_name, email, password',
            })
        }

        const profileRepo = AppDataSource.getRepository(Profile)

        // Check if user already exists
        const existing = await profileRepo.findOne({ where: { email } })
        if (existing) {
            return res.status(409).json({ message: 'User already exists' })
        }

        // Hash password
        const password_hash = await hashPassword(password)

        // Create new user
        const profile = profileRepo.create({
            full_name,
            email,
            password_hash,
            role: role || 'staff',
            is_active: true,
        })

        const saved = await profileRepo.save(profile)

        return res.status(201).json({
            id: saved.id,
            full_name: saved.full_name,
            email: saved.email,
            role: saved.role,
            is_active: saved.is_active,
            created_at: saved.created_at,
        })
    } catch (error) {
        console.error('Create user error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Update a user
 * Admin only
 */
async function updateUser(req, res) {
    try {
        const { id } = req.params
        const { full_name, email, password, role, is_active } = req.body

        const profileRepo = AppDataSource.getRepository(Profile)

        const user = await profileRepo.findOne({ where: { id } })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Update fields
        if (full_name) user.full_name = full_name
        if (role) user.role = role
        if (is_active !== undefined) user.is_active = is_active
        // Note: password is not updated in this demo (use bcrypt in production)

        const updated = await profileRepo.save(user)

        return res.status(200).json({
            id: updated.id,
            full_name: updated.full_name,
            email: updated.email,
            role: updated.role,
            is_active: updated.is_active,
            updated_at: updated.updated_at,
        })
    } catch (error) {
        console.error('Update user error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

/**
 * Delete a user
 * Admin only
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params

        const profileRepo = AppDataSource.getRepository(Profile)

        const user = await profileRepo.findOne({ where: { id } })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        await profileRepo.remove(user)

        return res.status(200).json({
            message: 'User deleted successfully',
            id,
        })
    } catch (error) {
        console.error('Delete user error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
}
