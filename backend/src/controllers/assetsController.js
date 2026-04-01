const assetService = require('../services/assetService')
const { ok, badRequest, serverError } = require('../utils/http')

async function scanAsset(req, res) {
    try {
        const { qrCode } = req.body
        if (!qrCode) return badRequest(res, 'qrCode is required')

        const asset = await assetService.getAssetByQr(qrCode)
        if (!asset) return res.status(404).json({ message: 'Asset not found' })

        return ok(res, {
            id: asset.id,
            qrCode: asset.qr_code,
            type: asset.type,
            status: asset.status,
            location: asset.location,
            parentId: asset.parent?.id || null,
        })
    } catch {
        return serverError(res, 'Failed to scan asset')
    }
}

async function listAssets(req, res) {
    try {
        const assets = await assetService.listAssets()

        return ok(
            res,
            assets.map((asset) => ({
                id: asset.id,
                qrCode: asset.qr_code,
                type: asset.type,
                status: asset.status,
                location: asset.location,
                parentId: asset.parent?.id || null,
                parentQrCode: asset.parent?.qr_code || null,
                createdBy: asset.creator?.full_name || null,
                createdAt: asset.created_at,
            })),
        )
    } catch {
        return serverError(res, 'Failed to list assets')
    }
}

async function updateLocation(req, res) {
    try {
        const { qrCode, location } = req.body
        if (!qrCode || !location) {
            return badRequest(res, 'qrCode and location are required')
        }

        const result = await assetService.updateAssetLocation({
            qrCode,
            newLocation: location,
            userId: req.auth?.userId,
            action: 'move',
        })

        if (result.error) return res.status(404).json({ message: result.error })
        return ok(res, { message: 'Location updated', asset: result.asset })
    } catch {
        return serverError(res, 'Failed to update location')
    }
}

async function updateStatus(req, res) {
    try {
        const { qrCode, status } = req.body
        if (!qrCode || !status) {
            return badRequest(res, 'qrCode and status are required')
        }

        const allowed = ['active', 'broken', 'repair']
        if (!allowed.includes(status)) {
            return badRequest(res, 'Invalid status')
        }

        const result = await assetService.updateAssetStatus({
            qrCode,
            newStatus: status,
            userId: req.auth?.userId,
            action: status === 'repair' ? 'repair' : 'update',
        })

        if (result.error) return res.status(404).json({ message: result.error })
        return ok(res, { message: 'Status updated', asset: result.asset })
    } catch {
        return serverError(res, 'Failed to update status')
    }
}

async function swapMonitor(req, res) {
    try {
        const { systemUnitQr, oldMonitorQr, newMonitorQr } = req.body
        if (!systemUnitQr || !oldMonitorQr || !newMonitorQr) {
            return badRequest(
                res,
                'systemUnitQr, oldMonitorQr, and newMonitorQr are required',
            )
        }

        const result = await assetService.swapMonitor({
            systemUnitQr,
            oldMonitorQr,
            newMonitorQr,
            userId: req.auth?.userId,
        })

        if (result.error) return badRequest(res, result.error)
        return ok(res, { message: 'Monitor swap completed', data: result })
    } catch {
        return serverError(res, 'Failed to swap monitor')
    }
}

async function iotScanUpdate(req, res) {
    try {
        const { qrCode, location, status } = req.body
        if (!qrCode) return badRequest(res, 'qrCode is required')

        let responsePayload = { qrCode }

        if (location) {
            const moved = await assetService.updateAssetLocation({
                qrCode,
                newLocation: location,
                userId: req.auth?.userId,
                action: 'move',
            })
            if (moved.error) return badRequest(res, moved.error)
            responsePayload.location = moved.asset.location
        }

        if (status) {
            const changed = await assetService.updateAssetStatus({
                qrCode,
                newStatus: status,
                userId: req.auth?.userId,
                action: status === 'repair' ? 'repair' : 'update',
            })
            if (changed.error) return badRequest(res, changed.error)
            responsePayload.status = changed.asset.status
        }

        return ok(res, {
            message: 'IoT scan processed',
            data: responsePayload,
        })
    } catch {
        return serverError(res, 'Failed to process IoT scan')
    }
}

module.exports = {
    listAssets,
    scanAsset,
    updateLocation,
    updateStatus,
    swapMonitor,
    iotScanUpdate,
}
