const express = require('express')
const { requireAuth, requirePermission } = require('../middleware/auth')
const unitsController = require('../controllers/unitsController')

const router = express.Router()

router.get('/', requireAuth, requirePermission('unit:read'), unitsController.listUnits)

module.exports = router