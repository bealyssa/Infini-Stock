import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog'
import { Button } from './ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table'
import { AlertCircle, Printer, X } from 'lucide-react'
import QRCode from 'react-qr-code'
import api from '../api/client'

// History Modal - Show connected logs
export function HistoryModal({ isOpen, onClose, item, itemType = 'monitor' }) {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [expandedLog, setExpandedLog] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const MAX_PREVIEW_LENGTH = 80

    useEffect(() => {
        if (isOpen && item?.id) {
            fetchLogs()
            setExpandedLog(null)
        }
    }, [isOpen, item?.id])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const response = await api.get('/activity-logs', {
                params: {
                    limit: 100,
                    itemId: item.id,
                    itemType: itemType
                }
            })
            const allLogs = response.data || []
            setLogs(allLogs)
            setCurrentPage(1)
        } catch (error) {
            console.error('Failed to fetch logs:', error)
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    const getDetailsText = (log) => {
        let detailsText = '-'
        if (log.description) {
            try {
                // Try to parse as JSON (new format with changes array)
                const parsed = JSON.parse(log.description)
                if (parsed.changes && Array.isArray(parsed.changes)) {
                    // Format as "field: before → after"
                    const changes = parsed.changes.map(c => {
                        const before = typeof c.before === 'string' ? c.before : String(c.before)
                        const after = typeof c.after === 'string' ? c.after : String(c.after)
                        return `${c.field}: ${before} → ${after}`
                    }).join('; ')
                    detailsText = changes || '-'
                } else {
                    detailsText = log.description
                }
            } catch (e) {
                // Legacy format - use as-is
                detailsText = log.description
            }
        } else {
            const details = []
            if (log.oldStatus || log.newStatus) {
                details.push(`Status: ${log.oldStatus || 'N/A'} → ${log.newStatus || 'N/A'}`)
            }
            if (log.oldLocation || log.newLocation) {
                details.push(`Location: ${log.oldLocation || 'N/A'} → ${log.newLocation || 'N/A'}`)
            }
            detailsText = details.length > 0 ? details.join('; ') : '-'
        }
        return detailsText
    }

    const isTruncated = (detailsText) => {
        return detailsText.length > MAX_PREVIEW_LENGTH
    }

    const openDetailsModal = (log) => {
        setExpandedLog(log)
    }

    const closeDetailsModal = () => {
        setExpandedLog(null)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Activity History</DialogTitle>
                        <DialogDescription>
                            {item?.deviceName ? (
                                <>
                                    {item.deviceName} ({item.qrCode || item.code || 'N/A'})
                                </>
                            ) : (
                                'View all connected activity logs for this item'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="py-8 text-center text-gray-400">
                            Loading activity logs...
                        </div>
                    ) : logs.length > 0 ? (
                        <>
                            <div className="rounded-lg border border-[#3d2e5c] overflow-hidden max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-[#1a1025]">
                                        <TableRow>
                                            <TableHead>Date/Time</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const startIdx = (currentPage - 1) * itemsPerPage
                                            const endIdx = startIdx + itemsPerPage
                                            const paginatedLogs = logs.slice(startIdx, endIdx)

                                            return paginatedLogs.map((log) => {
                                                const detailsText = getDetailsText(log)
                                                const truncated = isTruncated(detailsText)
                                                const displayText = detailsText.substring(0, MAX_PREVIEW_LENGTH)

                                                return (
                                                    <TableRow key={log.id}>
                                                        <TableCell>
                                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Invalid Date'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="inline-block px-2 py-1 rounded text-xs bg-lavender-600/20 text-lavender-300">
                                                                {log.action || 'N/A'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{log.userName || 'System'}</TableCell>
                                                        <TableCell className="text-sm text-gray-300">
                                                            <div className="flex flex-col gap-1">
                                                                <span>
                                                                    {displayText}
                                                                    {truncated ? '...' : ''}
                                                                </span>
                                                                {truncated && (
                                                                    <button
                                                                        onClick={() => openDetailsModal(log)}
                                                                        className="text-xs text-lavender-400 hover:text-lavender-300 font-medium w-fit"
                                                                    >
                                                                        View More
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                                <span>{logs.length} total entries</span>
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        ← Prev
                                    </Button>
                                    <span className="px-2 py-1">
                                        Page {currentPage} of {Math.max(1, Math.ceil(logs.length / itemsPerPage))}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(logs.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(logs.length / itemsPerPage) || logs.length === 0}
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            No activity logs found
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={!!expandedLog} onOpenChange={closeDetailsModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Activity Details</DialogTitle>
                        <DialogDescription>
                            Full details for this activity entry
                        </DialogDescription>
                    </DialogHeader>

                    {expandedLog && (
                        <div className="space-y-2">
                            {/* Date/Time */}
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400">Timestamp:</span> {expandedLog.timestamp ? new Date(expandedLog.timestamp).toLocaleString() : 'Invalid Date'}
                            </div>

                            {/* Action */}
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400">Action:</span>{' '}
                                <span className="inline-block px-2 py-1 rounded text-xs bg-lavender-600/20 text-lavender-300 ml-1">
                                    {expandedLog.action || 'N/A'}
                                </span>
                            </div>

                            {/* User */}
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400">User:</span> {expandedLog.userName || 'System'}
                            </div>

                            {/* Changes - Each on separate line */}
                            <div className="border-t border-[#3d2e5c] pt-3 mt-3 space-y-2">
                                <h3 className="text-sm font-semibold text-gray-200">Changes Made</h3>
                                {(() => {
                                    let changes = []
                                    if (expandedLog.description) {
                                        try {
                                            const parsed = JSON.parse(expandedLog.description)
                                            if (parsed.changes && Array.isArray(parsed.changes)) {
                                                changes = parsed.changes
                                            }
                                        } catch (e) {
                                            // If not JSON, show as plain text
                                            return (
                                                <div className="text-sm text-gray-300">
                                                    {expandedLog.description}
                                                </div>
                                            )
                                        }
                                    }

                                    // Also handle legacy format
                                    if (changes.length === 0) {
                                        if (expandedLog.oldStatus && expandedLog.newStatus) {
                                            changes.push({ field: 'Status', before: expandedLog.oldStatus, after: expandedLog.newStatus })
                                        }
                                        if (expandedLog.oldLocation && expandedLog.newLocation) {
                                            changes.push({ field: 'Location', before: expandedLog.oldLocation, after: expandedLog.newLocation })
                                        }
                                    }

                                    if (changes.length === 0) {
                                        return <div className="text-sm text-gray-500">No changes recorded</div>
                                    }

                                    return (
                                        <div className="space-y-1 text-sm">
                                            {changes.map((change, idx) => (
                                                <div key={idx} className="text-gray-300">
                                                    <span className="text-lavender-300 font-medium">{change.field}:</span>{' '}
                                                    <span className="text-red-300/70">{change.before}</span>
                                                    {' → '}
                                                    <span className="text-green-300/70">{change.after}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDetailsModal}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Print QR Modal - Show QR code and device code for printing
export function PrintQRModal({ isOpen, onClose, item }) {
    const qrRef = useRef()

    const handlePrint = () => {
        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>QR Code - ${item?.qrCode || item?.code || 'Print'}</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            font-family: Arial, sans-serif;
                            background: white;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                        }
                        .qr-code {
                            margin: 30px 0;
                        }
                        .device-code {
                            font-size: 20px;
                            font-weight: bold;
                            margin: 15px 0;
                            font-family: monospace;
                            letter-spacing: 2px;
                        }
                        .device-name {
                            font-size: 16px;
                            color: #333;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="device-code">${item?.qrCode || item?.code || 'N/A'}</div>
                        <div id="qrcode" class="qr-code"></div>
                        <div class="device-name">${item?.deviceName || item?.name || 'Device'}</div>
                    </div>
                    <script>
                        new QRCode(document.getElementById('qrcode'), {
                            text: '${item?.qrCode || item?.code || ''}',
                            width: 250,
                            height: 250,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.H
                        });
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    <\/script>
                </body>
            </html>
        `)
        iframeDoc.close()

        // Clean up iframe after print dialog closes
        setTimeout(() => {
            document.body.removeChild(iframe)
        }, 1000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Print QR Code & Barcode</DialogTitle>
                    <DialogDescription>
                        Ready for barcode label printing
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-8 bg-[#0f0a1a] rounded-lg border border-[#3d2e5c] p-6">
                    <div className="text-center mb-4">
                        <div className="text-xs text-gray-400 mb-2">Device Code</div>
                        <div className="text-lg font-mono font-bold text-white mb-4">
                            {item?.qrCode || item?.code || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-300 mb-6">
                            {item?.deviceName || item?.name || 'Device'}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                        <QRCode
                            ref={qrRef}
                            value={item?.qrCode || item?.code || ''}
                            size={200}
                            level="H"
                            includeMargin={true}
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="bg-lavender-600 hover:bg-lavender-700 flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Delete Confirmation Modal - Reusable for single and bulk delete
export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    itemCount = 1,
    itemType = 'monitor',
    isDeleting = false
}) {
    const isBulk = itemCount > 1

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-red-500" size={24} />
                        <DialogTitle>Delete {isBulk ? 'Items' : 'Item'}?</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isBulk ? (
                            <>
                                You are about to delete <span className="font-bold text-red-400">{itemCount}</span> {itemType}(s).
                                This action cannot be undone.
                            </>
                        ) : (
                            <>
                                You are about to delete this {itemType}.
                                This action cannot be undone.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-sm text-red-300">
                        ⚠️ This will permanently delete the {isBulk ? 'selected items' : 'item'} from the system.
                    </p>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Change Details Modal - Show full details of a change
export function ChangeDetailsModal({ isOpen, onClose, log }) {
    if (!log) return null

    // Parse description to extract changes
    let changes = []
    if (log.description) {
        try {
            const parsed = JSON.parse(log.description)
            if (parsed.changes && Array.isArray(parsed.changes)) {
                changes = parsed.changes
            }
        } catch (e) {
            // If not JSON, try to parse as plain text
            if (log.description.includes(';')) {
                // Legacy format - split by semicolon
                changes = log.description.split(';').map(line => ({
                    text: line.trim()
                }))
            } else {
                // Single line description
                changes = [{ text: log.description }]
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Activity Details</DialogTitle>
                    <DialogDescription>
                        Full details for this activity entry
                    </DialogDescription>
                </DialogHeader>

                {log && (
                    <div className="space-y-6">
                        {/* Date/Time */}
                        <div className="border-b border-[#3d2e5c] pb-4 space-y-3">
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400 font-medium">Timestamp:</span>{' '}
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Invalid Date'}
                            </div>

                            {/* Action */}
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400 font-medium">Action:</span>{' '}
                                <span className="inline-block px-2 py-1 rounded text-xs bg-lavender-600/20 text-lavender-300 ml-1">
                                    {log.action || 'N/A'}
                                </span>
                            </div>

                            {/* User */}
                            <div className="text-sm text-gray-300">
                                <span className="text-gray-400 font-medium">User:</span> {log.userName || 'System'}
                            </div>

                            {/* Item */}
                            {(log.itemQr || log.itemName) && (
                                <div className="text-sm text-gray-300">
                                    <span className="text-gray-400 font-medium">Item:</span> {log.itemQr || log.itemName}
                                </div>
                            )}
                        </div>

                        {/* Changes Details */}
                        {changes.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-200">Changes Made</h3>
                                <div className="space-y-1 text-sm">
                                    {changes.map((change, idx) => (
                                        <div key={idx} className="text-gray-300">
                                            {change.field ? (
                                                // Structured change object - single line
                                                <>
                                                    <span className="text-lavender-300 font-medium">{change.field}:</span>{' '}
                                                    <span className="text-red-300/70">{change.before}</span>
                                                    {' → '}
                                                    <span className="text-green-300/70">{change.after}</span>
                                                </>
                                            ) : (
                                                // Legacy text change
                                                <>{change.text}</>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Linked Assets Modal - Show error when trying to delete item with linked assets
export function LinkedAssetsModal({ isOpen, onClose, item, linkedCount, linkedAssets = [], itemType = 'unit' }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-orange-500" size={24} />
                        <DialogTitle>Cannot Delete {itemType}</DialogTitle>
                    </div>
                    <DialogDescription>
                        This {itemType} has {linkedCount} linked {linkedCount === 1 ? 'asset' : 'assets'} that must be unlinked or deleted first.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-300">
                        {item?.deviceName || 'This item'} is currently linked to other assets. Please unlink or delete them before proceeding.
                    </p>
                </div>

                {linkedAssets && linkedAssets.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-200 mb-3">Linked Monitors by Unit:</h3>
                        <div className="space-y-4 max-h-64 overflow-y-auto rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                            {linkedAssets.map((unitGroup, unitIdx) => (
                                <div key={unitIdx} className="pb-4 border-b border-[#3d2e5c] last:border-b-0 last:pb-0">
                                    {/* Unit Header */}
                                    <div className="bg-[#2a1f3d] rounded border border-[#4d3d66] p-2 mb-2">
                                        <div className="text-sm font-semibold text-white">{unitGroup.unitName}</div>
                                        {unitGroup.serialNumber && (
                                            <div className="text-xs text-gray-400">S/N: {unitGroup.serialNumber}</div>
                                        )}
                                    </div>

                                    {/* Monitors for this Unit */}
                                    <div className="space-y-2 ml-2">
                                        {unitGroup.monitors.map((monitor, monitorIdx) => (
                                            <div key={monitorIdx} className="text-sm border-l-2 border-[#4d3d66] pl-3">
                                                <div className="text-white truncate font-medium">
                                                    {monitor.deviceName || `Monitor ${monitorIdx + 1}`}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    QR: {monitor.qrCode || '—'}
                                                </div>
                                                {monitor.status && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Status: <span className="text-gray-300">{monitor.status}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Got It
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
