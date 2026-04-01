const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const assetsController = require('../controllers/assetsController')

const router = express.Router()

// All asset endpoints require authentication
// Each endpoint checks specific permissions

router.get('/', requireAuth, requirePermission('asset:read'), assetsController.listAssets)

router.post('/scan', requireAuth, requirePermission('asset:scan'), assetsController.scanAsset)
router.patch('/location', requireAuth, requirePermission('asset:move'), assetsController.updateLocation)
router.patch('/status', requireAuth, requirePermission('asset:update'), assetsController.updateStatus)
router.post('/swap-monitor', requireAuth, requirePermission('asset:swap'), assetsController.swapMonitor)
router.post('/iot/scan-update', requireAuth, requirePermission('asset:scan'), assetsController.iotScanUpdate)

module.exports = router
