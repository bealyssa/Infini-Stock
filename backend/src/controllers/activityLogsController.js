const assetService = require('../services/assetService')
const { ok, serverError } = require('../utils/http')

async function listActivityLogs(req, res) {
    try {
        const limitRaw = req.query.limit
        const limit = Math.min(Math.max(Number(limitRaw || 50) || 50, 1), 200)
        const itemId = req.query.itemId
        const itemType = req.query.itemType

        console.log(`\n[ActivityLogsController] Request:`, { itemId, itemType, limit })

        const role = req.auth?.role
        const userId = req.auth?.userId
        const includeAll = role === 'admin'

        let filterColumn = null
        let filterId = null

        // Determine which column to filter by based on itemType
        if (itemId && itemType) {
            if (itemType === 'unit' || itemType === 'monitor') {
                // Both units and monitors are stored as assets, filter by asset_id
                filterColumn = 'asset_id'
                filterId = itemId
            }
        }

        const logs = await require('../services/assetService').listActivityLogs({
            limit,
            userId,
            includeAll,
            filterColumn,
            filterId,
        })
        return ok(
            res,
            logs.map((log) => ({
                id: log.id,
                assetId: log.asset?.id,
                assetQrCode: log.asset?.qr_code,
                assetType: log.asset?.type,
                unit: log.unit,
                action: log.action,
                description: log.description,
                oldLocation: log.old_location,
                newLocation: log.new_location,
                oldStatus: log.old_status,
                newStatus: log.new_status,
                userId: log.user_id,
                userName: log.user?.full_name || null,
                userEmail: log.user?.email || null,
                timestamp: log.timestamp,
                deletedItemName: log.deleted_item_name,
                deletedItemQr: log.deleted_item_qr,
                itemName: log.item_name,
                itemQr: log.item_qr,
            })),
        )
    } catch {
        return serverError(res, 'Failed to list activity logs')
    }
}

module.exports = {
    listActivityLogs,
}
