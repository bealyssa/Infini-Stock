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

    useEffect(() => {
        if (isOpen && item?.id) {
            fetchLogs()
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
        } catch (error) {
            console.error('Failed to fetch logs:', error)
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                    <div className="rounded-lg border border-[#3d2e5c] overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => {
                                    // Build details string from status/location changes and description
                                    let detailsText = '-';

                                    // Prefer detailed description field if available
                                    if (log.description) {
                                        detailsText = log.description;
                                    } else {
                                        // Fallback to old status/location format
                                        const details = [];
                                        if (log.oldStatus || log.newStatus) {
                                            details.push(`Status: ${log.oldStatus || 'N/A'} → ${log.newStatus || 'N/A'}`);
                                        }
                                        if (log.oldLocation || log.newLocation) {
                                            details.push(`Location: ${log.oldLocation || 'N/A'} → ${log.newLocation || 'N/A'}`);
                                        }
                                        detailsText = details.length > 0 ? details.join(' | ') : '-';
                                    }

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
                                                {detailsText}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
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
    )
}

// Print QR Modal - Show QR code and device code for printing
export function PrintQRModal({ isOpen, onClose, item }) {
    const qrRef = useRef()

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=400,height=500')
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - ${item?.qrCode || item?.code || 'Print'}</title>
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
                            margin: 20px 0;
                        }
                        .code {
                            font-size: 18px;
                            font-weight: bold;
                            margin: 10px 0;
                            font-family: monospace;
                        }
                        .label {
                            color: #666;
                            margin: 5px 0;
                        }
                        @media print {
                            body {
                                padding: 10px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="label">Device Code</div>
                        <div class="code">${item?.qrCode || item?.code || 'N/A'}</div>
                        <div class="label" style="margin-top: 20px;">${item?.deviceName || item?.name || 'Device'}</div>
                        <div id="qrcode" class="qr-code"></div>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById('qrcode'), {
                            text: '${item?.qrCode || item?.code || ''}',
                            width: 200,
                            height: 200,
                            colorDark: '#000',
                            colorLight: '#fff'
                        });
                        window.print();
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
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

    // Parse changes if description contains semicolons
    const parseChanges = () => {
        if (!log.description) return []
        return log.description.split(';').map(change => change.trim()).filter(Boolean)
    }

    const changes = parseChanges()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Change Details</DialogTitle>
                    <DialogDescription>
                        Full details of the change made to this item
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Header Info */}
                    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">User</p>
                                <p className="text-sm text-white">{log.userName || 'System'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Action</p>
                                <p className="text-sm text-white capitalize">{log.action}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Date/Time</p>
                                <p className="text-sm text-white">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Item Type</p>
                                <p className="text-sm text-white">
                                    {log.monitor ? 'Monitor' : log.unit ? 'Unit' : log.asset ? 'Asset' : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Changes List */}
                    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                        <p className="text-xs text-gray-400 uppercase mb-3 font-semibold">All Changes</p>
                        {changes.length > 0 ? (
                            <div className="space-y-2">
                                {changes.map((change, idx) => (
                                    <div key={idx} className="text-sm text-gray-300 bg-black/30 p-2 rounded border-l-2 border-lavender-500">
                                        {change}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No changes logged</p>
                        )}
                    </div>

                    {/* Full Description */}
                    {log.description && (
                        <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                            <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">Full Description</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{log.description}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
