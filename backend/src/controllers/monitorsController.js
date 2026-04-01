const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function listMonitors(req, res) {
    try {
        const monitorRepo = AppDataSource.getRepository('Monitor')
        const monitors = await monitorRepo.find({
            relations: { creator: true, linkedUnit: true },
            order: { created_at: 'DESC' },
        })

        return ok(
            res,
            monitors.map((monitor) => ({
                id: monitor.id,
                deviceName: monitor.device_name,
                qrCode: monitor.qr_code,
                status: monitor.status,
                description: monitor.description,
                createdBy: monitor.creator?.full_name || null,
                linkedUnit: monitor.linkedUnit
                    ? {
                        id: monitor.linkedUnit.id,
                        deviceName: monitor.linkedUnit.device_name,
                        qrCode: monitor.linkedUnit.qr_code,
                    }
                    : null,
                createdAt: monitor.created_at,
            })),
        )
    } catch {
        return serverError(res, 'Failed to list monitors')
    }
}

module.exports = {
    listMonitors,
}