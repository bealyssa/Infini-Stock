const { AppDataSource } = require('../config/dataSource')
const { ok, serverError } = require('../utils/http')

async function createUnit(req, res) {
    try {
        const { deviceName, qrCode, status = 'active', location, condition = 'good', description, modelType, serialNumber, notes, imageData } = req.body

        if (!deviceName || !qrCode) {
            return res.status(400).json({ message: 'deviceName and qrCode are required' })
        }

        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const existing = await assetRepo.findOne({ where: { qr_code: qrCode } })
        if (existing) {
            return res.status(409).json({ message: 'QR code already exists' })
        }

        const unit = assetRepo.create({
            qr_code: qrCode,
            type: 'unit',
            status,
            location: location || 'Unassigned',
            condition: condition || 'good',
            model_type: modelType || null,
            serial_number: serialNumber || null,
            image_data: imageData || null,
            description: description || null,
            notes: notes || null,
            created_by: req.auth.userId,
        })

        const saved = await assetRepo.save(unit)

        // Log activity
        await activityRepo.save(
            activityRepo.create({
                action: 'created',
                asset_id: saved.id,
                user_id: req.auth.userId,
                description: `Created unit "${deviceName}" (${qrCode}) with status: ${status}${location ? ` at ${location}` : ''}`,
                item_name: deviceName,
                item_qr: qrCode,
            })
        )

        const withRelations = await assetRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: deviceName,
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            condition: withRelations.condition,
            location: withRelations.location,
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            imageData: withRelations.image_data,
            description: withRelations.description,
            notes: withRelations.notes,
            createdBy: withRelations.creator?.full_name || null,
            createdAt: withRelations.created_at,
        })
    } catch (error) {
        console.error('Create unit error:', error)
        return serverError(res, 'Failed to create system unit')
    }
}

async function listUnits(req, res) {
    try {
        const assetRepo = AppDataSource.getRepository('Asset')
        const units = await assetRepo.find({
            where: { type: 'unit' },
            relations: { creator: true },
            order: { created_at: 'DESC' },
        })

        return ok(
            res,
            units.map((unit) => ({
                id: unit.id,
                deviceName: unit.description || unit.qr_code,
                qrCode: unit.qr_code,
                status: unit.status,
                condition: unit.condition,
                location: unit.location,
                modelType: unit.model_type,
                serialNumber: unit.serial_number,
                description: unit.description,
                notes: unit.notes,
                imageData: unit.image_data,
                createdBy: unit.creator?.full_name || null,
                createdAt: unit.created_at,
                updatedAt: unit.updated_at,
            })),
        )
    } catch (error) {
        console.error('List units error:', error)
        return serverError(res, 'Failed to list system units')
    }
}

async function updateUnit(req, res) {
    try {
        const { id } = req.params
        const { deviceName, status, condition, location, description, notes, modelType, serialNumber, imageData } = req.body || {}

        const allowedStatus = ['active', 'inactive', 'maintenance', 'broken', 'repair']
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }

        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const unit = await assetRepo.findOne({
            where: { id, type: 'unit' },
            relations: { creator: true },
        })

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' })
        }

        // Track changes for activity log
        const changeDetails = []

        if (typeof status === 'string' && unit.status !== status) {
            changeDetails.push({ field: 'Status', before: unit.status, after: status })
            unit.status = status
        }

        if (typeof condition === 'string' && unit.condition !== condition) {
            changeDetails.push({ field: 'Condition', before: unit.condition || '(empty)', after: condition || '(empty)' })
            unit.condition = condition || 'good'
        }

        if (typeof location === 'string' && unit.location !== location) {
            changeDetails.push({ field: 'Location', before: unit.location || '(empty)', after: location || '(empty)' })
            unit.location = location || 'Unassigned'
        }

        if (typeof description === 'string' && unit.description !== description) {
            changeDetails.push({ field: 'Description', before: unit.description || '(empty)', after: description || '(empty)' })
            unit.description = description || null
        }

        if (typeof notes === 'string' && unit.notes !== notes) {
            changeDetails.push({ field: 'Notes', before: unit.notes || '(empty)', after: notes || '(empty)' })
            unit.notes = notes || null
        }

        if (typeof modelType === 'string' && unit.model_type !== modelType) {
            changeDetails.push({ field: 'Model Type', before: unit.model_type || '(empty)', after: modelType || '(empty)' })
            unit.model_type = modelType || null
        }

        if (typeof serialNumber === 'string' && unit.serial_number !== serialNumber) {
            changeDetails.push({ field: 'Serial Number', before: unit.serial_number || '(empty)', after: serialNumber || '(empty)' })
            unit.serial_number = serialNumber || null
        }

        if (imageData !== undefined) {
            const oldImageState = unit.image_data ? '(image)' : '(no image)'
            const newImageState = imageData ? '(image)' : '(no image)'
            if (oldImageState !== newImageState) {
                changeDetails.push({ field: 'Image', before: oldImageState, after: newImageState })
            }
            unit.image_data = imageData
        }

        const saved = await assetRepo.save(unit)

        // Log activity if there were changes
        if (changeDetails.length > 0) {
            await activityRepo.save(
                activityRepo.create({
                    action: 'updated',
                    asset_id: saved.id,
                    user_id: req.auth.userId,
                    description: JSON.stringify({ changes: changeDetails }),
                    item_name: deviceName || saved.description || saved.qr_code,
                    item_qr: saved.qr_code,
                })
            )
        }

        const withRelations = await assetRepo.findOne({
            where: { id: saved.id },
            relations: { creator: true },
        })

        return ok(res, {
            id: withRelations.id,
            deviceName: deviceName || withRelations.description || withRelations.qr_code,
            qrCode: withRelations.qr_code,
            status: withRelations.status,
            condition: withRelations.condition,
            location: withRelations.location,
            modelType: withRelations.model_type,
            serialNumber: withRelations.serial_number,
            description: withRelations.description,
            notes: withRelations.notes,
            imageData: withRelations.image_data || null,
            createdBy: withRelations.creator?.full_name || null,
            createdAt: withRelations.created_at,
            updatedAt: withRelations.updated_at,
        })
    } catch (error) {
        console.error('Update unit error:', error)
        return serverError(res, 'Failed to update system unit')
    }
}

async function deleteUnit(req, res) {
    try {
        const { id } = req.params

        const assetRepo = AppDataSource.getRepository('Asset')
        const activityRepo = AppDataSource.getRepository('ActivityLog')

        const unit = await assetRepo.findOne({
            where: { id, type: 'unit' },
        })

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' })
        }

        // Log activity BEFORE deleting
        try {
            const activityLogData = {
                action: 'deleted',
                asset_id: id,
                user_id: req.auth.userId,
                description: `Deleted unit (${unit.qr_code})`,
                deleted_item_name: unit.description || unit.qr_code,
                deleted_item_qr: unit.qr_code,
                item_name: unit.description || unit.qr_code,
                item_qr: unit.qr_code,
            }
            await activityRepo.save(activityRepo.create(activityLogData))
        } catch (logError) {
            console.error('Failed to log unit deletion activity:', logError.message)
        }

        await assetRepo.remove(unit)

        return ok(res, { message: 'Unit deleted successfully' })
    } catch (error) {
        console.error('Delete unit error:', error)
        return serverError(res, 'Failed to delete system unit')
    }
}

module.exports = {
    createUnit,
    listUnits,
    updateUnit,
    deleteUnit,
}