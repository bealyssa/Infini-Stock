const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function createUnit(req, res) {
    try {
        const { deviceName, qrCode, status = 'active', location, description } = req.body

        if (!deviceName || !qrCode) {
            return res.status(400).json({ message: 'deviceName and qrCode are required' })
        }

        const unitRepo = AppDataSource.getRepository('Unit')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

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

        // Log activity
        await activityRepo.save(
            activityRepo.create({
                action: 'created',
                unit_id: saved.id,
                user_id: req.auth.userId,
                description: `Created unit "${deviceName}" (${qrCode}) with status: ${status}${location ? ` at ${location}` : ''}`,
            })
        )

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
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            condition: withRelations.condition || 'good',
            notes: withRelations.notes,
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
                modelType: unit.model_type,
                serialNumber: unit.serial_number,
                condition: unit.condition || 'good',
                notes: unit.notes,
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
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const unit = await unitRepo.findOne({
            where: { id },
            relations: { creator: true, monitors: true },
        })

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' })
        }

        // Track changes for activity log
        const changes = []

        if (typeof deviceName === 'string') {
            const next = deviceName.trim()
            if (!next) {
                return res.status(400).json({ message: 'deviceName cannot be empty' })
            }
            if (unit.device_name !== next) {
                changes.push(`Device name: "${unit.device_name}" → "${next}"`)
                unit.device_name = next
            }
        }

        if (typeof status === 'string') {
            if (unit.status !== status) {
                changes.push(`Status: ${unit.status} → ${status}`)
                unit.status = status
            }
        }

        if (typeof location === 'string') {
            const next = location.trim() || null
            if (unit.location !== next) {
                changes.push(`Location: "${unit.location || '(unset)'}" → "${next || '(unset)'}"`)
                unit.location = next
            }
        }

        if (typeof description === 'string') {
            const next = description.trim() || null
            if (unit.description !== next) {
                changes.push(`Description: "${unit.description || '(empty)'}" → "${next || '(empty)'}"`)
                unit.description = next
            }
        }

        const saved = await unitRepo.save(unit)

        // Log activity if there were changes
        if (changes.length > 0) {
            await activityRepo.save(
                activityRepo.create({
                    action: 'updated',
                    unit_id: saved.id,
                    user_id: req.auth.userId,
                    description: changes.join('; '),
                })
            )
        }

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