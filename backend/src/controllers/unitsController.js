const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function listUnits(req, res) {
    try {
        const unitRepo = AppDataSource.getRepository('Unit')
        const units = await unitRepo.find({
            relations: { creator: true, monitors: true },
            order: { created_at: 'DESC' },
        })

        return ok(
            res,
            units.map((unit) => ({
                id: unit.id,
                deviceName: unit.device_name,
                qrCode: unit.qr_code,
                status: unit.status,
                location: unit.location,
                description: unit.description,
                createdBy: unit.creator?.full_name || null,
                monitorCount: unit.monitors?.length || 0,
                createdAt: unit.created_at,
            })),
        )
    } catch {
        return serverError(res, 'Failed to list system units')
    }
}

module.exports = {
    listUnits,
}