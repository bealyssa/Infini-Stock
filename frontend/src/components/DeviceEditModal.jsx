import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
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
        description: '',
    })

    const [units, setUnits] = useState([])
    const [imageData, setImageData] = useState(null)
    const [imageUrlInput, setImageUrlInput] = useState('')

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
            description: device.description || '',
        })

        setImageUrlInput('')

        let cancelled = false

        const loadMeta = async () => {
            if (!device?.qrCode) return

            try {
                setLoadingMeta(true)
                const { data } = await assetApi.getAssetByQr(device.qrCode)
                if (cancelled) return
                setImageData(data?.imageData || null)

                if (!device.description && data?.description) {
                    setDraft((prev) => ({ ...prev, description: data.description }))
                }
            } catch (err) {
                if (cancelled) return
                if (err?.response?.status === 404) {
                    setImageData(null)
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

    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            setError('Image size must be less than 5MB')
            return
        }

        try {
            setError(null)
            const dataUrl = await fileToDataUrl(file)
            setImageData(dataUrl)
        } catch (err) {
            setError(normalizeError(err))
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

        setError(null)

        const payload = {
            deviceName: draft.deviceName.trim(),
            status: draft.status,
            description: draft.description,
        }

        if (isUnit) {
            payload.location = draft.location
        }

        if (isMonitor) {
            payload.linkedUnitId = draft.linkedUnitId || null
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

            await assetApi.upsertAssetMeta({
                qrCode: device.qrCode,
                type,
                imageData: imageData || null,
                description: payload.description,
            })

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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Upload image
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                        />
                                        <div className="hidden sm:flex items-center text-xs text-gray-500">
                                            <Upload size={14} className="mr-1" />
                                            JPG/PNG
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Or image URL
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={imageUrlInput}
                                            onChange={(e) => setImageUrlInput(e.target.value)}
                                            placeholder="https://…"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleUseImageUrl}
                                            disabled={!imageUrlInput.trim()}
                                        >
                                            Use
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Device Name
                                </label>
                                <Input
                                    name="deviceName"
                                    value={draft.deviceName}
                                    onChange={handleChange}
                                    placeholder="e.g., System Unit #1"
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
                                    Status
                                </label>
                                <Select name="status" value={draft.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </Select>
                            </div>

                            {isUnit ? (
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
                            ) : null}

                            {isMonitor ? (
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
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
