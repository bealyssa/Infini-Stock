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
        const activityRepo = AppDataSource.getRepository('ActivityLog')

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

        // Log activity
        await activityRepo.save(
            activityRepo.create({
                action: 'created',
                monitor_id: saved.id,
                user_id: req.auth.userId,
                description: `Created monitor "${deviceName}" (${qrCode}) with status: ${status}`,
            })
        )

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
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            condition: withRelations.condition || 'good',
            notes: withRelations.notes,
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
                modelType: monitor.model_type,
                serialNumber: monitor.serial_number,
                condition: monitor.condition || 'good',
                notes: monitor.notes,
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

async function updateMonitor(req, res) {
    try {
        const { id } = req.params
        const { deviceName, status, description, linkedUnitId } = req.body || {}

        const allowedStatus = ['active', 'inactive', 'maintenance']
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }

        const monitorRepo = AppDataSource.getRepository('Monitor')
        const unitRepo = AppDataSource.getRepository('Unit')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const monitor = await monitorRepo.findOne({
            where: { id },
            relations: { creator: true, linkedUnit: true },
        })

        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found' })
        }

        // Track changes for activity log
        const changes = []

        if (typeof deviceName === 'string') {
            const next = deviceName.trim()
            if (!next) {
                return res.status(400).json({ message: 'deviceName cannot be empty' })
            }
            if (monitor.device_name !== next) {
                changes.push(`Device name: "${monitor.device_name}" → "${next}"`)
                monitor.device_name = next
            }
        }

        if (typeof status === 'string') {
            if (monitor.status !== status) {
                changes.push(`Status: ${monitor.status} → ${status}`)
                monitor.status = status
            }
        }

        if (typeof description === 'string') {
            const next = description.trim() || null
            if (monitor.description !== next) {
                changes.push(`Description: "${monitor.description || '(empty)'}" → "${next || '(empty)'}"`)
                monitor.description = next
            }
        }

        if (linkedUnitId === null || linkedUnitId === undefined || linkedUnitId === '') {
            if (monitor.linkedUnit) {
                changes.push(`Linked unit: "${monitor.linkedUnit.device_name}" → (unlinked)`)
                monitor.linkedUnit = null
            }
        } else if (typeof linkedUnitId === 'string') {
            const unit = await unitRepo.findOne({ where: { id: linkedUnitId } })
            if (!unit) {
                return res.status(404).json({ message: 'Linked unit not found' })
            }
            if (!monitor.linkedUnit || monitor.linkedUnit.id !== unit.id) {
                const oldUnitName = monitor.linkedUnit?.device_name || '(none)'
                changes.push(`Linked unit: "${oldUnitName}" → "${unit.device_name}"`)
                monitor.linkedUnit = unit
            }
        }

        const saved = await monitorRepo.save(monitor)

        // Log activity if there were changes
        if (changes.length > 0) {
            await activityRepo.save(
                activityRepo.create({
                    action: 'updated',
                    monitor_id: saved.id,
                    user_id: req.auth.userId,
                    description: changes.join('; '),
                })
            )
        }

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
            updatedAt: withRelations.updated_at,
        })
    } catch {
        return serverError(res, 'Failed to update monitor')
    }
}

module.exports = {
    createMonitor,
    listMonitors,
    updateMonitor,
}