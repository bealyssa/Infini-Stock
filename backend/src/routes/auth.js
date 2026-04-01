const express = require('express')
const { requireAuth } = require('../middleware/auth')
const authController = require('../controllers/authController')

const router = express.Router()

// Public endpoints
router.post('/register', authController.register)
router.post('/login', authController.login)

// Protected endpoints
router.get('/me', requireAuth, authController.getCurrentUser)

module.exports = router
