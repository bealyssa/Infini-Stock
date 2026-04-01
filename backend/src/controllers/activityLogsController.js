const assetService = require('../services/assetService')
const { ok, serverError } = require('../utils/http')

async function listActivityLogs(req, res) {
    try {
        const limitRaw = req.query.limit
        const limit = Math.min(Math.max(Number(limitRaw || 50) || 50, 1), 200)

        const logs = await assetService.listActivityLogs(limit)
        return ok(
            res,
            logs.map((log) => ({
                id: log.id,
                assetId: log.asset?.id,
                assetQrCode: log.asset?.qr_code,
                action: log.action,
                oldLocation: log.old_location,
                newLocation: log.new_location,
                oldStatus: log.old_status,
                newStatus: log.new_status,
                userId: log.user_id,
                timestamp: log.timestamp,
            })),
        )
    } catch {
        return serverError(res, 'Failed to list activity logs')
    }
}

module.exports = {
    listActivityLogs,
}
