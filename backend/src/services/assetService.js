const { AppDataSource } = require('../config/dataSource')
const crypto = require('crypto')

function generateQrCandidate(type) {
    const prefix = type === 'monitor' ? 'MON' : 'UNIT'
    return `${prefix}-${crypto.randomUUID()}`
}

async function getAssetByQr(qrCode) {
    const assetRepo = AppDataSource.getRepository('Asset')
    return assetRepo.findOne({
        where: { qr_code: qrCode },
        relations: { parent: true, children: true, creator: true },
    })
}

async function listAssets() {
    const assetRepo = AppDataSource.getRepository('Asset')
    return assetRepo.find({
        relations: { parent: true, creator: true },
        order: { created_at: 'DESC' },
    })
}

async function createActivityLog(payload) {
    const activityRepo = AppDataSource.getRepository('ActivityLog')
    const created = activityRepo.create(payload)
    return activityRepo.save(created)
}

async function createAsset({
    type,
    qrCode,
    location,
    status,
    parentQrCode,
    imageData,
    description,
    userId,
}) {
    const assetRepo = AppDataSource.getRepository('Asset')

    const normalizedLocation = (location && String(location).trim()) || 'Unassigned'
    const normalizedStatus = (status && String(status).trim()) || 'active'

    let parent = null
    if (parentQrCode) {
        parent = await getAssetByQr(parentQrCode)
        if (!parent) {
            return { error: 'Parent asset not found', statusCode: 404 }
        }
    }

    if (qrCode) {
        const existing = await assetRepo.findOne({ where: { qr_code: qrCode } })
        if (existing) {
            return { error: 'QR code already exists', statusCode: 409 }
        }
    }

    let finalQrCode = qrCode
    if (!finalQrCode) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const candidate = generateQrCandidate(type)
            // eslint-disable-next-line no-await-in-loop
            const existing = await assetRepo.findOne({ where: { qr_code: candidate } })
            if (!existing) {
                finalQrCode = candidate
                break
            }
        }
        if (!finalQrCode) {
            return { error: 'Failed to generate unique QR code', statusCode: 500 }
        }
    }

    const asset = assetRepo.create({
        qr_code: finalQrCode,
        type,
        status: normalizedStatus,
        location: normalizedLocation,
        parent,
        created_by: userId,
        image_data: imageData || null,
        description: (description && String(description).trim()) || null,
    })

    let saved
    try {
        saved = await assetRepo.save(asset)
    } catch (err) {
        // Postgres unique violation
        if (err && err.code === '23505') {
            return { error: 'QR code already exists', statusCode: 409 }
        }
        throw err
    }
    const withRelations = await assetRepo.findOne({
        where: { id: saved.id },
        relations: { parent: true, creator: true },
    })

    await createActivityLog({
        asset: withRelations,
        action: 'create',
        old_location: null,
        new_location: withRelations.location,
        old_status: null,
        new_status: withRelations.status,
        user_id: userId,
    })

    return { asset: withRelations }
}

async function updateAssetLocation({ qrCode, newLocation, userId, action = 'move' }) {
    const assetRepo = AppDataSource.getRepository('Asset')
    const asset = await getAssetByQr(qrCode)

    if (!asset) {
        return { error: 'Asset not found' }
    }

    const oldLocation = asset.location
    asset.location = newLocation
    await assetRepo.save(asset)

    await createActivityLog({
        asset,
        action,
        old_location: oldLocation,
        new_location: newLocation,
        old_status: asset.status,
        new_status: asset.status,
        user_id: userId,
    })

    return { asset }
}

async function updateAssetStatus({ qrCode, newStatus, userId, action = 'update' }) {
    const assetRepo = AppDataSource.getRepository('Asset')
    const asset = await getAssetByQr(qrCode)

    if (!asset) {
        return { error: 'Asset not found' }
    }

    const oldStatus = asset.status
    asset.status = newStatus
    await assetRepo.save(asset)

    await createActivityLog({
        asset,
        action,
        old_location: asset.location,
        new_location: asset.location,
        old_status: oldStatus,
        new_status: newStatus,
        user_id: userId,
    })

    return { asset }
}

async function swapMonitor({ systemUnitQr, oldMonitorQr, newMonitorQr, userId }) {
    const assetRepo = AppDataSource.getRepository('Asset')

    const systemUnit = await getAssetByQr(systemUnitQr)
    const oldMonitor = await getAssetByQr(oldMonitorQr)
    const newMonitor = await getAssetByQr(newMonitorQr)

    if (!systemUnit || systemUnit.type !== 'unit') {
        return { error: 'System unit not found or invalid type' }
    }

    if (!oldMonitor || oldMonitor.type !== 'monitor') {
        return { error: 'Old monitor not found or invalid type' }
    }

    if (!newMonitor || newMonitor.type !== 'monitor') {
        return { error: 'New monitor not found or invalid type' }
    }

    oldMonitor.status = 'broken'
    oldMonitor.parent = null

    newMonitor.parent = systemUnit
    if (newMonitor.status === 'broken' || newMonitor.status === 'repair') {
        newMonitor.status = 'active'
    }

    await assetRepo.save(oldMonitor)
    await assetRepo.save(newMonitor)

    await createActivityLog({
        asset: oldMonitor,
        action: 'swap',
        old_location: oldMonitor.location,
        new_location: oldMonitor.location,
        old_status: 'active',
        new_status: 'broken',
        user_id: userId,
    })

    await createActivityLog({
        asset: newMonitor,
        action: 'swap',
        old_location: newMonitor.location,
        new_location: systemUnit.location,
        old_status: 'active',
        new_status: newMonitor.status,
        user_id: userId,
    })

    return {
        systemUnit,
        oldMonitor,
        newMonitor,
    }
}

async function listActivityLogs({ limit = 100, userId, includeAll = false } = {}) {
    const activityRepo = AppDataSource.getRepository('ActivityLog')

    const where = includeAll ? undefined : { user_id: userId }

    return activityRepo.find({
        where,
        relations: { asset: true, user: true },
        order: { timestamp: 'DESC' },
        take: limit,
    })
}

async function upsertAssetMeta({ qrCode, type, imageData, description, userId }) {
    const assetRepo = AppDataSource.getRepository('Asset')

    if (!qrCode) {
        return { error: 'qrCode is required', statusCode: 400 }
    }

    const existing = await assetRepo.findOne({
        where: { qr_code: qrCode },
        relations: { parent: true, creator: true },
    })

    if (!existing) {
        if (!type) {
            return { error: 'type is required to create asset metadata', statusCode: 400 }
        }

        const created = await createAsset({
            type,
            qrCode,
            location: 'Unassigned',
            status: 'active',
            parentQrCode: null,
            imageData: imageData || null,
            description: (description && String(description).trim()) || null,
            userId,
        })

        if (created.error) return created
        return { asset: created.asset }
    }

    existing.image_data = imageData || null
    existing.description = (description && String(description).trim()) || null
    await assetRepo.save(existing)

    await createActivityLog({
        asset: existing,
        action: 'update',
        old_location: existing.location,
        new_location: existing.location,
        old_status: existing.status,
        new_status: existing.status,
        user_id: userId,
    })

    const refreshed = await assetRepo.findOne({
        where: { qr_code: qrCode },
        relations: { parent: true, creator: true },
    })

    return { asset: refreshed }
}

module.exports = {
    createAsset,
    getAssetByQr,
    listAssets,
    updateAssetLocation,
    updateAssetStatus,
    swapMonitor,
    listActivityLogs,
    upsertAssetMeta,
}
