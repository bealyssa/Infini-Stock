const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const monitorsController = require('../controllers/monitorsController')

const router = express.Router()

router.get('/', requireAuth, requirePermission('monitor:read'), monitorsController.listMonitors)
router.post('/', requireAuth, requirePermission('monitor:create'), monitorsController.createMonitor)
router.patch('/:id', requireAuth, requirePermission('monitor:update'), monitorsController.updateMonitor)
router.delete('/:id', requireAuth, requirePermission('monitor:delete'), monitorsController.deleteMonitor)

module.exports = router