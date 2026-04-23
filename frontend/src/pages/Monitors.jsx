import { Download, Image, MoreHorizontal, Pencil, Plus, Monitor, Trash2, Activity, Trash, Printer, RefreshCw, Upload, Info, Eye } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import { monitorApi, unitApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { capitalize } from '../lib/utils'
import { clampRowCount, exportToCsv } from '../lib/export'
import { canEditData, isViewOnly, isTechnicianLimitedOps, getTechnicianOperations } from '../lib/permissions'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from '../components/ui/Dialog'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { HistoryModal, PrintQRModal, DeleteConfirmationModal, LinkedAssetsModal } from '../components/ActionModals'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import DeviceEditModal from '../components/DeviceEditModal'
import { Portal } from '../components/Portal'
import { ToastContainer } from '../components/ui/Toast'

function Monitors() {
    const canEdit = canEditData()
    const viewOnly = isViewOnly()
    const isTechnicianLimited = isTechnicianLimitedOps()
    const technicianOps = getTechnicianOperations()
 
    const dialogState = useDialog()
    const exportDialogState = useDialog()
    const detailsDialogState = useDialog()
    const editDialogState = useDialog()
    const [monitors, setMonitors] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [exportRows, setExportRows] = useState('50')
    const [exporting, setExporting] = useState(false)
    const [selectedMonitor, setSelectedMonitor] = useState(null)
    const [editingMonitor, setEditingMonitor] = useState(null)
    const [selectedMonitors, setSelectedMonitors] = useState(new Set())
    const [unitsList, setUnitsList] = useState([])
    const [unitsSearchQuery, setUnitsSearchQuery] = useState('')
    const [showUnitsDropdown, setShowUnitsDropdown] = useState(false)
    const [inputPosition, setInputPosition] = useState({ top: 0, left: 0, width: 0 })
    const unitsInputRef = useRef(null)
    const [formData, setFormData] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        linkedUnit: '',
        modelType: '',
        serialNumber: '',
        condition: 'good',
        description: '',
        notes: '',
    })
    const [imageData, setImageData] = useState(null)
    const imageInputRef = useRef(null)
    const [showValidationErrors, setShowValidationErrors] = useState(false)

    // Validation function for Add Monitor form
    const isAddMonitorFormValid = () => {
        return (
            formData.deviceName.trim() !== '' &&
            formData.qrCode.trim() !== '' &&
            formData.status.trim() !== '' &&
            formData.condition.trim() !== ''
        )
    }

    // Modal states
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [printQRModalOpen, setPrintQRModalOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [currentActionItem, setCurrentActionItem] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [linkedAssetsModalOpen, setLinkedAssetsModalOpen] = useState(false)
    const [linkedAssetsError, setLinkedAssetsError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type, duration }])
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const formatDateTime = (value) => {
        if (!value) return '—'
        const dt = new Date(value)
        if (Number.isNaN(dt.getTime())) return '—'
        return dt.toLocaleString()
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        const updated = { ...formData, [name]: value }

        // Generate QR code only once when device name is first entered
        if (name === 'deviceName') {
            if (value.trim() && !formData.qrCode) {
                // Only generate if QR is empty and device name is being entered
                const timestamp = Date.now().toString().slice(-4)
                const random = Math.floor(Math.random() * 900) + 100
                updated.qrCode = `MON-${timestamp}-${random}`
            } else if (!value.trim()) {
                // Clear QR code when device name is cleared
                updated.qrCode = ''
            }
        }

        setFormData(updated)
    }

    const handleRegenerateQR = () => {
        if (formData.deviceName.trim()) {
            const timestamp = Date.now().toString().slice(-4)
            const random = Math.floor(Math.random() * 900) + 100
            setFormData(prev => ({
                ...prev,
                qrCode: `MON-${timestamp}-${random}`
            }))
        }
    }

    const fileToDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => resolve(event.target?.result || null)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
        })
    }

    const validateImageRequirements = (file) => {
        const errors = []
        const maxSize = 5 * 1024 * 1024 // 5MB
        const minSize = 10 * 1024 // 10KB
        const allowedFormats = ['image/jpeg', 'image/png']

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File too large. Max size is 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        }
        if (file.size < minSize) {
            errors.push(`File too small. Min size is 10KB (current: ${(file.size / 1024).toFixed(2)}KB)`)
        }

        // Check file type
        if (!allowedFormats.includes(file.type)) {
            errors.push(`Invalid file format. Allowed: JPG, PNG (current: ${file.type || 'unknown'})`)
        }

        return errors
    }

    const validateImageDimensions = (img) => {
        return new Promise((resolve) => {
            const errors = []
            const minWidth = 400
            const minHeight = 300
            const maxWidth = 4000
            const maxHeight = 3000

            if (img.width < minWidth || img.height < minHeight) {
                errors.push(`Image too small. Min dimensions are 400×300px (current: ${img.width}×${img.height}px)`)
            }
            if (img.width > maxWidth || img.height > maxHeight) {
                errors.push(`Image too large. Max dimensions are 4000×3000px (current: ${img.width}×${img.height}px)`)
            }

            resolve(errors)
        })
    }

    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const fileErrors = validateImageRequirements(file)
        if (fileErrors.length > 0) {
            fileErrors.forEach(err => {
                addToast(err, 'error')
            })
            e.target.value = '' // Clear input
            return
        }

        try {
            const dataUrl = await fileToDataUrl(file)

            // Validate dimensions
            const img = new window.Image()
            img.onload = async () => {
                const dimensionErrors = await validateImageDimensions(img)
                if (dimensionErrors.length > 0) {
                    dimensionErrors.forEach(err => {
                        addToast(err, 'error')
                    })
                    e.target.value = ''
                    return
                }

                setImageData(dataUrl)
                addToast('Image uploaded successfully', 'success')
            }
            img.onerror = () => {
                const err = 'Failed to load image. Please try another file.'
                addToast(err, 'error')
                e.target.value = ''
            }
            img.src = dataUrl
        } catch {
            addToast('Failed to process image', 'error')
            e.target.value = ''
        }
    }

    useEffect(() => {
        const fetchMonitors = async () => {
            try {
                const { data } = await monitorApi.listMonitors()
                setMonitors(data)
            } catch (err) {
                addToast(err.response?.data?.message || err.message, 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchMonitors()
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-units-dropdown]') && unitsInputRef.current && !unitsInputRef.current.contains(e.target)) {
                setShowUnitsDropdown(false)
            }
        }

        if (showUnitsDropdown) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [showUnitsDropdown])

    useEffect(() => {
        if (unitsInputRef.current && showUnitsDropdown) {
            const rect = unitsInputRef.current.getBoundingClientRect()
            setInputPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            })
        }
    }, [showUnitsDropdown])

    const getStatusVariant = (status) => {
        const variants = {
            active: 'success',
            maintenance: 'warning',
            inactive: 'secondary',
            broken: 'destructive',
            repair: 'destructive',
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
        const idsToDelete = Array.from(selectedMonitors)

        // Check if any monitor has a linked unit BEFORE attempting deletion
        const monitorsWithLinks = pagedMonitors.filter(m => idsToDelete.includes(m.id) && m.linkedUnit)
        if (monitorsWithLinks.length > 0) {
            setLinkedAssetsError({
                count: monitorsWithLinks.length,
                message: `${monitorsWithLinks.length} monitor(s) are linked to system units. Please unlink them before deletion.`,
                item: { deviceName: 'Selected monitors' },
                assets: monitorsWithLinks.map(m => m.linkedUnit).filter(Boolean)
            })
            setLinkedAssetsModalOpen(true)
            return
        }

        setDeleting(true)
        try {
            await Promise.all(idsToDelete.map(id => monitorApi.deleteMonitor(id)))
            setMonitors(prev => prev.filter(m => !idsToDelete.includes(m.id)))
            setSelectedMonitors(new Set())
            setDeleteConfirmOpen(false)
            setDeleting(false)
            addToast(`${idsToDelete.length} monitor${idsToDelete.length > 1 ? 's' : ''} deleted successfully`, 'success')
            return
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete monitors'
            addToast(errorMsg, 'error')
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

        // Check if monitor has a linked unit BEFORE attempting deletion
        if (currentActionItem.linkedUnit) {
            setLinkedAssetsError({
                count: 1,
                message: `This monitor is linked to a system unit. Please unlink it before deletion.`,
                item: currentActionItem,
                assets: [currentActionItem.linkedUnit]
            })
            setLinkedAssetsModalOpen(true)
            return
        }

        setDeleting(true)
        try {
            const response = await monitorApi.deleteMonitor(currentActionItem.id)
            // Check if response indicates success
            if (response.status === 200 || response.data?.message?.includes('successfully')) {
                setMonitors(prev => prev.filter(m => m.id !== currentActionItem.id))
                setDeleteConfirmOpen(false)
                setCurrentActionItem(null)
                setDeleting(false)
                addToast('Monitor deleted successfully', 'success')
                return
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete monitor'
            if (err.response?.status === 400 && errorMsg.includes('linked unit')) {
                // Parse linked count from message
                const match = errorMsg.match(/(\d+)\s+linked/)
                const count = match ? parseInt(match[1]) : 0

                // Fetch all units to show linked ones
                try {
                    const { data: units } = await unitApi.listUnits()
                    const linkedUnits = units.filter(u => u.monitorIdsLinked && u.monitorIdsLinked.includes(currentActionItem.id))
                    setLinkedAssetsError({
                        count,
                        message: errorMsg,
                        item: currentActionItem,
                        assets: linkedUnits
                    })
                } catch {
                    setLinkedAssetsError({
                        count,
                        message: errorMsg,
                        item: currentActionItem,
                        assets: []
                    })
                }
                setLinkedAssetsModalOpen(true)
            } else {
                addToast(errorMsg, 'error')
            }
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
        const normalizedQuery = searchQuery.trim().toLowerCase()
        if (normalizedQuery === '') return matchesStatus

        const searchFields = [
            String(monitor.id || '').toLowerCase(),
            (monitor.deviceName || '').toLowerCase(),
            (monitor.qrCode || '').toLowerCase(),
            (monitor.modelType || '').toLowerCase(),
            (monitor.status || '').toLowerCase(),
            (monitor.description || '').toLowerCase(),
        ]
        const matchesSearch = searchFields.some(field => field.includes(normalizedQuery))

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
        {
            key: 'broken',
            label: 'Broken',
            count: monitors.filter((monitor) => monitor.status === 'broken').length,
        },
        {
            key: 'repair',
            label: 'Repair',
            count: monitors.filter((monitor) => monitor.status === 'repair').length,
        },
    ]

    const handleAddMonitor = async (e) => {
        e.preventDefault()

        // Validate required fields
        if (!isAddMonitorFormValid()) {
            setShowValidationErrors(true)
            addToast('Please fill all required fields: Device Name, QR Code, Status, and Condition', 'error')
            return
        }

        try {
            await monitorApi.createMonitor({
                deviceName: formData.deviceName,
                qrCode: formData.qrCode,
                status: formData.status || 'active',
                modelType: formData.modelType || null,
                serialNumber: formData.serialNumber || null,
                condition: formData.condition || 'good',
                description: formData.description || null,
                notes: formData.notes || null,
                linkedUnitId: formData.linkedUnit || null,
                imageData: imageData || null,
            })

            // Refresh monitors list
            const { data } = await monitorApi.listMonitors()
            setMonitors(data)
            setFormData({ deviceName: '', qrCode: '', status: 'active', linkedUnit: '', modelType: '', serialNumber: '', condition: 'good', description: '', notes: '' })
            setImageData(null)
            setUnitsSearchQuery('')
            setShowValidationErrors(false)
            dialogState.onOpenChange(false)
            addToast('Monitor added successfully', 'success')
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create monitor'
            addToast(message, 'error')
        }
    }

    const handleDialogOpenChange = async (open) => {
        dialogState.onOpenChange(open)
        if (open) {
            // Reset form when dialog opens
            setFormData({ deviceName: '', qrCode: '', status: 'active', linkedUnit: '', modelType: '', serialNumber: '', condition: 'good', description: '', notes: '' })
            setImageData(null)
            setUnitsSearchQuery('')
            // Fetch units when dialog opens
            try {
                const { data } = await unitApi.listUnits()
                setUnitsList(data)
            } catch {
                // Failed to fetch units
            }
        }
    }

    const filteredUnits = unitsList.filter(unit =>
        unitsSearchQuery === '' ||
        unit.deviceName.toLowerCase().includes(unitsSearchQuery.toLowerCase()) ||
        unit.qrCode.toLowerCase().includes(unitsSearchQuery.toLowerCase())
    )

    const handleRefreshMonitors = async () => {
        setRefreshing(true)
        try {
            const { data } = await monitorApi.listMonitors()
            setMonitors(data)
        } catch (err) {
            const message = err.response?.data?.message || err.message
            addToast(message, 'error')
        } finally {
            setRefreshing(false)
        }
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
            description: monitor.description || '',
            notes: monitor.notes || '',
            createdBy: monitor.createdBy || 'Unknown',
            createdAt: formatDateTime(monitor.createdAt),
            updatedAt: formatDateTime(monitor.updatedAt),
        }))

        const columns = [
            { key: 'deviceName', header: 'Device Name' },
            { key: 'qrCode', header: 'QR Code' },
            { key: 'modelType', header: 'Model Type' },
            { key: 'serialNumber', header: 'Serial Number' },
            { key: 'condition', header: 'Condition' },
            { key: 'status', header: 'Status' },
            { key: 'linkedUnit', header: 'Linked Unit' },
            { key: 'description', header: 'Description' },
            { key: 'notes', header: 'Notes' },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Created At' },
            { key: 'updatedAt', header: 'Last Updated' },
        ]

        const stamp = new Date().toISOString().slice(0, 10)
        const filename = `monitors-${stamp}.csv`

        try {
            setExporting(true)
            exportToCsv({
                filename,
                columns,
                rows,
            })
            exportDialogState.onOpenChange(false)
            addToast(`Export successful - ${count} rows exported`, 'success')
        } catch {
            addToast('Failed to export', 'error')
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
                        {viewOnly && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-500/50 text-blue-200 text-sm font-medium">
                                <Eye size={16} />
                                View-only mode
                            </div>
                        )}
                        {isTechnicianLimited && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 border border-amber-500/50 text-amber-200 text-sm font-medium">
                                <Pencil size={16} />
                                Technician Mode: {technicianOps.display}
                            </div>
                        )}
                        <Button
                            onClick={handleRefreshMonitors}
                            disabled={refreshing}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Dialog open={exportDialogState.open} onOpenChange={exportDialogState.onOpenChange}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <Download className="mr-2" size={18} />
                                    Export CSV
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Export Monitors to CSV</DialogTitle>
                                    <DialogDescription>
                                        Select how many rows to export
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="mt-4 space-y-4">
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
                                            Available rows: {filteredMonitors.length}. Leave empty to export all.
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

                        <Dialog open={dialogState.open} onOpenChange={handleDialogOpenChange}>
                            <DialogTrigger asChild>
                                <Button disabled={!canEdit || isTechnicianLimited}>
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
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        {/* LEFT COLUMN */}
                                        <div className="flex flex-col gap-4">
                                            {/* Device Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Device Name <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="deviceName"
                                                    placeholder="e.g., Monitor Display #1"
                                                    value={formData.deviceName}
                                                    onChange={handleInputChange}
                                                    className={showValidationErrors && !formData.deviceName.trim() ? 'border-red-500 border-2' : ''}
                                                    required
                                                />
                                            </div>

                                            {/* QR Code Section */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    QR Code <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-3">
                                                    {formData.qrCode && (
                                                        <div className={`flex-shrink-0 p-2 border rounded-lg ${showValidationErrors && !formData.qrCode.trim() ? 'border-red-500 border-2' : 'border-gray-700'}`} style={{ backgroundColor: '#0F0A19' }}>
                                                            <QRCode value={formData.qrCode} size={100} level="H" includeMargin={false} />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col flex-1 gap-2">
                                                        <Input
                                                            name="qrCode"
                                                            placeholder="e.g., QR-MON-001"
                                                            value={formData.qrCode}
                                                            onChange={handleInputChange}
                                                            className={`text-xs ${showValidationErrors && !formData.qrCode.trim() ? 'border-red-500 border-2' : ''}`}
                                                            required
                                                        />
                                                        {formData.deviceName.trim() && (
                                                            <button
                                                                type="button"
                                                                onClick={handleRegenerateQR}
                                                                className="flex items-center justify-center px-3 py-2 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors text-gray-300 hover:text-purple-400"
                                                                style={{ backgroundColor: '#0F0A19' }}
                                                                title="Regenerate QR Code"
                                                            >
                                                                <RefreshCw size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Model Type */}
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

                                            {/* Status */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Status <span className="text-red-500">*</span>
                                                </label>
                                                <Select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    className={showValidationErrors && !formData.status.trim() ? 'border-red-500 border-2' : ''}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="maintenance">Maintenance</option>
                                                    <option value="broken">Broken</option>
                                                    <option value="repair">Repair</option>
                                                </Select>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Description (Optional)
                                                </label>
                                                <Input
                                                    name="description"
                                                    placeholder="e.g., Primary display for monitoring center"
                                                    value={formData.description || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN */}
                                        <div className="flex flex-col gap-4">
                                            {/* Serial Number */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Serial Number
                                                </label>
                                                <Input
                                                    type="number"
                                                    name="serialNumber"
                                                    placeholder="e.g., 12345"
                                                    value={formData.serialNumber}
                                                    onChange={handleInputChange}
                                                    min="10000"
                                                    max="99999"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Exactly 5 digits required</p>
                                            </div>

                                            {/* Condition */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Condition <span className="text-red-500">*</span>
                                                </label>
                                                <Select
                                                    name="condition"
                                                    value={formData.condition}
                                                    onChange={handleInputChange}
                                                    className={showValidationErrors && !formData.condition.trim() ? 'border-red-500 border-2' : ''}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="good">Good</option>
                                                    <option value="fair">Fair</option>
                                                    <option value="poor">Poor</option>
                                                </Select>
                                            </div>

                                            {/* Linked System Unit */}
                                            <div data-units-dropdown>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Linked System Unit (Optional)
                                                </label>
                                                <Input
                                                    ref={unitsInputRef}
                                                    type="text"
                                                    placeholder="Search and select unit..."
                                                    value={unitsSearchQuery}
                                                    onChange={(e) => {
                                                        setUnitsSearchQuery(e.target.value)
                                                    }}
                                                    onFocus={() => setShowUnitsDropdown(true)}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setShowUnitsDropdown(true)
                                                    }}
                                                    className="w-full"
                                                />
                                                {showUnitsDropdown && (
                                                    <Portal>
                                                        <div
                                                            data-units-dropdown
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                position: 'fixed',
                                                                top: `${inputPosition.top + 8}px`,
                                                                left: `${inputPosition.left}px`,
                                                                width: `${inputPosition.width}px`,
                                                                zIndex: 99999
                                                            }}
                                                            className="bg-[#0F0A19] border border-gray-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto"
                                                        >
                                                            {filteredUnits.length > 0 ? (
                                                                filteredUnits.map((unit) => (
                                                                    <button
                                                                        key={unit.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, linkedUnit: unit.id }))
                                                                            setUnitsSearchQuery(`${unit.deviceName} (${unit.qrCode})`)
                                                                            setShowUnitsDropdown(false)
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-left hover:bg-gray-600 transition-colors text-gray-100 text-xs  last:border-b-0"
                                                                    >
                                                                        <div className="font-medium text-gray-100 text-sm">{unit.deviceName}</div>
                                                                        <div className="text-xs text-gray-400">{unit.qrCode}</div>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="px-3 py-1.5 text-gray-500 text-xs">No units found</div>
                                                            )}
                                                        </div>
                                                    </Portal>
                                                )}
                                            </div>

                                            {/* Image */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="block text-sm font-medium text-gray-300">
                                                        Image
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
                                                <div className="flex flex-col gap-2">
                                                    {imageData ? (
                                                        <div className="relative w-full h-40 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                                                            <img
                                                                src={imageData}
                                                                alt="Monitor preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setImageData(null)}
                                                                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => imageInputRef.current?.click()}
                                                            className="w-full h-28 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-900/50 hover:bg-gray-900 gap-2"
                                                        >
                                                            <Upload size={20} className="text-gray-400" />
                                                            <div className="text-xs text-gray-300">Click to upload</div>
                                                            <div className="text-xs text-gray-500">Max 5MB</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        ref={imageInputRef}
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        onChange={handleImageFileChange}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div>
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
                                    </div>

                                    <DialogFooter className="pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => dialogState.onOpenChange(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={!isAddMonitorFormValid()}
                                            className={!isAddMonitorFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
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

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Last Updated</div>
                                    <div className="text-xs text-gray-200">{formatDateTime(selectedMonitor?.updatedAt)}</div>
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
                    onNotify={addToast}
                    onSaved={(updatedMonitor) => {
                        setMonitors((prev) =>
                            prev.map((monitor) =>
                                monitor.id === updatedMonitor.id
                                    ? { ...monitor, ...updatedMonitor }
                                    : monitor,
                            ),
                        )
                        // Also update selectedMonitor to show refreshed data
                        setSelectedMonitor((prev) =>
                            prev?.id === updatedMonitor.id ? { ...prev, ...updatedMonitor } : prev
                        )
                        addToast('Monitor updated successfully', 'success')
                    }}
                />

                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2 items-center">
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
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto lg:max-w-sm items-center">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={selectedMonitors.size === 0 || isTechnicianLimited}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash size={16} className="mr-2" />
                            Delete {selectedMonitors.size > 0 && `(${selectedMonitors.size})`}
                        </Button>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ID, device, model, QR code..."
                        />
                    </div>
                </div>

                <Card className="relative">
                    {refreshing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw size={32} className="animate-spin text-purple-400" />
                                <p className="text-white font-medium">Refreshing monitors...</p>
                            </div>
                        </div>
                    )}
                    <div className="max-h-[600px] overflow-y-auto">
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
                                    <TableHead>ID</TableHead>
                                    <TableHead>Device</TableHead>
                                    <TableHead>QR Code</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Linked Unit</TableHead>
                                    <TableHead>Last Updated</TableHead>
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
                                            <TableCell className="max-w-[200px]">
                                                <code
                                                    title={monitor.id}
                                                    className="inline-block text-xs bg-gray-900 text-white px-3 py-2 rounded font-mono max-w-[180px] truncate"
                                                >
                                                    {`INSTOCK-${String(monitor.id).padStart(4, '0')}`}
                                                </code>
                                            </TableCell>
                                            <TableCell className="cursor-pointer max-w-[260px]">
                                                <div className="truncate">
                                                    <div className="text-sm font-medium text-white truncate">
                                                        {monitor.deviceName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate hidden sm:block">
                                                        {monitor.createdBy || 'Unknown'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="inline-block text-xs bg-gray-900 text-white px-3 py-2 rounded font-mono">
                                                    {monitor.qrCode}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {monitor.modelType || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(monitor.status)}>
                                                    {capitalize(monitor.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-300 max-w-[180px] truncate">
                                                {monitor.linkedUnit?.deviceName || '—'}
                                            </TableCell>
                                            <TableCell className="text-gray-400 text-sm">
                                                {monitor.updatedAt ? new Date(monitor.updatedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—'}
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
                                                        {canEdit && (
                                                            <DropdownItem
                                                                icon={Pencil}
                                                                label="Edit"
                                                                onClick={() => openEdit(monitor)}
                                                            />
                                                        )}
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
                                                        {canEdit && !isTechnicianLimited && (
                                                            <DropdownItem
                                                                icon={Trash2}
                                                                label="Delete"
                                                                onClick={() => handleDeleteClick(monitor)}
                                                                className="text-red-400 hover:text-red-200"
                                                            />
                                                        )}
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="9" className="text-center py-12">
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
                    </div>
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

            <LinkedAssetsModal
                isOpen={linkedAssetsModalOpen}
                onClose={() => setLinkedAssetsModalOpen(false)}
                item={linkedAssetsError?.item}
                linkedCount={linkedAssetsError?.count}
                linkedAssets={linkedAssetsError?.assets}
                itemType="monitor"
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    )
}

export default Monitors
