const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const activityLogsController = require('../controllers/activityLogsController')

const router = express.Router()

router.get(
	'/',
	requireAuth,
	requirePermission('activity:view'),
	activityLogsController.listActivityLogs,
)

module.exports = router
