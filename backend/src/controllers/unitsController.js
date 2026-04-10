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

async function updateUnit(req, res) {
    try {
        const { id } = req.params
        const { deviceName, status, location, description } = req.body || {}

        const allowedStatus = ['active', 'inactive', 'maintenance']
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }

        const unitRepo = AppDataSource.getRepository('Unit')
        const unit = await unitRepo.findOne({
            where: { id },
            relations: { creator: true, monitors: true },
        })

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' })
        }

        if (typeof deviceName === 'string') {
            const next = deviceName.trim()
            if (!next) {
                return res.status(400).json({ message: 'deviceName cannot be empty' })
            }
            unit.device_name = next
        }

        if (typeof status === 'string') {
            unit.status = status
        }

        if (typeof location === 'string') {
            unit.location = location.trim() || null
        }

        if (typeof description === 'string') {
            unit.description = description.trim() || null
        }

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
            updatedAt: withRelations.updated_at,
        })
    } catch {
        return serverError(res, 'Failed to update system unit')
    }
}

module.exports = {
    createUnit,
    listUnits,
    updateUnit,
}