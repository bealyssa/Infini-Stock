import { QrCode, Zap } from 'lucide-react'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { assetApi } from '../api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    useDialog,
} from '../components/ui/Dialog'

function QRGenerator() {
    const previewDialog = useDialog()
    const [formData, setFormData] = useState({
        type: '',
        assetTag: '',
        description: '',
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [createdAsset, setCreatedAsset] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            setError('Image size must be less than 5MB')
            return
        }

        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (event) => {
            setImagePreview(event.target?.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setCreatedAsset(null)

        if (!formData.type) {
            setError('Asset type is required')
            return
        }

        const qrCode = formData.assetTag.trim()

        try {
            setSubmitting(true)
            const { data } = await assetApi.createAsset({
                type: formData.type,
                qrCode: qrCode ? qrCode : undefined,
                imageFile: imageFile || undefined,
                description: formData.description.trim() || undefined,
            })
            setCreatedAsset(data)
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || 'Failed to generate QR code'
            setError(message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen">
            <div className="content-full">
                <div className="content-centered max-w-6xl">
                    <div className="py-8">
                        <h1 className="text-3xl font-semibold text-white mb-1 tracking-tight flex items-center gap-2">
                            <QrCode className="text-lavender-200" size={28} />
                            QR Code Generator
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Create new assets and generate their QR codes
                        </p>
                    </div>

                    <div className="pb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left card: Form */}
                            <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
                                <div className="flex flex-col space-y-1.5 p-6 border-b border-white/10">
                                    <h2 className="text-xl font-semibold leading-none tracking-tight text-white">
                                        Create New Asset
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Fill in details to generate a QR code
                                    </p>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                                Asset Type *
                                            </label>
                                            <Select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                disabled={submitting}
                                                className="bg-black/20 shadow-inner shadow-black/40"
                                            >
                                                <option value="">Select type...</option>
                                                <option value="unit">System Unit</option>
                                                <option value="monitor">Monitor</option>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                                Asset Tag (optional)
                                            </label>
                                            <Input
                                                type="text"
                                                name="assetTag"
                                                placeholder="AST-2026-0001 (auto-generated if empty)"
                                                value={formData.assetTag}
                                                onChange={handleChange}
                                                disabled={submitting}
                                                className="bg-black/20 shadow-inner shadow-black/40"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                                Asset Image (optional)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    disabled={submitting}
                                                    className="hidden"
                                                    id="imageInput"
                                                />
                                                <label
                                                    htmlFor="imageInput"
                                                    className="inline-flex items-center justify-center w-full px-4 py-3 border border-dashed border-white/15 rounded-md bg-black/20 cursor-pointer hover:border-white/25 hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-300"
                                                >
                                                    {imageFile ? (
                                                        <span className="text-sm">{imageFile.name}</span>
                                                    ) : (
                                                        <span className="text-sm">Click to upload or drag image</span>
                                                    )}
                                                </label>
                                            </div>
                                            {imagePreview ? (
                                                <div className="mt-3 flex items-start gap-3">
                                                    <button
                                                        type="button"
                                                        className="rounded-md overflow-hidden border border-white/15 h-20 w-20 flex-shrink-0 hover:border-white/25"
                                                        onClick={() => previewDialog.onOpenChange(true)}
                                                        aria-label="Preview uploaded image"
                                                    >
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-400">
                                                            {imageFile?.name || 'Selected image'}
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="mt-2"
                                                            onClick={() => previewDialog.onOpenChange(true)}
                                                        >
                                                            Preview
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                                Description
                                            </label>
                                            <Input
                                                type="text"
                                                name="description"
                                                placeholder="e.g., Dell Monitor 27-inch, HP Desktop Unit"
                                                value={formData.description}
                                                onChange={handleChange}
                                                disabled={submitting}
                                                className="bg-black/20 shadow-inner shadow-black/40"
                                            />
                                        </div>

                                        {error ? (
                                            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                                {error}
                                            </div>
                                        ) : null}

                                        <Button className="w-full" disabled={submitting}>
                                            <Zap className="mr-2" size={20} />
                                            {submitting ? 'Generating...' : 'Generate QR Code'}
                                        </Button>
                                    </form>
                                </div>

                            </Card>

                            {/* Right card: Result */}
                            <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
                                <div className="flex flex-col space-y-1.5 p-6 border-b border-white/10">
                                    <h2 className="text-xl font-semibold leading-none tracking-tight text-white">
                                        Generated QR
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Preview and verify the asset details
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-6 shadow-inner shadow-black/50">
                                        {createdAsset?.qrCode ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="inline-block rounded-xl bg-white p-3 shadow-lg shadow-black/40">
                                                        <QRCode value={createdAsset.qrCode} size={180} />
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        Scan this QR code to view the asset
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    {createdAsset.imagePath ? (
                                                        <div className="rounded-lg overflow-hidden border border-white/10 h-44 w-full bg-black/20">
                                                            <img
                                                                src={createdAsset.imagePath}
                                                                alt="Asset"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : null}

                                                    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                                                        <p className="text-xs uppercase tracking-wider text-gray-500">Code</p>
                                                        <p className="text-gray-200 font-semibold break-all">
                                                            {createdAsset.qrCode}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="rounded-md border border-[#404040] bg-black/20 px-4 py-3">
                                                            <p className="text-xs uppercase tracking-wider text-gray-500">Type</p>
                                                            <p className="text-gray-200 text-sm">
                                                                {createdAsset.type === 'unit'
                                                                    ? 'System Unit'
                                                                    : createdAsset.type === 'monitor'
                                                                        ? 'Monitor'
                                                                        : createdAsset.type || '—'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
                                                            <p className="text-xs uppercase tracking-wider text-gray-500">Description</p>
                                                            <p className="text-gray-200 text-sm">
                                                                {createdAsset.description || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12">
                                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                                    <svg
                                                        width="42"
                                                        height="42"
                                                        viewBox="0 0 42 42"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect x="4" y="4" width="12" height="12" rx="3" stroke="#a78bfa" strokeWidth="2" opacity="0.9" />
                                                        <rect x="26" y="4" width="12" height="12" rx="3" stroke="#c4b5fd" strokeWidth="2" opacity="0.9" />
                                                        <rect x="4" y="26" width="12" height="12" rx="3" stroke="#c4b5fd" strokeWidth="2" opacity="0.9" />
                                                        <path d="M26 26H30V30H26V26Z" fill="#a78bfa" opacity="0.9" />
                                                        <path d="M32 26H38V32H32V26Z" fill="#7e22ce" opacity="0.65" />
                                                        <path d="M26 32H32V38H26V32Z" fill="#9333ea" opacity="0.65" />
                                                        <path d="M16 18H26" stroke="#a78bfa" strokeWidth="2" opacity="0.35" />
                                                        <path d="M18 22H28" stroke="#c4b5fd" strokeWidth="2" opacity="0.25" />
                                                    </svg>
                                                </div>

                                                <div className="mt-5 text-center">
                                                    <p className="text-gray-200 font-semibold">
                                                        No QR generated yet
                                                    </p>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Fill out the form to create an asset
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={previewDialog.open} onOpenChange={previewDialog.onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                        <DialogDescription>
                            Uploaded asset image
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Uploaded"
                                className="w-full max-h-[70vh] object-contain"
                            />
                        ) : (
                            <div className="p-6 text-sm text-gray-500">No image selected.</div>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => previewDialog.onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default QRGenerator
