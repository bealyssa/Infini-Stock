const assetService = require('../services/assetService')
const { ok, badRequest, serverError } = require('../utils/http')
const { PERMISSIONS, ROLE_HIERARCHY } = require('../config/roles')

function roleHasPermission(role, permission) {
    const allowedRoles = PERMISSIONS[permission] || []
    if (allowedRoles.includes(role)) return true

    const parentRoles = ROLE_HIERARCHY[role] || []
    for (const parentRole of parentRoles) {
        if (allowedRoles.includes(parentRole)) return true
    }

    return false
}

async function createAsset(req, res) {
    try {
        const {
            type,
            qrCode,
            location,
            status,
            parentQrCode,
            imageData,
            description,
        } = req.body || {}

        if (!type) return badRequest(res, 'type is required')
        const allowedTypes = ['unit', 'monitor']
        if (!allowedTypes.includes(type)) {
            return badRequest(res, 'Invalid type')
        }

        if (imageData && typeof imageData !== 'string') {
            return badRequest(res, 'imageData must be a base64 string')
        }

        const result = await assetService.createAsset({
            type,
            qrCode,
            location,
            status,
            parentQrCode,
            imageData,
            description,
            userId: req.auth?.userId,
        })

        if (result.error) {
            const statusCode = result.statusCode || 400
            return res.status(statusCode).json({ message: result.error })
        }

        const asset = result.asset
        return ok(res, {
            id: asset.id,
            qrCode: asset.qr_code,
            type: asset.type,
            status: asset.status,
            location: asset.location,
            parentId: asset.parent?.id || null,
            parentQrCode: asset.parent?.qr_code || null,
            imageData: asset.image_data || null,
            description: asset.description || null,
            createdBy: asset.creator?.full_name || null,
            createdAt: asset.created_at,
        })
    } catch {
        return serverError(res, 'Failed to create asset')
    }
}

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
            imageData: asset.image_data || null,
            description: asset.description || null,
            parentId: asset.parent?.id || null,
            parentQrCode: asset.parent?.qr_code || null,
            createdBy: asset.creator?.full_name || null,
            createdAt: asset.created_at,
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
                imageData: asset.image_data || null,
                description: asset.description || null,
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

async function getAssetByQr(req, res) {
    try {
        const { qrCode } = req.params
        if (!qrCode) return badRequest(res, 'qrCode is required')

        const asset = await assetService.getAssetByQr(qrCode)
        if (!asset) {
            return ok(res, {
                exists: false,
                qrCode,
                type: null,
                status: null,
                location: null,
                imageData: null,
                description: null,
                parentId: null,
                parentQrCode: null,
                createdBy: null,
                createdAt: null,
            })
        }

        return ok(res, {
            exists: true,
            id: asset.id,
            qrCode: asset.qr_code,
            type: asset.type,
            status: asset.status,
            location: asset.location,
            imageData: asset.image_data || null,
            description: asset.description || null,
            parentId: asset.parent?.id || null,
            parentQrCode: asset.parent?.qr_code || null,
            createdBy: asset.creator?.full_name || null,
            createdAt: asset.created_at,
        })
    } catch {
        return serverError(res, 'Failed to fetch asset')
    }
}

async function upsertAssetMeta(req, res) {
    try {
        const { qrCode, type, imageData, description } = req.body || {}
        if (!qrCode) return badRequest(res, 'qrCode is required')

        if (imageData !== undefined && imageData !== null && typeof imageData !== 'string') {
            return badRequest(res, 'imageData must be a base64 string or URL')
        }

        if (type !== undefined && type !== null) {
            const allowedTypes = ['unit', 'monitor']
            if (!allowedTypes.includes(type)) {
                return badRequest(res, 'Invalid type')
            }
        }

        const existing = await assetService.getAssetByQr(qrCode)
        if (!existing) {
            const role = req.auth?.role
            if (!roleHasPermission(role, 'asset:create')) {
                return res.status(403).json({ message: "Forbidden: Missing permission 'asset:create'" })
            }
        }

        const result = await assetService.upsertAssetMeta({
            qrCode,
            type,
            imageData: imageData || null,
            description,
            userId: req.auth?.userId,
        })

        if (result.error) {
            const statusCode = result.statusCode || 400
            return res.status(statusCode).json({ message: result.error })
        }

        const asset = result.asset
        return ok(res, {
            id: asset.id,
            qrCode: asset.qr_code,
            type: asset.type,
            status: asset.status,
            location: asset.location,
            imageData: asset.image_data || null,
            description: asset.description || null,
            createdBy: asset.creator?.full_name || null,
            createdAt: asset.created_at,
        })
    } catch {
        return serverError(res, 'Failed to update asset metadata')
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
    createAsset,
    listAssets,
    getAssetByQr,
    scanAsset,
    updateLocation,
    updateStatus,
    swapMonitor,
    iotScanUpdate,
    upsertAssetMeta,
}
