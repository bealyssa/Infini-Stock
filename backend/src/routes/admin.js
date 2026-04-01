const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const adminController = require('../controllers/adminController')

const router = express.Router()

// All admin routes require authentication and admin role
router.use(requireAuth)
router.use(requireRole('admin'))

// User management endpoints
router.get('/users', adminController.getAllUsers)
router.post('/users', adminController.createUser)
router.patch('/users/:id', adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

module.exports = router
