const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function createMonitor(req, res) {
    try {
        const { deviceName, qrCode, status = 'active', description, modelType, serialNumber, condition = 'good', notes, linkedUnitId, imageData } = req.body

        if (!deviceName || !qrCode) {
            return res.status(400).json({ message: 'deviceName and qrCode are required' })
        }

        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const existing = await assetRepo.findOne({ where: { qr_code: qrCode } })
        if (existing) {
            return res.status(409).json({ message: 'QR code already exists' })
        }

        let linkedUnit = null
        if (linkedUnitId) {
            linkedUnit = await assetRepo.findOne({ where: { id: linkedUnitId, type: 'unit' } })
            if (!linkedUnit) {
                return res.status(404).json({ message: 'Linked unit not found' })
            }
        }

        // Create asset as a monitor
        const monitor = assetRepo.create({
            qr_code: qrCode,
            type: 'monitor',
            status,
            location: 'Unassigned',
            description: description || null,
            model_type: modelType || null,
            serial_number: serialNumber || null,
            condition: condition || 'good',
            notes: notes || null,
            image_data: imageData || null,
            created_by: req.auth.userId,
            linkedUnit,
        })

        const saved = await assetRepo.save(monitor)

        // Log activity
        await activityRepo.save(
            activityRepo.create({
                action: 'created',
                asset_id: saved.id,
                user_id: req.auth.userId,
                description: `Created monitor "${deviceName}" (${qrCode}) with status: ${status}`,
                item_name: deviceName,
                item_qr: qrCode,
            })
        )

        const withRelations = await assetRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true, linkedAsset: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: qrCode, // use qrCode as default for device name display
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            description: withRelations.description,
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            condition: withRelations.condition || 'good',
            notes: withRelations.notes,
            imageData: withRelations.image_data,
            createdBy: withRelations.creator?.full_name || null,
            linkedUnit: withRelations.linkedAsset
                ? {
                    id: withRelations.linkedAsset.id,
                    deviceName: withRelations.linkedAsset.description || withRelations.linkedAsset.qr_code,
                    qrCode: withRelations.linkedAsset.qr_code,
                }
                : null,
            createdAt: withRelations.created_at,
        })
    } catch (error) {
        console.error('Create monitor error:', error)
        return serverError(res, 'Failed to create monitor')
    }
}

async function listMonitors(req, res) {
    try {
        const assetRepo = AppDataSource.getRepository('Asset')
        const monitors = await assetRepo.find({
            where: { type: 'monitor' },
            relations: { creator: true, linkedAsset: true },
            order: { created_at: 'DESC' },
        })

        return ok(
            res,
            monitors.map((monitor) => ({
                id: monitor.id,
                deviceName: monitor.description || monitor.qr_code, // fallback to QR if no description
                qrCode: monitor.qr_code,
                status: monitor.status,
                description: monitor.description,
                modelType: monitor.model_type,
                serialNumber: monitor.serial_number,
                condition: monitor.condition || 'good',
                notes: monitor.notes,
                imageData: monitor.image_data || null,
                createdBy: monitor.creator?.full_name || null,
                linkedUnit: monitor.linkedAsset
                    ? {
                        id: monitor.linkedAsset.id,
                        deviceName: monitor.linkedAsset.description || monitor.linkedAsset.qr_code,
                        qrCode: monitor.linkedAsset.qr_code,
                    }
                    : null,
                createdAt: monitor.created_at,
                updatedAt: monitor.updated_at,
            })),
        )
    } catch (error) {
        console.error('List monitors error:', error)
        return serverError(res, 'Failed to list monitors')
    }
}

