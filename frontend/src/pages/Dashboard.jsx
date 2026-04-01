import { Activity, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityApi } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'

function Dashboard() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await activityApi.listLogs(15)
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

    const stats = [
        {
            label: 'Total Assets',
            value: '0',
            color: 'white',
            icon: Zap,
            bg: 'bg-gray-900',
        },
        {
            label: 'Active',
            value: '0',
            color: 'green',
            icon: CheckCircle,
            bg: 'bg-gray-900',
        },
        {
            label: 'Broken/Repair',
            value: '0',
            color: 'red',
            icon: AlertCircle,
            bg: 'bg-gray-900',
        },
    ]

    return (
        <div className="content-full bg-[#171717]">
            <div className="content-centered">
                {/* Header */}
                <div className="py-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Real-time inventory monitoring & system status
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label}>
                                <CardHeader>
                                    <CardTitle className="flex items-start justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                {stat.label}
                                            </p>
                                            <p className="text-4xl font-bold text-white mb-2">
                                                {stat.value}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Last 24 hours
                                            </p>
                                        </div>
                                        <div className={`${stat.bg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                                            <Icon
                                                className={`text-${stat.color}-400`}
                                                size={24}
                                            />
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>

                {/* Recent Activity */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Activity className="text-gray-300" size={24} />
                                <span>Recent Activity</span>
                            </div>
                            <Badge>Live</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center">
                                <div className="inline-block animate-spin">
                                    <Zap className="text-gray-400" size={24} />
                                </div>
                                <p className="text-gray-400 mt-2">Loading...</p>
                            </div>
                        ) : error ? (
                            <p className="py-4 text-red-400 bg-red-600/20 rounded-lg px-4">
                                ⚠️ {error}
                            </p>
                        ) : logs.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Asset</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-gray-400">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{log.action}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-gray-900 text-white px-2 py-1 rounded">
                                                    {log.assetQrCode?.slice(0, 12)}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-gray-400 text-xs">
                                                {log.oldStatus && log.newStatus
                                                    ? `${log.oldStatus} → ${log.newStatus}`
                                                    : log.oldLocation &&
                                                        log.newLocation
                                                        ? `Moved to ${log.newLocation}`
                                                        : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="py-8 text-center text-gray-500">
                                No activity logs yet. Start tracking assets!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard
