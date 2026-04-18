const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const assetsController = require('../controllers/assetsController')
const { upload } = require('../utils/fileUpload')

const router = express.Router()

// All asset endpoints require authentication
// Each endpoint checks specific permissions

router.get('/', requireAuth, requirePermission('asset:read'), assetsController.listAssets)

router.get(
	'/qr/:qrCode',
	requireAuth,
	requirePermission('asset:read'),
	assetsController.getAssetByQr,
)

router.post('/', requireAuth, requirePermission('asset:create'), upload.single('image'), assetsController.createAsset)

router.post('/scan', requireAuth, requirePermission('asset:scan'), assetsController.scanAsset)
router.patch('/location', requireAuth, requirePermission('asset:move'), assetsController.updateLocation)
router.patch('/status', requireAuth, requirePermission('asset:update'), assetsController.updateStatus)
router.post('/swap-monitor', requireAuth, requirePermission('asset:swap'), assetsController.swapMonitor)
router.post('/iot/scan-update', requireAuth, requirePermission('asset:scan'), assetsController.iotScanUpdate)

router.patch('/meta', requireAuth, requirePermission('asset:update'), upload.single('image'), assetsController.upsertAssetMeta)

module.exports = router
