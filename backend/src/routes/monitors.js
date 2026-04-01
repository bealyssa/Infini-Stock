const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const monitorsController = require('../controllers/monitorsController')

const router = express.Router()

router.get('/', requireAuth, requirePermission('monitor:read'), monitorsController.listMonitors)

module.exports = router