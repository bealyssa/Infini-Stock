const { AppDataSource } = require('../config/dataSource')

async function getAssetByQr(qrCode) {
    const assetRepo = AppDataSource.getRepository('Asset')
    return assetRepo.findOne({
        where: { qr_code: qrCode },
        relations: { parent: true, children: true },
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

async function listActivityLogs(limit = 100) {
    const activityRepo = AppDataSource.getRepository('ActivityLog')
    return activityRepo.find({
        relations: { asset: true },
        order: { timestamp: 'DESC' },
        take: limit,
    })
}

module.exports = {
    getAssetByQr,
    listAssets,
    updateAssetLocation,
    updateAssetStatus,
    swapMonitor,
    listActivityLogs,
}