async function updateMonitor(req, res) {
    try {
        const { id } = req.params
        const { deviceName, status, description, modelType, serialNumber, condition, notes, linkedUnitId, imageData } = req.body || {}

        const allowedStatus = ['active', 'inactive', 'maintenance', 'broken', 'repair']
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }

        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const monitor = await assetRepo.findOne({
            where: { id, type: 'monitor' },
            relations: { creator: true, linkedAsset: true },
        })

        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found' })
        }

        // Track changes for activity log
        const changeDetails = []

        // Handle deviceName (which maps to description field)
        const nameToUpdate = deviceName || description
        if (typeof nameToUpdate === 'string' && monitor.description !== nameToUpdate) {
            changeDetails.push({ field: 'Device Name', before: monitor.description || '(empty)', after: nameToUpdate || '(empty)' })
            monitor.description = nameToUpdate || null
        }

        if (typeof status === 'string' && monitor.status !== status) {
            changeDetails.push({ field: 'Status', before: monitor.status, after: status })
            monitor.status = status
        }

        if (typeof description === 'string' && monitor.description !== description) {
            changeDetails.push({ field: 'Description', before: monitor.description || '(empty)', after: description || '(empty)' })
            monitor.description = description || null
        }

        if (typeof modelType === 'string' && monitor.model_type !== modelType) {
            changeDetails.push({ field: 'Model Type', before: monitor.model_type || '(empty)', after: modelType || '(empty)' })
            monitor.model_type = modelType || null
        }

        if (typeof serialNumber === 'string' && monitor.serial_number !== serialNumber) {
            changeDetails.push({ field: 'Serial Number', before: monitor.serial_number || '(empty)', after: serialNumber || '(empty)' })
            monitor.serial_number = serialNumber || null
        }

        if (typeof condition === 'string' && monitor.condition !== condition) {
            changeDetails.push({ field: 'Condition', before: monitor.condition, after: condition })
            monitor.condition = condition || 'good'
        }

        if (typeof notes === 'string' && monitor.notes !== notes) {
            changeDetails.push({ field: 'Notes', before: monitor.notes || '(empty)', after: notes || '(empty)' })
            monitor.notes = notes || null
        }

        if (imageData !== undefined && imageData !== null) {
            const hasOldImage = !!monitor.image_data
            const hasNewImage = !!imageData

            if (!hasOldImage && hasNewImage) {
                changeDetails.push({ field: 'Image', before: '(no image)', after: '(image added)' })
            } else if (hasOldImage && !hasNewImage) {
                changeDetails.push({ field: 'Image', before: '(image)', after: '(removed)' })
            } else if (hasOldImage && hasNewImage && monitor.image_data !== imageData) {
                changeDetails.push({ field: 'Image', before: '(image)', after: '(image updated)' })
            }
            monitor.image_data = imageData
        } else if (imageData === null && monitor.image_data) {
            changeDetails.push({ field: 'Image', before: '(image)', after: '(removed)' })
            monitor.image_data = null
        }

        if (linkedUnitId === null || linkedUnitId === undefined || linkedUnitId === '') {
            if (monitor.linked_unit_id) {
                // Fetch old unit details for before value
                const oldUnit = await assetRepo.findOne({ where: { id: monitor.linked_unit_id } })
                const oldUnitName = oldUnit ? (oldUnit.description || oldUnit.qr_code) : `(ID: ${monitor.linked_unit_id})`
                changeDetails.push({ field: 'Linked Unit', before: oldUnitName, after: '(removed)' })
                monitor.linked_unit_id = null
            }
        } else if (typeof linkedUnitId === 'string') {
            const unit = await assetRepo.findOne({ where: { id: linkedUnitId, type: 'unit' } })
            if (!unit) {
                return res.status(404).json({ message: 'Linked unit not found' })
            }
            if (monitor.linked_unit_id !== unit.id) {
                let beforeValue = '(none)'
                if (monitor.linked_unit_id) {
                    const oldUnit = await assetRepo.findOne({ where: { id: monitor.linked_unit_id } })
                    beforeValue = oldUnit ? (oldUnit.description || oldUnit.qr_code) : `(ID: ${monitor.linked_unit_id})`
                }
                changeDetails.push({
                    field: 'Linked Unit',
                    before: beforeValue,
                    after: unit.description || unit.qr_code
                })
                monitor.linked_unit_id = unit.id
            }
        }

        const saved = await assetRepo.save(monitor)

        // Log activity if there were changes
        if (changeDetails.length > 0) {
            await activityRepo.save(
                activityRepo.create({
                    action: 'updated',
                    asset_id: saved.id,
                    user_id: req.auth.userId,
                    description: JSON.stringify({ changes: changeDetails }),
                    item_name: saved.description || saved.qr_code,
                    item_qr: saved.qr_code,
                })
            )
        }

        const withRelations = await assetRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true, linkedAsset: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: withRelations.description || withRelations.qr_code,
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            description: withRelations.description,
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            condition: withRelations.condition || 'good',
            notes: withRelations.notes,
            imageData: withRelations.image_data || null,
            createdBy: withRelations.creator?.full_name || null,
            linkedUnit: withRelations.linkedAsset
                ? {
                    id: withRelations.linkedAsset.id,
                    deviceName: withRelations.linkedAsset.description || withRelations.linkedAsset.qr_code,
                    qrCode: withRelations.linkedAsset.qr_code,
                }
                : null,
            createdAt: withRelations.created_at,
            updatedAt: withRelations.updated_at,
        })
    } catch (error) {
        console.error('Update monitor error:', error)
        return serverError(res, 'Failed to update monitor')
    }
}

async function deleteMonitor(req, res) {
    try {
        const { id } = req.params
        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const monitor = await assetRepo.findOne({
            where: { id, type: 'monitor' },
        })

        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found' })
        }

        // Log activity BEFORE deleting
        try {
            const activityLogData = {
                action: 'deleted',
                asset_id: id,
                user_id: req.auth.userId,
                description: `Deleted monitor (${monitor.qr_code})`,
                deleted_item_name: monitor.description || monitor.qr_code,
                deleted_item_qr: monitor.qr_code,
                item_name: monitor.description || monitor.qr_code,
                item_qr: monitor.qr_code,
            }
            await activityRepo.save(activityRepo.create(activityLogData))
        } catch (logError) {
            console.error('Failed to log monitor deletion activity:', logError.message)
        }

        await assetRepo.remove(monitor)

        return ok(res, { message: 'Monitor deleted successfully' })
    } catch (error) {
        console.error('Delete monitor error:', error)
        return serverError(res, 'Failed to delete monitor')
    }
}

module.exports = {
    createMonitor,
    listMonitors,
    updateMonitor,
    deleteMonitor,
}
