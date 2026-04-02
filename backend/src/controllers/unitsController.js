const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function createUnit(req, res) {
    try {
        const { deviceName, qrCode, status = 'active', location, description } = req.body

        if (!deviceName || !qrCode) {
            return res.status(400).json({ message: 'deviceName and qrCode are required' })
        }

        const unitRepo = AppDataSource.getRepository('Unit')
        const existing = await unitRepo.findOne({ where: { qr_code: qrCode } })
        if (existing) {
            return res.status(409).json({ message: 'QR code already exists' })
        }

        const unit = unitRepo.create({
            device_name: deviceName,
            qr_code: qrCode,
            status,
            location: location || null,
            description: description || null,
            created_by: req.auth.userId,
        })

        const saved = await unitRepo.save(unit)
        const withRelations = await unitRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true, monitors: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: withRelations.device_name,
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            location: withRelations.location,
            description: withRelations.description,
            createdBy: withRelations.creator?.full_name || null,
            monitorCount: withRelations.monitors?.length || 0,
            createdAt: withRelations.created_at,
        })
    } catch {
        return serverError(res, 'Failed to create system unit')
    }
}

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
    createUnit,
    listUnits,
}