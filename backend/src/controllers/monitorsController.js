const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function createMonitor(req, res) {
    try {
        const { deviceName, qrCode, status = 'active', description, linkedUnitId } = req.body

        if (!deviceName || !qrCode) {
            return res.status(400).json({ message: 'deviceName and qrCode are required' })
        }

        const monitorRepo = AppDataSource.getRepository('Monitor')
        const unitRepo = AppDataSource.getRepository('Unit')

        const existing = await monitorRepo.findOne({ where: { qr_code: qrCode } })
        if (existing) {
            return res.status(409).json({ message: 'QR code already exists' })
        }

        let linkedUnit = null
        if (linkedUnitId) {
            linkedUnit = await unitRepo.findOne({ where: { id: linkedUnitId } })
            if (!linkedUnit) {
                return res.status(404).json({ message: 'Linked unit not found' })
            }
        }

        const monitor = monitorRepo.create({
            device_name: deviceName,
            qr_code: qrCode,
            status,
            description: description || null,
            created_by: req.auth.userId,
            linkedUnit,
        })

        const saved = await monitorRepo.save(monitor)
        const withRelations = await monitorRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true, linkedUnit: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: withRelations.device_name,
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            description: withRelations.description,
            createdBy: withRelations.creator?.full_name || null,
            linkedUnit: withRelations.linkedUnit
                ? {
                    id: withRelations.linkedUnit.id,
                    deviceName: withRelations.linkedUnit.device_name,
                    qrCode: withRelations.linkedUnit.qr_code,
                }
                : null,
            createdAt: withRelations.created_at,
        })
    } catch {
        return serverError(res, 'Failed to create monitor')
    }
}

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
    createMonitor,
    listMonitors,
}