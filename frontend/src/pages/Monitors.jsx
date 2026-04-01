import { Plus, Monitor } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

function Monitors() {
    const dialogState = useDialog()
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
                <div className="py-8 flex items-center justify-between">
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

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="text-gray-300" size={24} />
                            All Monitors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Device</TableHead>
                                    <TableHead>QR Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Linked Unit</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
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
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Monitors
