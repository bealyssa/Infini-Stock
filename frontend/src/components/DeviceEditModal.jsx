import { Image as ImageIcon, Info, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { assetApi, monitorApi, unitApi } from '../api'
import { Button } from './ui/Button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/Dialog'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

function normalizeError(err) {
    return err?.response?.data?.message || err?.message || 'Something went wrong'
}

// Image upload requirements
const IMAGE_REQUIREMENTS = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minFileSize: 10 * 1024, // 10KB
    allowedFormats: ['image/jpeg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    minDimensions: { width: 400, height: 300 },
    maxDimensions: { width: 4000, height: 3000 },
}

const getImageRequirementsText = () => `
Max Size: 5MB
Min Size: 10KB
Formats: JPG, PNG, WebP
Min Dimensions: 400×300px
Max Dimensions: 4000×3000px
`.trim()

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target?.result || null)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

export default function DeviceEditModal({
    open,
    onOpenChange,
    type,
    device,
    onSaved,
    onNotify, // Toast callback function
}) {
    const isUnit = type === 'unit'
    const isMonitor = type === 'monitor'

    const title = useMemo(() => {
        if (isUnit) return 'Edit System Unit'
        if (isMonitor) return 'Edit Monitor'
        return 'Edit Device'
    }, [isMonitor, isUnit])

    const [draft, setDraft] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        location: '',
        linkedUnitId: '',
        condition: '',
        modelType: '',
        serialNumber: '',
        description: '',
        notes: '',
    })

    const [units, setUnits] = useState([])
    const [imageData, setImageData] = useState(null)
    const [originalImageData, setOriginalImageData] = useState(null)
    const [imageUrlInput, setImageUrlInput] = useState('')
    const [showValidationErrors, setShowValidationErrors] = useState(false)

    const [loadingMeta, setLoadingMeta] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!open || !device) return

        setError(null)
        setSaving(false)
        setLoadingMeta(false)

        setDraft({
            deviceName: device.deviceName || '',
            qrCode: device.qrCode || '',
            status: device.status || 'active',
            location: device.location || '',
            linkedUnitId: device.linkedUnit?.id || '',
            condition: device.condition || '',
            modelType: device.modelType || '',
            serialNumber: device.serialNumber || '',
            description: device.description || '',
            notes: device.notes || '',
        })

        setImageUrlInput('')

        let cancelled = false

        const loadMeta = async () => {
            if (!device?.qrCode) return

            try {
                setLoadingMeta(true)
                const { data } = await assetApi.getAssetByQr(device.qrCode)
                if (cancelled) return
                const img = data?.imageData || null
                setImageData(img)
                setOriginalImageData(img)

                if (!device.description && data?.description) {
                    setDraft((prev) => ({ ...prev, description: data.description }))
                }
            } catch (err) {
                if (cancelled) return
                if (err?.response?.status === 404) {
                    setImageData(null)
                    setOriginalImageData(null)
                    return
                }
                setError(normalizeError(err))
            } finally {
                if (!cancelled) setLoadingMeta(false)
            }
        }

        const loadUnits = async () => {
            if (!isMonitor) return
            try {
                const { data } = await unitApi.listUnits()
                if (cancelled) return
                setUnits(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setUnits([])
            }
        }

        loadMeta()
        loadUnits()

        return () => {
            cancelled = true
        }
    }, [device, isMonitor, open])

    const handleChange = (e) => {
        const { name, value } = e.target
        setDraft((prev) => ({ ...prev, [name]: value }))
    }

    const isEditFormValid = () => {
        return (
            draft.deviceName.trim() !== '' &&
            draft.status.trim() !== '' &&
            draft.condition.trim() !== ''
        )
    }

    const validateImageRequirements = (file) => {
        const errors = []

        // Check file size
        if (file.size > IMAGE_REQUIREMENTS.maxFileSize) {
            errors.push(`File too large. Max size is 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        }
        if (file.size < IMAGE_REQUIREMENTS.minFileSize) {
            errors.push(`File too small. Min size is 10KB (current: ${(file.size / 1024).toFixed(2)}KB)`)
        }

        // Check file type
        if (!IMAGE_REQUIREMENTS.allowedFormats.includes(file.type)) {
            errors.push(`Invalid file format. Allowed: JPG, PNG, WebP (current: ${file.type || 'unknown'})`)
        }

        return errors
    }

    const validateImageDimensions = (img) => {
        return new Promise((resolve) => {
            const errors = []

            if (img.width < IMAGE_REQUIREMENTS.minDimensions.width || img.height < IMAGE_REQUIREMENTS.minDimensions.height) {
                errors.push(`Image too small. Min dimensions are 400×300px (current: ${img.width}×${img.height}px)`)
            }
            if (img.width > IMAGE_REQUIREMENTS.maxDimensions.width || img.height > IMAGE_REQUIREMENTS.maxDimensions.height) {
                errors.push(`Image too large. Max dimensions are 4000×3000px (current: ${img.width}×${img.height}px)`)
            }

            resolve(errors)
        })
    }

    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file requirements
        const fileErrors = validateImageRequirements(file)
        if (fileErrors.length > 0) {
            fileErrors.forEach(err => {
                onNotify?.(err, 'error')
            })
            setError(fileErrors[0])
            e.target.value = '' // Clear input
            return
        }

        try {
            setError(null)
            const dataUrl = await fileToDataUrl(file)

            // Validate dimensions
            const img = new window.Image()
            img.onload = async () => {
                const dimensionErrors = await validateImageDimensions(img)
                if (dimensionErrors.length > 0) {
                    dimensionErrors.forEach(err => {
                        onNotify?.(err, 'error')
                    })
                    setError(dimensionErrors[0])
                    e.target.value = ''
                    return
                }

                setImageData(dataUrl)
                onNotify?.('Image uploaded successfully', 'success')
            }
            img.onerror = () => {
                const err = 'Failed to load image. Please try another file.'
                onNotify?.(err, 'error')
                setError(err)
                e.target.value = ''
            }
            img.src = dataUrl
        } catch (err) {
            const message = normalizeError(err)
            onNotify?.(message, 'error')
            setError(message)
            e.target.value = ''
        }
    }

    const handleUseImageUrl = () => {
        const next = imageUrlInput.trim()
        if (!next) return
        setImageData(next)
        setImageUrlInput('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!device?.id) return

        // Validate required fields
        if (!isEditFormValid()) {
            setShowValidationErrors(true)
            setError('Device name, Status, and Condition are required')
            return
        }

        setError(null)

        const payload = {
            deviceName: draft.deviceName.trim(),
            status: draft.status,
            description: draft.description,
            notes: draft.notes,
        }

        // Only include imageData if it has been changed
        if (imageData !== originalImageData) {
            payload.imageData = imageData
        }

        if (isUnit) {
            payload.location = draft.location
            payload.condition = draft.condition
            payload.modelType = draft.modelType
            payload.serialNumber = draft.serialNumber
        }

        if (isMonitor) {
            payload.linkedUnitId = draft.linkedUnitId || null
            payload.condition = draft.condition
        }

        if (!payload.deviceName) {
            setError('Device name is required')
            return
        }

        try {
            setSaving(true)

            const updated = isUnit
                ? await unitApi.updateUnit(device.id, payload)
                : await monitorApi.updateMonitor(device.id, payload)

            const updatedDevice = {
                ...(updated?.data || {}),
                imageData: imageData || null,
            }

            onSaved?.(updatedDevice)
            onOpenChange(false)
        } catch (err) {
            setError(normalizeError(err))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Update device info. QR code can’t be changed.
                    </DialogDescription>
                </DialogHeader>

                {error ? (
                    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-600/20 p-3 text-sm text-red-200">
                        {error}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-5">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left: Images */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">Images</div>
                                    <div className="text-xs text-gray-500">
                                        {loadingMeta ? 'Loading current image…' : 'Upload or set a URL'}
                                    </div>
                                </div>
                                {imageData ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setImageData(null)}
                                    >
                                        <Trash2 className="mr-2" size={16} />
                                        Remove
                                    </Button>
                                ) : null}
                            </div>

                            <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                {imageData ? (
                                    <img
                                        src={imageData}
                                        alt={draft.deviceName || 'Device'}
                                        className="h-56 w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-[#3d2e5c] bg-[#0f0a1a]">
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <ImageIcon size={22} />
                                            <span className="text-xs">No image</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Upload image
                                        </label>
                                        <div className="relative group">
                                            <Info size={16} className="text-gray-400 cursor-help hover:text-gray-200 transition" />
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full -mt-2 hidden group-hover:block bg-gray-900 border border-gray-700 rounded-lg p-3 w-64 text-xs text-gray-300 shadow-lg z-50 pointer-events-none">
                                                <div className="font-semibold mb-2 text-gray-200">Image Requirements:</div>
                                                <div className="space-y-1">
                                                    <div>• Max Size: 5MB</div>
                                                    <div>• Min Size: 10KB</div>
                                                    <div>• Formats: JPG, PNG</div>
                                                    <div>• Min Dimensions: 400×300px</div>
                                                    <div>• Max Dimensions: 4000×3000px</div>
                                                </div>
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-4 border-transparent border-t-gray-900 border-t-4"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleImageFileChange}
                                        />
                                        <div className="hidden sm:flex items-center text-xs text-gray-500">
                                            <Upload size={14} className="mr-1" />
                                            JPG/PNG
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={draft.notes}
                                    onChange={handleChange}
                                    placeholder="Add additional notes…"
                                    rows={3}
                                    className="w-full rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-lavender-500 focus:ring-2 focus:ring-lavender-500/20"
                                />
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Device Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="deviceName"
                                    value={draft.deviceName}
                                    onChange={handleChange}
                                    placeholder="e.g., System Unit #1"
                                    className={showValidationErrors && !draft.deviceName.trim() ? 'border-red-500 border-2' : ''}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    QR Code
                                </label>
                                <Input name="qrCode" value={draft.qrCode} disabled />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <Select name="status" value={draft.status} onChange={handleChange} className={showValidationErrors && !draft.status.trim() ? 'border-red-500 border-2' : ''}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="broken">Broken</option>
                                    <option value="repair">Repair</option>
                                </Select>
                            </div>

                            {isUnit ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Location
                                        </label>
                                        <Input
                                            name="location"
                                            value={draft.location}
                                            onChange={handleChange}
                                            placeholder="e.g., Building A, Floor 3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Condition <span className="text-red-500">*</span>
                                        </label>
                                        <Select name="condition" value={draft.condition} onChange={handleChange} className={showValidationErrors && !draft.condition.trim() ? 'border-red-500 border-2' : ''}>
                                            <option value="">Select condition…</option>
                                            <option value="new">New</option>
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                            <option value="poor">Poor</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Model Type
                                        </label>
                                        <Input
                                            name="modelType"
                                            value={draft.modelType}
                                            onChange={handleChange}
                                            placeholder="e.g., Receiver TR-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Serial Number
                                        </label>
                                        <Input
                                            name="serialNumber"
                                            value={draft.serialNumber}
                                            onChange={handleChange}
                                            placeholder="e.g., SN123456789"
                                        />
                                    </div>
                                </>
                            ) : null}

                            {isMonitor ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Linked System Unit
                                        </label>
                                        <Select
                                            name="linkedUnitId"
                                            value={draft.linkedUnitId}
                                            onChange={handleChange}
                                        >
                                            <option value="">None</option>
                                            {units.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.deviceName} ({unit.qrCode})
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Condition <span className="text-red-500">*</span>
                                        </label>
                                        <Select name="condition" value={draft.condition} onChange={handleChange} className={showValidationErrors && !draft.condition.trim() ? 'border-red-500 border-2' : ''}>
                                            <option value="">Select condition…</option>
                                            <option value="new">New</option>
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                            <option value="poor">Poor</option>
                                        </Select>
                                    </div>
                                </>
                            ) : null}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={draft.description}
                                    onChange={handleChange}
                                    placeholder="Add device details…"
                                    rows={5}
                                    className="w-full rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-lavender-500 focus:ring-2 focus:ring-lavender-500/20"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || !isEditFormValid()}
                            className={!isEditFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
