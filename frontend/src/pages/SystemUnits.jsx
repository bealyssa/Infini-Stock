import { Download, Image, MoreHorizontal, Pencil, Plus, Package, Trash2, Activity, Trash, Printer, RefreshCw, Upload, Info, Eye } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import { unitApi, monitorApi } from '../api'
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
import { ToastContainer } from '../components/ui/Toast'

function SystemUnits() {
    const canEdit = canEditData()
    const viewOnly = isViewOnly()
    const isTechnicianLimited = isTechnicianLimitedOps()
    const technicianOps = getTechnicianOperations()
    const dialogState = useDialog()
    const exportDialogState = useDialog()
    const detailsDialogState = useDialog()
    const editDialogState = useDialog()
    const [units, setUnits] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [conditionFilter, setConditionFilter] = useState('all')
    const [exportRows, setExportRows] = useState('50')
    const [exporting, setExporting] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState(null)
    const [editingUnit, setEditingUnit] = useState(null)
    const [selectedUnits, setSelectedUnits] = useState(new Set())
    const [formData, setFormData] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        location: '',
        modelType: '',
        serialNumber: '',
        condition: 'good',
        description: '',
        notes: '',
    })

    const imageInputRef = useRef(null)
    const [imageData, setImageData] = useState(null)
    const [showValidationErrors, setShowValidationErrors] = useState(false)

    // Validation function for Add Unit form
    const isAddUnitFormValid = () => {
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
    const [linkedMonitorsViewOpen, setLinkedMonitorsViewOpen] = useState(false)
    const [linkedMonitorsData, setLinkedMonitorsData] = useState([])
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

    // Helper to group monitors by their linked unit
    const groupMonitorsByUnit = (monitors) => {
        const grouped = {}
        monitors.forEach(monitor => {
            const unitId = monitor.linkedUnit?.id
            if (!grouped[unitId]) {
                const linkedUnit = units.find(u => u.id === unitId)
                grouped[unitId] = {
                    unitId,
                    unitName: linkedUnit?.deviceName || 'Unknown Unit',
                    serialNumber: linkedUnit?.serialNumber,
                    monitors: []
                }
            }
            grouped[unitId].monitors.push(monitor)
        })
        return Object.values(grouped)
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

    const handleRegenerateQR = () => {
        if (formData.deviceName.trim()) {
            const timestamp = Date.now().toString().slice(-4)
            const random = Math.floor(Math.random() * 900) + 100
            setFormData(prev => ({
                ...prev,
                qrCode: `UNIT-${timestamp}-${random}`
            }))
        }
    }

    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file requirements
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

    const handleInputChange = (e) => {
        const { name, value } = e.target
        const updated = { ...formData, [name]: value }

        // Auto-generate QR code when device name is entered
        if (name === 'deviceName' && value.trim()) {
            const timestamp = Date.now().toString().slice(-4)
            const random = Math.floor(Math.random() * 900) + 100
            updated.qrCode = `UNIT-${timestamp}-${random}`
        }

        setFormData(updated)
    }

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const { data } = await unitApi.listUnits()

                // Fetch monitors to count linked monitors for each unit
                try {
                    const { data: monitors } = await monitorApi.listMonitors()
                    // Add monitorCount to each unit
                    const unitsWithCounts = data.map(unit => ({
                        ...unit,
                        monitorCount: monitors.filter(m => m.linkedUnit && m.linkedUnit.id === unit.id).length
                    }))
                    setUnits(unitsWithCounts)
                } catch {
                    // If monitor fetch fails, just set units without counts
                    setUnits(data.map(unit => ({ ...unit, monitorCount: 0 })))
                }
            } catch (err) {
                addToast(err.response?.data?.message || err.message, 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchUnits()
    }, [])

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

    const toggleUnitSelection = (unitId) => {
        const newSelected = new Set(selectedUnits)
        if (newSelected.has(unitId)) {
            newSelected.delete(unitId)
        } else {
            newSelected.add(unitId)
        }
        setSelectedUnits(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedUnits.size === pagedUnits.length) {
            setSelectedUnits(new Set())
        } else {
            setSelectedUnits(new Set(pagedUnits.map(u => u.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedUnits.size === 0) return
        setCurrentActionItem(null)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteUnits = async () => {
        const idsToDelete = Array.from(selectedUnits)

        // Check if any unit has linked monitors BEFORE attempting deletion
        const unitsWithLinks = units.filter(u => idsToDelete.includes(u.id) && u.monitorCount > 0)
        if (unitsWithLinks.length > 0) {
            const totalLinked = unitsWithLinks.reduce((sum, u) => sum + u.monitorCount, 0)
            try {
                const { data: monitors } = await monitorApi.listMonitors()
                const linkedMonitors = monitors.filter(m => m.linkedUnit && idsToDelete.includes(m.linkedUnit.id))
                const groupedByUnit = groupMonitorsByUnit(linkedMonitors)
                setLinkedAssetsError({
                    count: totalLinked,
                    message: `${unitsWithLinks.length} unit(s) have ${totalLinked} linked monitor(s). Please unlink them before deletion.`,
                    item: { deviceName: 'Selected units' },
                    assets: groupedByUnit
                })
            } catch {
                setLinkedAssetsError({
                    count: totalLinked,
                    message: `${unitsWithLinks.length} unit(s) have ${totalLinked} linked monitor(s). Please unlink them before deletion.`,
                    item: { deviceName: 'Selected units' },
                    assets: []
                })
            }
            setLinkedAssetsModalOpen(true)
            return
        }

        setDeleting(true)
        try {
            await Promise.all(idsToDelete.map(id => unitApi.deleteUnit(id)))
            setUnits(prev => prev.filter(u => !idsToDelete.includes(u.id)))
            setSelectedUnits(new Set())
            setDeleteConfirmOpen(false)
            setDeleting(false)
            addToast(`${idsToDelete.length} unit${idsToDelete.length > 1 ? 's' : ''} deleted successfully`, 'success')
            return
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete units'
            // Check if it's a linked assets error
            if (err.response?.status === 400 && errorMsg.includes('linked monitor')) {
                // Parse linked count from message
                const match = errorMsg.match(/(\d+)\s+linked/)
                const count = match ? parseInt(match[1]) : 0

                // Fetch all monitors to show linked ones
                try {
                    const { data: monitors } = await monitorApi.listMonitors()
                    const linkedMonitors = monitors.filter(m => m.linkedUnit && idsToDelete.includes(m.linkedUnit.id))
                    const groupedByUnit = groupMonitorsByUnit(linkedMonitors)
                    setLinkedAssetsError({
                        count,
                        message: errorMsg,
                        item: { deviceName: 'Selected units' },
                        assets: groupedByUnit
                    })
                } catch {
                    setLinkedAssetsError({
                        count,
                        message: errorMsg,
                        item: { deviceName: 'Selected units' },
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

    const handleHistoryClick = (unit) => {
        setCurrentActionItem(unit)
        setHistoryModalOpen(true)
    }

    const handlePrintQRClick = (unit) => {
        setCurrentActionItem(unit)
        setPrintQRModalOpen(true)
    }

    const handleDeleteClick = (unit) => {
        setCurrentActionItem(unit)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteSingleUnit = async () => {
        if (!currentActionItem) return

        // Check if unit has linked monitors BEFORE attempting deletion
        if (currentActionItem.monitorCount && currentActionItem.monitorCount > 0) {
            // Fetch monitors to show which ones are linked
            try {
                const { data: monitors } = await monitorApi.listMonitors()
                const linkedMonitors = monitors.filter(m => m.linkedUnit && m.linkedUnit.id === currentActionItem.id)
                const groupedByUnit = groupMonitorsByUnit(linkedMonitors)
                setLinkedAssetsError({
                    count: currentActionItem.monitorCount,
                    message: `This unit has ${currentActionItem.monitorCount} linked monitor(s). Please unlink them before deletion.`,
                    item: currentActionItem,
                    assets: groupedByUnit
                })
            } catch {
                setLinkedAssetsError({
                    count: currentActionItem.monitorCount,
                    message: `This unit has ${currentActionItem.monitorCount} linked monitor(s). Please unlink them before deletion.`,
                    item: currentActionItem,
                    assets: []
                })
            }
            setLinkedAssetsModalOpen(true)
            return
        }

        setDeleting(true)
        try {
            const response = await unitApi.deleteUnit(currentActionItem.id)
            // Check if response indicates success
            if (response.status === 200 || response.data?.message?.includes('successfully')) {
                setUnits(prev => prev.filter(u => u.id !== currentActionItem.id))
                setDeleteConfirmOpen(false)
                setCurrentActionItem(null)
                setDeleting(false)
                addToast('Unit deleted successfully', 'success')
                return
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete unit'

            // Check if it's a linked assets error (400 status)
            if (err.response?.status === 400 && errorMsg.includes('linked monitor')) {
                // Parse linked count from message
                const match = errorMsg.match(/(\d+)\s+linked/)
                const count = match ? parseInt(match[1]) : 0

                // Fetch all monitors to show linked ones
                try {
                    const { data: monitors } = await monitorApi.listMonitors()
                    const linkedMonitors = monitors.filter(m => m.linkedUnit && m.linkedUnit.id === currentActionItem.id)
                    const groupedByUnit = groupMonitorsByUnit(linkedMonitors)
                    setLinkedAssetsError({
                        count,
                        message: errorMsg,
                        item: currentActionItem,
                        assets: groupedByUnit
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
            await confirmDeleteSingleUnit()
        } else {
            await confirmDeleteUnits()
        }
    }

    const filteredUnits = units.filter((unit) => {
        const matchesStatus =
            statusFilter === 'all' || unit.status === statusFilter
        const matchesCondition =
            conditionFilter === 'all' || unit.condition === conditionFilter
        const haystack = [unit.deviceName, unit.qrCode, unit.location, unit.createdBy]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        const matchesSearch = haystack.includes(searchQuery.toLowerCase())

        return matchesStatus && matchesCondition && matchesSearch
    })

    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, conditionFilter, units.length])

    const totalPages = Math.max(1, Math.ceil(filteredUnits.length / ITEMS_PER_PAGE))
    const pagedUnits = filteredUnits.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const filterPills = [
        { key: 'all', label: 'All', count: units.length },
        {
            key: 'active',
            label: 'Active',
            count: units.filter((unit) => unit.status === 'active').length,
        },
        {
            key: 'maintenance',
            label: 'Maintenance',
            count: units.filter((unit) => unit.status === 'maintenance').length,
        },
        {
            key: 'inactive',
            label: 'Inactive',
            count: units.filter((unit) => unit.status === 'inactive').length,
        },
        {
            key: 'broken',
            label: 'Broken',
            count: units.filter((unit) => unit.status === 'broken').length,
        },
        {
            key: 'repair',
            label: 'Repair',
            count: units.filter((unit) => unit.status === 'repair').length,
        },
    ]

    const handleRefreshUnits = async () => {
        setRefreshing(true)
        try {
            const { data } = await unitApi.listUnits()
            setUnits(data)
        } catch (err) {
            const message = err.response?.data?.message || err.message
            addToast(message, 'error')
        } finally {
            setRefreshing(false)
        }
    }

    const handleAddUnit = async (e) => {
        e.preventDefault()

        // Validate required fields
        if (!isAddUnitFormValid()) {
            setShowValidationErrors(true)
            addToast('Please fill all required fields: Device Name, QR Code, Status, and Condition', 'error')
            return
        }

        try {
            await unitApi.createUnit({
                deviceName: formData.deviceName,
                qrCode: formData.qrCode,
                status: formData.status || 'active',
                location: formData.location || '',
                modelType: formData.modelType || '',
                serialNumber: formData.serialNumber || '',
                condition: formData.condition || 'good',
                description: formData.description || '',
                notes: formData.notes || '',
                imageData: imageData || null,
            })
            // Refresh units list
            const { data } = await unitApi.listUnits()
            setUnits(data)
            setFormData({ deviceName: '', qrCode: '', status: 'active', location: '', modelType: '', serialNumber: '', condition: 'good', description: '', notes: '' })
            setImageData(null)
            setShowValidationErrors(false)
            dialogState.onOpenChange(false)
            addToast('Unit added successfully', 'success')
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create unit'
            addToast(message, 'error')
        }
    }

    const handleExport = async () => {
        const max = filteredUnits.length
        const count = clampRowCount(exportRows, max)
        const rows = filteredUnits.slice(0, count).map((unit) => ({
            deviceName: unit.deviceName,
            qrCode: unit.qrCode,
            modelType: unit.modelType || 'N/A',
            serialNumber: unit.serialNumber || 'N/A',
            condition: capitalize(unit.condition || 'unknown'),
            status: capitalize(unit.status),
            location: unit.location || '—',
            linkedMonitors:
                unit.monitorCount === 1
                    ? '1 linked monitor'
                    : `${unit.monitorCount} linked monitors`,
            notes: unit.notes || '',
            createdBy: unit.createdBy || 'Unknown',
            createdAt: formatDateTime(unit.createdAt),
            updatedAt: formatDateTime(unit.updatedAt),
        }))

        const columns = [
            { key: 'deviceName', header: 'Device Name' },
            { key: 'qrCode', header: 'QR Code' },
            { key: 'modelType', header: 'Model Type' },
            { key: 'serialNumber', header: 'Serial Number' },
            { key: 'condition', header: 'Condition' },
            { key: 'status', header: 'Status' },
            { key: 'location', header: 'Location' },
            { key: 'linkedMonitors', header: 'Linked Monitors' },
            { key: 'notes', header: 'Notes' },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Created At' },
            { key: 'updatedAt', header: 'Last Updated' },
        ]

        const stamp = new Date().toISOString().slice(0, 10)
        const filename = `system-units-${stamp}.csv`

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

    const openDetails = (unit) => {
        setSelectedUnit(unit)
        detailsDialogState.onOpenChange(true)
    }

    const openEdit = (unit) => {
        setEditingUnit(unit)
        editDialogState.onOpenChange(true)
    }

    const viewLinkedMonitors = async (unit) => {
        if (!unit || !unit.monitorCount || unit.monitorCount === 0) {
            addToast('No linked monitors', 'info')
            return
        }

        try {
            const { data: monitors } = await monitorApi.listMonitors()
            const linked = monitors.filter(m => m.linkedUnit && m.linkedUnit.id === unit.id)
            setLinkedMonitorsData(linked)
            setLinkedMonitorsViewOpen(true)
        } catch {
            addToast('Failed to load linked monitors', 'error')
        }
    }

    if (loading) {
        return <FullPageLoader title="Loading units..." />
    }

    return (
        <div className="content-full">
            <div className="content-centered">
                <div className="py-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            System Units
                        </h1>
                        <p className="text-gray-400">
                            Manage and track all system units in inventory
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
                            onClick={handleRefreshUnits}
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
                                    <DialogTitle>Export System Units to CSV</DialogTitle>
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
                                            max={Math.max(filteredUnits.length, 1)}
                                            value={exportRows}
                                            onChange={(e) => setExportRows(e.target.value)}
                                            disabled={exporting}
                                            placeholder="e.g., 50"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Available rows: {filteredUnits.length}. Leave empty to export all.
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
                                            disabled={exporting || filteredUnits.length === 0}
                                        >
                                            {exporting ? 'Exporting…' : 'Export'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={dialogState.open} onOpenChange={dialogState.onOpenChange}>
                            <DialogTrigger asChild>
                                <Button disabled={!canEdit || isTechnicianLimited}>
                                    <Plus className="mr-2" size={20} />
                                    Add Unit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New System Unit</DialogTitle>
                                    <DialogDescription>
                                        Enter the details for the new system unit
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleAddUnit}>
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
                                                    placeholder="e.g., System Unit #1"
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
                                                            placeholder="e.g., QR-2024-001"
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
                                                    placeholder="e.g., Dell OptiPlex 7090"
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

                                            {/* Location */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Location
                                                </label>
                                                <Input
                                                    name="location"
                                                    placeholder="e.g., Building A, Floor 3"
                                                    value={formData.location}
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
                                                    name="serialNumber"
                                                    placeholder="e.g., DELL-OP7090-001"
                                                    value={formData.serialNumber}
                                                    onChange={handleInputChange}
                                                />
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
                                                                alt="Unit preview"
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
                                                    placeholder="e.g., Recently upgraded GPU, running smoothly"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Description (Optional)
                                                </label>
                                                <Input
                                                    name="description"
                                                    placeholder="e.g., Primary workstation for design team"
                                                    value={formData.description || ''}
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
                                            disabled={!isAddUnitFormValid()}
                                            className={!isAddUnitFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
                                            <Plus className="mr-2" size={16} />
                                            Add Unit
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

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
                        <div className="rounded-full border border-[#3d2e5c] bg-[#16162E]">
                            <Select
                                value={conditionFilter}
                                onChange={(e) => setConditionFilter(e.target.value)}
                                className="text-sm py-1.5 rounded-full text-lavender-300"
                            >
                                <option value="all">All Conditions</option>
                                <option value="new">New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto lg:max-w-sm items-center">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={selectedUnits.size === 0 || isTechnicianLimited}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash size={16} className="mr-2" />
                            Delete {selectedUnits.size > 0 && `(${selectedUnits.size})`}
                        </Button>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search units by name, QR, or location"
                        />
                    </div>
                </div>

                <Dialog
                    open={detailsDialogState.open}
                    onOpenChange={(open) => {
                        detailsDialogState.onOpenChange(open)
                        if (!open) setSelectedUnit(null)
                    }}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedUnit?.deviceName || 'System Unit Details'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedUnit?.qrCode
                                    ? `QR: ${selectedUnit.qrCode}`
                                    : 'View system unit information'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 mt-4">
                            {/* Left: Image/QR */}
                            <div className="flex flex-col gap-3">
                                <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                    {selectedUnit?.imageData || selectedUnit?.imageUrl ? (
                                        <img
                                            src={selectedUnit.imageData || selectedUnit.imageUrl}
                                            alt={selectedUnit.deviceName || 'System unit'}
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

                                {selectedUnit?.qrCode && (
                                    <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">QR Code</div>
                                        <code className="block border border-[#3d2e5c] bg-[#0f0a1a] text-white px-2 py-2 rounded-md font-mono text-xs text-center">
                                            {selectedUnit.qrCode}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {/* Right: Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-wrap items-center gap-1 col-span-2">
                                    {selectedUnit?.status ? (
                                        <Badge variant={getStatusVariant(selectedUnit.status)}>
                                            {capitalize(selectedUnit.status)}
                                        </Badge>
                                    ) : null}
                                    {selectedUnit?.condition ? (
                                        <Badge variant={selectedUnit?.condition === 'poor' ? 'secondary' : selectedUnit?.condition === 'fair' ? 'warning' : 'success'}>
                                            {capitalize(selectedUnit.condition)}
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Model Type</div>
                                    <div className="text-sm text-gray-200">{selectedUnit?.modelType || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Serial Number</div>
                                    <div className="text-xs text-gray-200 font-mono truncate">{selectedUnit?.serialNumber || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Created By</div>
                                    <div className="text-sm text-gray-200">{selectedUnit?.createdBy || 'Unknown'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Created At</div>
                                    <div className="text-xs text-gray-200">{formatDateTime(selectedUnit?.createdAt)}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Last Updated</div>
                                    <div className="text-xs text-gray-200">{formatDateTime(selectedUnit?.updatedAt)}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Location</div>
                                    <div className="text-sm text-gray-200">{selectedUnit?.location || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500">Linked Monitors</div>
                                        <div className="text-sm text-gray-200">
                                            {typeof selectedUnit?.monitorCount === 'number'
                                                ? `${selectedUnit.monitorCount} linked monitor${selectedUnit.monitorCount === 1 ? '' : 's'}`
                                                : '—'}
                                        </div>
                                    </div>
                                    {selectedUnit?.monitorCount && selectedUnit.monitorCount > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => viewLinkedMonitors(selectedUnit)}
                                            className="text-xs"
                                        >
                                            View More
                                        </Button>
                                    )}
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Description</div>
                                    <div className="text-sm text-gray-200">{selectedUnit?.description || '—'}</div>
                                </div>

                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 col-span-2">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Notes</div>
                                    <div className="text-sm text-gray-200">{selectedUnit?.notes || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCurrentActionItem(selectedUnit)
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

                {/* Linked Monitors View Modal */}
                <Dialog open={linkedMonitorsViewOpen} onOpenChange={setLinkedMonitorsViewOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Linked Monitors - {selectedUnit?.deviceName}</DialogTitle>
                            <DialogDescription>
                                Showing {linkedMonitorsData.length} linked monitor{linkedMonitorsData.length !== 1 ? 's' : ''}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="border-b border-[#3d2e5c] bg-[#2a1f3d]">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Monitor Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">QR Code</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300">Model</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedMonitorsData.map((monitor) => (
                                        <tr key={monitor.id} className="border-b border-[#3d2e5c] hover:bg-[#0f0a1a]/50">
                                            <td className="px-3 py-2 text-white font-medium">{monitor.deviceName || '—'}</td>
                                            <td className="px-3 py-2 text-gray-400 text-xs font-mono">{monitor.qrCode || '—'}</td>
                                            <td className="px-3 py-2">
                                                {monitor.status && (
                                                    <Badge variant={getStatusVariant(monitor.status)}>
                                                        {capitalize(monitor.status)}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-400">{monitor.modelType || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {linkedMonitorsData.length === 0 && (
                            <div className="py-8 text-center text-gray-400">
                                No linked monitors found
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setLinkedMonitorsViewOpen(false)}
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
                        if (!open) setEditingUnit(null)
                    }}
                    type="unit"
                    device={editingUnit}
                    onNotify={addToast}
                    onSaved={(updatedUnit) => {
                        setUnits((prev) =>
                            prev.map((unit) =>
                                unit.id === updatedUnit.id ? { ...unit, ...updatedUnit } : unit,
                            ),
                        )
                        // Also update selectedUnit to show refreshed data with updatedAt
                        setSelectedUnit((prev) =>
                            prev?.id === updatedUnit.id ? { ...prev, ...updatedUnit } : prev
                        )
                        addToast('Unit updated successfully', 'success')
                    }}
                />

                <Card className="relative">
                    {refreshing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw size={32} className="animate-spin text-purple-400" />
                                <p className="text-white font-medium">Refreshing units...</p>
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
                                            checked={selectedUnits.size === pagedUnits.length && pagedUnits.length > 0}
                                            onChange={toggleSelectAll}
                                            className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                        />
                                    </TableHead>
                                    <TableHead>Device</TableHead>
                                    <TableHead>QR Code</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Linked Monitors</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedUnits.length > 0 ? (
                                    pagedUnits.map((unit) => (
                                        <TableRow key={unit.id}
                                            onClick={() => openDetails(unit)}
                                            className="hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUnits.has(unit.id)}
                                                    onChange={() => toggleUnitSelection(unit.id)}
                                                    className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                                />
                                            </TableCell>
                                            <TableCell className="cursor-pointer max-w-[260px]">
                                                <div className="truncate">
                                                    <div className="text-sm font-medium text-white truncate">
                                                        {unit.deviceName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate hidden sm:block">
                                                        {unit.createdBy || 'Unknown'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="inline-block text-xs bg-gray-900 text-white px-3 py-2 rounded font-mono">
                                                    {unit.qrCode}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {unit.modelType || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(unit.status)}>
                                                    {capitalize(unit.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={unit.condition === 'poor' ? 'secondary' : unit.condition === 'fair' ? 'warning' : 'success'}>
                                                    {capitalize(unit.condition || 'unknown')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-300 max-w-[180px] truncate">
                                                {unit.location || '—'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {unit.monitorCount && unit.monitorCount > 0 ? (
                                                    <Badge variant="success">
                                                        {unit.monitorCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-400 text-sm">
                                                {unit.updatedAt ? new Date(unit.updatedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={(e) => { e.stopPropagation(); canEdit && openEdit(unit) }}
                                                        disabled={!canEdit}
                                                        title={canEdit ? `Edit ${unit.deviceName}` : 'View-only mode'}
                                                        aria-label={`Edit ${unit.deviceName}`}
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
                                                                aria-label={`More options for ${unit.deviceName}`}
                                                            >
                                                                <MoreHorizontal size={18} />
                                                            </Button>
                                                        }
                                                    >
                                                        <DropdownItem
                                                            icon={Activity}
                                                            label="View History"
                                                            onClick={() => handleHistoryClick(unit)}
                                                        />
                                                        <DropdownItem
                                                            icon={Download}
                                                            label="Print QR"
                                                            onClick={() => handlePrintQRClick(unit)}
                                                        />
                                                        {canEdit && !isTechnicianLimited && (
                                                            <DropdownItem
                                                                icon={Trash2}
                                                                label="Delete"
                                                                onClick={() => handleDeleteClick(unit)}
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
                                                <Package className="text-gray-600 mb-3" size={40} />
                                                <p className="text-gray-400">
                                                    No units found
                                                </p>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Add your first system unit to get started
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
                itemType="unit"
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
                itemCount={currentActionItem ? 1 : selectedUnits.size}
                itemType="unit"
                isDeleting={deleting}
            />

            <LinkedAssetsModal
                isOpen={linkedAssetsModalOpen}
                onClose={() => {
                    setLinkedAssetsModalOpen(false)
                    setDeleteConfirmOpen(false)
                }}
                item={linkedAssetsError?.item}
                linkedCount={linkedAssetsError?.count}
                linkedAssets={linkedAssetsError?.assets}
                itemType="unit"
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    )
}

export default SystemUnits
