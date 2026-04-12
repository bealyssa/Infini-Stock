import { Download, Image, MoreHorizontal, Pencil, Plus, Monitor, Trash2, Activity, Trash, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { monitorApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { capitalize } from '../lib/utils'
import { clampRowCount, exportToCsv, exportToDocx, exportToPdf } from '../lib/export'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from '../components/ui/Dialog'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { HistoryModal, PrintQRModal, DeleteConfirmationModal } from '../components/ActionModals'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import DeviceEditModal from '../components/DeviceEditModal'

function Monitors() {
    const dialogState = useDialog()
    const exportDialogState = useDialog()
    const detailsDialogState = useDialog()
    const editDialogState = useDialog()
    const [monitors, setMonitors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [exportFormat, setExportFormat] = useState('pdf')
    const [exportRows, setExportRows] = useState('50')
    const [exporting, setExporting] = useState(false)
    const [selectedMonitor, setSelectedMonitor] = useState(null)
    const [editingMonitor, setEditingMonitor] = useState(null)
    const [selectedMonitors, setSelectedMonitors] = useState(new Set())
    const [formData, setFormData] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        linkedUnit: '',
        modelType: '',
        serialNumber: '',
        condition: 'good',
        notes: '',
    })

    // Modal states
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [printQRModalOpen, setPrintQRModalOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [currentActionItem, setCurrentActionItem] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const formatDateTime = (value) => {
        if (!value) return '—'
        const dt = new Date(value)
        if (Number.isNaN(dt.getTime())) return '—'
        return dt.toLocaleString()
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    useEffect(() => {
        const fetchMonitors = async () => {
            try {
                const { data } = await monitorApi.listMonitors()
                setMonitors(data)
                setError(null)
            } catch (err) {
                setError(err.response?.data?.message || err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMonitors()
    }, [])

    const getStatusVariant = (status) => {
        const variants = {
            active: 'success',
            maintenance: 'warning',
            inactive: 'secondary',
        }

        return variants[status] || 'outline'
    }

    const toggleMonitorSelection = (monitorId) => {
        const newSelected = new Set(selectedMonitors)
        if (newSelected.has(monitorId)) {
            newSelected.delete(monitorId)
        } else {
            newSelected.add(monitorId)
        }
        setSelectedMonitors(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedMonitors.size === pagedMonitors.length) {
            setSelectedMonitors(new Set())
        } else {
            setSelectedMonitors(new Set(pagedMonitors.map(m => m.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedMonitors.size === 0) return
        setCurrentActionItem(null)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteMonitors = async () => {
        setDeleting(true)
        try {
            const idsToDelete = Array.from(selectedMonitors)
            await Promise.all(idsToDelete.map(id => monitorApi.deleteMonitor(id)))
            setMonitors(prev => prev.filter(m => !idsToDelete.includes(m.id)))
            setSelectedMonitors(new Set())
            setDeleteConfirmOpen(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete monitors')
        } finally {
            setDeleting(false)
        }
    }

    const handleHistoryClick = (monitor) => {
        setCurrentActionItem(monitor)
        setHistoryModalOpen(true)
    }

    const handlePrintQRClick = (monitor) => {
        setCurrentActionItem(monitor)
        setPrintQRModalOpen(true)
    }

    const handleDeleteClick = (monitor) => {
        setCurrentActionItem(monitor)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteSingleMonitor = async () => {
        if (!currentActionItem) return
        setDeleting(true)
        try {
            await monitorApi.deleteMonitor(currentActionItem.id)
            setMonitors(prev => prev.filter(m => m.id !== currentActionItem.id))
            setDeleteConfirmOpen(false)
            setCurrentActionItem(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete monitor')
        } finally {
            setDeleting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (currentActionItem) {
            await confirmDeleteSingleMonitor()
        } else {
            await confirmDeleteMonitors()
        }
    }

    const filteredMonitors = monitors.filter((monitor) => {
        const matchesStatus =
            statusFilter === 'all' || monitor.status === statusFilter
        const haystack = [
            monitor.deviceName,
            monitor.qrCode,
            monitor.linkedUnit?.deviceName,
            monitor.description,
            monitor.createdBy,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        const matchesSearch = haystack.includes(searchQuery.toLowerCase())

        return matchesStatus && matchesSearch
    })

    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, monitors.length])

    const totalPages = Math.max(1, Math.ceil(filteredMonitors.length / ITEMS_PER_PAGE))
    const pagedMonitors = filteredMonitors.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const filterPills = [
        { key: 'all', label: 'All', count: monitors.length },
        {
            key: 'active',
            label: 'Active',
            count: monitors.filter((monitor) => monitor.status === 'active').length,
        },
        {
            key: 'maintenance',
            label: 'Maintenance',
            count: monitors.filter((monitor) => monitor.status === 'maintenance').length,
        },
        {
            key: 'inactive',
            label: 'Inactive',
            count: monitors.filter((monitor) => monitor.status === 'inactive').length,
        },
    ]

    const handleAddMonitor = (e) => {
        e.preventDefault()
        // TODO: Call API to create monitor
        console.log('Adding monitor:', formData)
        setFormData({ deviceName: '', qrCode: '', status: 'active', linkedUnit: '' })
        dialogState.onOpenChange(false)
    }

    const handleExport = async () => {
        const max = filteredMonitors.length
        const count = clampRowCount(exportRows, max)
        const rows = filteredMonitors.slice(0, count).map((monitor) => ({
            deviceName: monitor.deviceName,
            qrCode: monitor.qrCode,
            modelType: monitor.modelType || 'N/A',
            serialNumber: monitor.serialNumber || 'N/A',
            condition: capitalize(monitor.condition || 'unknown'),
            status: capitalize(monitor.status),
            linkedUnit: monitor.linkedUnit?.deviceName || '—',
            description: monitor.description || 'No description',
            notes: monitor.notes || 'No notes',
            createdBy: monitor.createdBy || 'Unknown',
        }))

        const columns = [
            { key: 'deviceName', header: 'Device' },
            { key: 'qrCode', header: 'Code' },
            { key: 'modelType', header: 'Model' },
            { key: 'serialNumber', header: 'Serial' },
            { key: 'condition', header: 'Condition' },
            { key: 'status', header: 'Status' },
            { key: 'linkedUnit', header: 'Linked Unit' },
            { key: 'description', header: 'Description' },
            { key: 'notes', header: 'Notes' },
            { key: 'createdBy', header: 'Created By' },
        ]

        const stamp = new Date().toISOString().slice(0, 10)
        const baseName = `monitors-${stamp}`

        try {
            setExporting(true)
            if (exportFormat === 'csv') {
                exportToCsv({
                    filename: `${baseName}.csv`,
                    columns,
                    rows,
                })
            } else if (exportFormat === 'docx') {
                await exportToDocx({
                    filename: `${baseName}.docx`,
                    title: `Monitors (first ${count} rows)`,
                    columns,
                    rows,
                })
            } else {
                await exportToPdf({
                    filename: `${baseName}.pdf`,
                    title: `Monitors (first ${count} rows)`,
                    columns,
                    rows,
                })
            }
            exportDialogState.onOpenChange(false)
        } finally {
            setExporting(false)
        }
    }

    const openDetails = (monitor) => {
        setSelectedMonitor(monitor)
        detailsDialogState.onOpenChange(true)
    }

    const openEdit = (monitor) => {
        setEditingMonitor(monitor)
        editDialogState.onOpenChange(true)
    }

    if (loading) {
        return <FullPageLoader title="Loading monitors..." />
    }

    return (
        <div className="content-full">
            <div className="content-centered">
                <div className="py-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Monitors
                        </h1>
                        <p className="text-gray-400">
                            Manage and track all monitors and displays
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Dialog open={exportDialogState.open} onOpenChange={exportDialogState.onOpenChange}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <Download className="mr-2" size={18} />
                                    Export
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Export Monitors</DialogTitle>
                                    <DialogDescription>
                                        Choose a format and how many rows to export.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Format
                                        </label>
                                        <Select
                                            value={exportFormat}
                                            onChange={(e) => setExportFormat(e.target.value)}
                                            disabled={exporting}
                                        >
                                            <option value="pdf">PDF</option>
                                            <option value="docx">DOCX</option>
                                            <option value="csv">CSV</option>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Rows to export
                                        </label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={Math.max(filteredMonitors.length, 1)}
                                            value={exportRows}
                                            onChange={(e) => setExportRows(e.target.value)}
                                            disabled={exporting}
                                            placeholder="e.g., 50"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Available rows: {filteredMonitors.length}. Leaving empty exports all.
                                        </p>
                                    </div>

                                    <DialogFooter className="pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => exportDialogState.onOpenChange(false)}
                                            disabled={exporting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleExport}
                                            disabled={exporting || filteredMonitors.length === 0}
                                        >
                                            {exporting ? 'Exporting…' : 'Export'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={dialogState.open} onOpenChange={dialogState.onOpenChange}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2" size={20} />
                                    Add Monitor
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Monitor</DialogTitle>
                                    <DialogDescription>
                                        Enter the details for the new monitor device
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleAddMonitor}>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Device Name
                                            </label>
                                            <Input
                                                name="deviceName"
                                                placeholder="e.g., Monitor Display #1"
                                                value={formData.deviceName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                QR Code
                                            </label>
                                            <Input
                                                name="qrCode"
                                                placeholder="e.g., QR-MON-001"
                                                value={formData.qrCode}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Model Type
                                            </label>
                                            <Input
                                                name="modelType"
                                                placeholder="e.g., Dell U2723DE"
                                                value={formData.modelType}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Serial Number
                                            </label>
                                            <Input
                                                name="serialNumber"
                                                placeholder="e.g., DELL-U2723DE-001"
                                                value={formData.serialNumber}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <Select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="maintenance">Maintenance</option>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Condition
                                            </label>
                                            <Select
                                                name="condition"
                                                value={formData.condition}
                                                onChange={handleInputChange}
                                            >
                                                <option value="good">Good</option>
                                                <option value="fair">Fair</option>
                                                <option value="poor">Poor</option>
                                                <option value="broken">Broken</option>
                                            </Select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Linked System Unit (Optional)
                                            </label>
                                            <Input
                                                name="linkedUnit"
                                                placeholder="e.g., Unit #1"
                                                value={formData.linkedUnit}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Notes (Optional)
                                            </label>
                                            <Input
                                                name="notes"
                                                placeholder="e.g., Recently calibrated, color accurate"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => dialogState.onOpenChange(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            <Plus className="mr-2" size={16} />
                                            Add Monitor
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Dialog
                    open={detailsDialogState.open}
                    onOpenChange={(open) => {
                        detailsDialogState.onOpenChange(open)
                        if (!open) setSelectedMonitor(null)
                    }}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedMonitor?.deviceName || 'Monitor Details'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedMonitor?.qrCode
                                    ? `QR: ${selectedMonitor.qrCode}`
                                    : 'View monitor information'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 mt-4">
                            {/* Left: Image/QR */}
                            <div className="flex flex-col gap-3">
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                    {selectedMonitor?.imageData || selectedMonitor?.imageUrl ? (
                                        <img
                                            src={selectedMonitor.imageData || selectedMonitor.imageUrl}
                                            alt={selectedMonitor.deviceName || 'Monitor'}
                                            className="w-full h-48 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-[#3d2e5c] bg-[#0f0a1a]">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <Image size={24} />
                                                <span className="text-xs">No image</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedMonitor?.qrCode && (
                                    <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">QR Code</div>
                                        <code className="block border border-[#3d2e5c] bg-[#0f0a1a] text-white px-2 py-2 rounded-md font-mono text-xs text-center">
                                            {selectedMonitor.qrCode}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {/* Right: Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-wrap items-center gap-1 col-span-2">
                                    {selectedMonitor?.status ? (
                                        <Badge variant={getStatusVariant(selectedMonitor.status)}>
                                            {capitalize(selectedMonitor.status)}
                                        </Badge>
                                    ) : null}
                                    {selectedMonitor?.condition ? (
                                        <Badge variant={selectedMonitor?.condition === 'poor' ? 'secondary' : selectedMonitor?.condition === 'fair' ? 'warning' : 'success'}>
                                            {capitalize(selectedMonitor.condition)}
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Model Type</div>
                                    <div className="text-sm text-gray-200">{selectedMonitor?.modelType || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Serial Number</div>
                                    <div className="text-xs text-gray-200 font-mono truncate">{selectedMonitor?.serialNumber || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Created By</div>
                                    <div className="text-sm text-gray-200">{selectedMonitor?.createdBy || 'Unknown'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Created At</div>
                                    <div className="text-xs text-gray-200">{formatDateTime(selectedMonitor?.createdAt)}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Linked Unit</div>
                                    <div className="text-sm text-gray-200">{selectedMonitor?.linkedUnit?.deviceName || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Description</div>
                                    <div className="text-sm text-gray-200">{selectedMonitor?.description || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Notes</div>
                                    <div className="text-sm text-gray-200">{selectedMonitor?.notes || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCurrentActionItem(selectedMonitor)
                                    setPrintQRModalOpen(true)
                                }}
                                className="gap-2"
                            >
                                <Printer size={16} />
                                Print QR
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => detailsDialogState.onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DeviceEditModal
                    open={editDialogState.open}
                    onOpenChange={(open) => {
                        editDialogState.onOpenChange(open)
                        if (!open) setEditingMonitor(null)
                    }}
                    type="monitor"
                    device={editingMonitor}
                    onSaved={(updatedMonitor) => {
                        setMonitors((prev) =>
                            prev.map((monitor) =>
                                monitor.id === updatedMonitor.id
                                    ? { ...monitor, ...updatedMonitor }
                                    : monitor,
                            ),
                        )
                    }}
                />

                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {filterPills.map((pill) => (
                            <button
                                key={pill.key}
                                type="button"
                                onClick={() => setStatusFilter(pill.key)}
                                className={`rounded-full border px-4 py-2 text-sm transition ${statusFilter === pill.key
                                    ? 'border-lavender-600 bg-lavender-600 text-white'
                                    : 'border-[#3d2e5c] bg-[#1f1a2f] text-lavender-300 hover:border-lavender-500 hover:bg-lavender-500/10'
                                    }`}
                            >
                                {pill.label}
                                <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs">
                                    {pill.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto lg:max-w-sm items-center">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={selectedMonitors.size === 0}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash size={16} className="mr-2" />
                            Delete {selectedMonitors.size > 0 && `(${selectedMonitors.size})`}
                        </Button>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search monitors by name, QR, or linked unit"
                        />
                    </div>
                </div>

                <Card>
                    {error ? (
                        <div className="m-6 rounded-lg border border-red-500/30 bg-red-600/20 p-4 text-red-300">
                            Warning: {error}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedMonitors.size === pagedMonitors.length && pagedMonitors.length > 0}
                                                onChange={toggleSelectAll}
                                                className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                            />
                                        </TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pagedMonitors.length > 0 ? (
                                        pagedMonitors.map((monitor) => (
                                            <TableRow key={monitor.id}
                                                onClick={() => openDetails(monitor)}
                                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMonitors.has(monitor.id)}
                                                        onChange={() => toggleMonitorSelection(monitor.id)}
                                                        className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                                    />
                                                </TableCell>
                                                <TableCell className="cursor-pointer">
                                                    <div>
                                                        <div className="font-medium text-white truncate">
                                                            {monitor.deviceName}
                                                        </div>
                                                        <div className="text-xs text-gray-300 mt-1 truncate">
                                                            Created by {monitor.createdBy || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="inline-block text-sm bg-gray-900 text-white px-3 py-2 rounded font-mono">
                                                        {monitor.qrCode}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    {monitor.modelType || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={monitor.condition === 'poor' ? 'secondary' : monitor.condition === 'fair' ? 'warning' : 'success'}>
                                                        {capitalize(monitor.condition || 'unknown')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(monitor.status)}>
                                                        {capitalize(monitor.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-300 hover:text-white"
                                                            onClick={(e) => { e.stopPropagation(); openEdit(monitor) }}
                                                            aria-label={`Edit ${monitor.deviceName}`}
                                                        >
                                                            <Pencil size={18} />
                                                        </Button>
                                                        <Dropdown
                                                            trigger={
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-gray-300 hover:text-white"
                                                                    aria-label={`More options for ${monitor.deviceName}`}
                                                                >
                                                                    <MoreHorizontal size={18} />
                                                                </Button>
                                                            }
                                                        >
                                                            <DropdownItem
                                                                icon={Activity}
                                                                label="View History"
                                                                onClick={() => handleHistoryClick(monitor)}
                                                            />
                                                            <DropdownItem
                                                                icon={Download}
                                                                label="Print QR"
                                                                onClick={() => handlePrintQRClick(monitor)}
                                                            />
                                                            <DropdownItem
                                                                icon={Trash2}
                                                                label="Delete"
                                                                onClick={() => handleDeleteClick(monitor)}
                                                            />
                                                        </Dropdown>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="8" className="text-center py-12">
                                                <div className="inline-flex flex-col items-center justify-center">
                                                    <Monitor className="text-gray-600 mb-3" size={40} />
                                                    <p className="text-gray-400">
                                                        No monitors found
                                                    </p>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Add your first monitor to get started
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </Card>

                <div className="mt-1">
                    <div className="py-4">
                        <TablePagination
                            align="end"
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <HistoryModal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                item={currentActionItem}
                itemType="monitor"
            />

            <PrintQRModal
                isOpen={printQRModalOpen}
                onClose={() => setPrintQRModalOpen(false)}
                item={currentActionItem}
            />

            <DeleteConfirmationModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemCount={currentActionItem ? 1 : selectedMonitors.size}
                itemType="monitor"
                isDeleting={deleting}
            />
        </div>
    )
}

export default Monitors
