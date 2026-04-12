const express = require('express')
const { requireAuth } = require('../middleware/auth')
const authController = require('../controllers/authController')

const router = express.Router()

// Public endpoints
router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/verify-email', authController.verifyEmail)
router.post('/verify-email', authController.verifyEmail)

// Protected endpoints
router.get('/me', requireAuth, authController.getCurrentUser)
router.patch('/me', requireAuth, authController.updateCurrentUser)
router.patch('/password', requireAuth, authController.changePassword)

module.exports = router
