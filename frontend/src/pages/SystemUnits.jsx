import { Plus, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { unitApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

function SystemUnits() {
    const dialogState = useDialog()
    const [units, setUnits] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [formData, setFormData] = useState({
        deviceName: '',
        qrCode: '',
        status: 'active',
        location: '',
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const { data } = await unitApi.listUnits()
                setUnits(data)
                setError(null)
            } catch (err) {
                setError(err.response?.data?.message || err.message)
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
        }

        return variants[status] || 'outline'
    }

    const filteredUnits = units.filter((unit) => {
        const matchesStatus =
            statusFilter === 'all' || unit.status === statusFilter
        const haystack = [unit.deviceName, unit.qrCode, unit.location, unit.createdBy]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        const matchesSearch = haystack.includes(searchQuery.toLowerCase())

        return matchesStatus && matchesSearch
    })

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
    ]

    const handleAddUnit = (e) => {
        e.preventDefault()
        // TODO: Call API to create unit
        console.log('Adding unit:', formData)
        setFormData({ deviceName: '', qrCode: '', status: 'active', location: '' })
        dialogState.onOpenChange(false)
    }

    return (
        <div className="content-full bg-[#171717]">
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

                    <Dialog open={dialogState.open} onOpenChange={dialogState.onOpenChange}>
                        <DialogTrigger asChild>
                            <Button>
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

                            <form onSubmit={handleAddUnit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Device Name
                                    </label>
                                    <Input
                                        name="deviceName"
                                        placeholder="e.g., Monitor Unit #1"
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
                                        placeholder="e.g., QR-2024-001"
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
                                        Location
                                    </label>
                                    <Input
                                        name="location"
                                        placeholder="e.g., Building A, Floor 3"
                                        value={formData.location}
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
                                        Add Unit
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
                            placeholder="Search units by name, QR, or location"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-[#3d2e5c] bg-[#0f0a1a] overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">
                            Loading units...
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
                                    <TableHead>Location</TableHead>
                                    <TableHead>Linked Monitors</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUnits.length > 0 ? (
                                    filteredUnits.map((unit) => (
                                        <TableRow key={unit.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {unit.deviceName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Created by {unit.createdBy || 'Unknown'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="inline-flex rounded-md bg-[#111827] px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                                                    {unit.qrCode}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(unit.status)}>
                                                    {unit.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{unit.location || '—'}</TableCell>
                                            <TableCell className="text-gray-400">
                                                {unit.monitorCount} linked monitor{unit.monitorCount === 1 ? '' : 's'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center py-12">
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
                    )}
                </div>
            </div>
        </div>
    )
}

export default SystemUnits
