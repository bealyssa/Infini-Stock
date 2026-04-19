const express = require('express')
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth')
const adminController = require('../controllers/adminController')

const router = express.Router()

// All admin routes require authentication
router.use(requireAuth)

// User management endpoints
// GET /users - read users (admin, manager)
router.get('/users', requirePermission('user:read'), adminController.getAllUsers)

// POST /users - create users (admin, manager)
router.post('/users', requirePermission('user:create'), adminController.createUser)

// PATCH /users/:id - update users (admin, manager)
router.patch('/users/:id', requirePermission('user:update'), adminController.updateUser)

// DELETE /users/:id - delete users (admin only)
router.delete('/users/:id', requireRole('admin'), adminController.deleteUser)

module.exports = router
