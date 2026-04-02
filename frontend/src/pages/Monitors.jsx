import { Plus, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'
import { monitorApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

function Monitors() {
    const dialogState = useDialog()
    const [monitors, setMonitors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [formData, setFormData] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        linkedUnit: '',
    })

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

    return (
        <div className="content-full bg-[#171717]">
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

                            <form onSubmit={handleAddMonitor} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Linked System Unit (Optional)
                                    </label>
                                    <Input
                                        name="linkedUnit"
                                        placeholder="e.g., Unit #1"
                                        value={formData.linkedUnit}
                                        onChange={handleInputChange}
                                    />
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

                    <div className="w-full lg:max-w-sm">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search monitors by name, QR, or linked unit"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">
                            Loading monitors...
                        </div>
                    ) : error ? (
                        <div className="m-6 rounded-lg border border-red-500/30 bg-red-600/20 p-4 text-red-300">
                            Warning: {error}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Device</TableHead>
                                    <TableHead>QR Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Linked Unit</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMonitors.length > 0 ? (
                                    filteredMonitors.map((monitor) => (
                                        <TableRow key={monitor.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {monitor.deviceName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Created by {monitor.createdBy || 'Unknown'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="inline-flex rounded-md bg-[#2d1f4a] px-2.5 py-1 text-xs font-semibold text-lavender-300 ring-1 ring-lavender-600/20">
                                                    {monitor.qrCode}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(monitor.status)}>
                                                    {monitor.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {monitor.linkedUnit?.deviceName || '—'}
                                            </TableCell>
                                            <TableCell className="text-gray-400">
                                                {monitor.description || 'No description'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center py-12">
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
                    )}
                </div>
            </div>
        </div>
    )
}

export default Monitors
