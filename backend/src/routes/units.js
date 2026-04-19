const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const unitsController = require('../controllers/unitsController')

const router = express.Router()

router.get('/', requireAuth, requirePermission('unit:read'), unitsController.listUnits)
router.post('/', requireAuth, requirePermission('unit:create'), unitsController.createUnit)
router.patch('/:id', requireAuth, requirePermission('unit:update'), unitsController.updateUnit)
router.delete('/:id', requireAuth, requirePermission('unit:delete'), unitsController.deleteUnit)

module.exports = router