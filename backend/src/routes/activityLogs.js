const express = require('express')
const { requireAuth } = require('../middleware/auth')
const activityLogsController = require('../controllers/activityLogsController')

const router = express.Router()

router.get('/', requireAuth, activityLogsController.listActivityLogs)

module.exports = router
