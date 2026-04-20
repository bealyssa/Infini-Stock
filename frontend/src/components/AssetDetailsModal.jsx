import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog'
import { Badge } from './ui/Badge'
import { Copy } from 'lucide-react'
import QRCode from 'react-qr-code'

const STATUS_LABELS = {
    active: 'Active',
    repair: 'Repair',
    broken: 'Broken',
    inactive: 'Inactive',
    maintenance: 'Maintenance',
}

const STATUS_COLORS = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    repair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    broken: 'bg-red-500/20 text-red-400 border-red-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    maintenance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    return String(value)
}

const DetailRow = ({ label, value, copyable = false }) => {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
    }

    const formattedValue = formatValue(value)
    return (
        <div className="flex items-start justify-between gap-4 border-b border-[#3d2e5c] py-3 px-4 last:border-b-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-right text-sm text-gray-200 break-words">{formattedValue}</span>
                {copyable && value && formattedValue !== '—' && (
                    <button
                        onClick={() => copyToClipboard(value)}
                        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                    >
                        <Copy size={14} />
                    </button>
                )}
            </div>
        </div>
    )
}

export function AssetDetailsModal({ isOpen, onClose, asset, loading = false }) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[1400px] h-[90vh] flex flex-col max-w-[95vw]">
                <DialogHeader>
                    <DialogTitle>Asset Details</DialogTitle>
                    <DialogDescription>
                        {formatValue(asset?.deviceName) !== '—' ? asset?.deviceName : `QR: ${asset?.qrCode || 'Unknown'}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400">Loading…</p>
                        </div>
                    ) : !asset ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400">No asset data</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                            {/* Left Column - Image, QR Code & Status */}
                            <div className="space-y-4">
                                {/* Image Section */}
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4">
                                    {asset.imageData ? (
                                        <img
                                            src={asset.imageData}
                                            alt={asset.qrCode}
                                            className="w-[300px] h-[240px] rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[#3d2e5c] bg-[#0f0a1a] text-sm text-gray-500">
                                            No image available
                                        </div>
                                    )}
                                </div>

                                {/* QR Code Section */}
                                {asset.qrCode && (
                                    <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4 flex flex-col items-center">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">QR Code</span>
                                        <div className="bg-white p-2 rounded-lg">
                                            <QRCode value={asset.qrCode} size={150} level="H" includemargin={true} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3 text-center break-all">{asset.qrCode}</p>
                                    </div>
                                )}

                                {/* Status Badge */}
                                {asset.status && (
                                    <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</span>
                                        <div className="mt-2">
                                            <Badge className={`border ${STATUS_COLORS[asset.status] || STATUS_COLORS.inactive}`}>
                                                {STATUS_LABELS[asset.status] || asset.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Condition Badge */}
                                {asset.condition && (
                                    <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Condition</span>
                                        <div className="mt-2">
                                            <Badge className="border border-lavender-500/30 bg-lavender-500/20 text-lavender-300">
                                                {asset.condition}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - All Details */}
                            <div className="space-y-4">
                                {/* Core Information - Always show */}
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                                    <div className="bg-[#1a1530] px-4 py-3 border-b border-[#3d2e5c]">
                                        <h3 className="text-sm font-semibold text-gray-200">Basic Information</h3>
                                    </div>
                                    <DetailRow label="Device Name" value={asset.deviceName} />
                                    <DetailRow label="QR Code" value={asset.qrCode} copyable />
                                    <DetailRow label="Type" value={asset.type ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1) : asset.type} />
                                    <DetailRow label="Location" value={asset.location} />
                                </div>

                                {/* Device Specifications */}
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                                    <div className="bg-[#1a1530] px-4 py-3 border-b border-[#3d2e5c]">
                                        <h3 className="text-sm font-semibold text-gray-200">Specifications</h3>
                                    </div>
                                    <DetailRow label="Model Type" value={asset.modelType} />
                                    <DetailRow label="Serial Number" value={asset.serialNumber} copyable />
                                    {asset.description && (
                                        <div className="border-b border-[#3d2e5c] py-3 px-4 last:border-b-0">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Description</span>
                                            <p className="text-sm text-gray-200 mt-2 break-words">{asset.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Information */}
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                                    <div className="bg-[#1a1530] px-4 py-3 border-b border-[#3d2e5c]">
                                        <h3 className="text-sm font-semibold text-gray-200">Additional Details</h3>
                                    </div>
                                    <DetailRow label="Linked Unit" value={asset.linkedUnit?.deviceName || asset.linkedUnitId} />
                                    {asset.notes && (
                                        <div className="border-b border-[#3d2e5c] py-3 px-4 last:border-b-0">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</span>
                                            <p className="text-sm text-gray-200 mt-2 break-words">{asset.notes}</p>
                                        </div>
                                    )}
                                    <DetailRow label="Created" value={asset.createdAt ? new Date(asset.createdAt).toLocaleString() : ''} />
                                    <DetailRow label="Updated" value={asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : ''} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
