import { Activity, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'

function ActivityLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await activityApi.listLogs(200)
                setLogs(data)
                setError(null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    const filteredLogs = filter
        ? logs.filter((log) =>
            log.action.toLowerCase().includes(filter.toLowerCase()) ||
            log.assetQrCode.toLowerCase().includes(filter.toLowerCase()),
        )
        : logs

    const getActionVariant = (action) => {
        const variants = {
            move: 'info',
            update: 'warning',
            repair: 'warning',
            swap: 'secondary',
        }
        return variants[action] || 'secondary'
    }

    return (
        <div className="content-full bg-[#171717]">
            <div className="content-centered">
                <div className="py-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                        <Activity className="text-gray-300" size={36} />
                        Activity Logs
                    </h1>
                    <p className="text-gray-400">
                        Search and filter all asset movements and changes
                    </p>
                </div>

                <div className="mb-4 rounded-xl border border-[#303030] bg-[#151515] p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                        <Input
                            placeholder="Search by action or asset QR code..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-[#303030] bg-[#151515] overflow-hidden mb-8">
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="inline-block animate-spin">
                                <Activity className="text-gray-300" size={24} />
                            </div>
                            <p className="text-gray-400 mt-2">Loading logs...</p>
                        </div>
                    ) : error ? (
                        <div className="m-6 rounded-lg border border-red-500/30 bg-red-600/20 p-6 text-red-300">
                            ⚠️ Error: {error}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Old Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-gray-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionVariant(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-900 text-white px-2 py-1 rounded font-mono">
                                                {log.assetQrCode?.slice(0, 16)}
                                                {log.assetQrCode?.length > 16 && '...'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-xs max-w-xs truncate">
                                            {log.oldStatus || log.oldLocation ? log.oldStatus || log.oldLocation : '—'}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-xs max-w-xs truncate">
                                            {log.newStatus || log.newLocation ? log.newStatus || log.newLocation : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-12 text-center">
                            <Activity className="text-gray-600 mx-auto mb-3" size={40} />
                            <p className="text-gray-400">
                                {filter ? 'No logs found matching your search' : 'No activity logs yet'}
                            </p>
                        </div>
                    )}
                </div>

                {filteredLogs.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-400">
                                Showing {filteredLogs.length} of {logs.length} logs
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default ActivityLogs
