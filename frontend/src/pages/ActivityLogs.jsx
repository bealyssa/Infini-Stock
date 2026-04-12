import { Activity, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activityApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { capitalize } from '../lib/utils'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'
import { ChangeDetailsModal } from '../components/ActionModals'

function ActivityLogs() {
    const currentUser = (() => {
        try {
            const raw = localStorage.getItem('user')
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    })()
    const isAdmin = currentUser?.role === 'admin'

    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedChangeLog, setSelectedChangeLog] = useState(null)
    const [changeDetailsOpen, setChangeDetailsOpen] = useState(false)
    const itemsPerPage = 10

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

    const normalizedFilter = (filter || '').toLowerCase()
    const filteredLogs = filter
        ? logs.filter((log) => {
            const actionMatch = (log.action || '').toLowerCase().includes(normalizedFilter)
            const assetMatch = (log.assetQrCode || '').toLowerCase().includes(normalizedFilter)
            const monitorMatch = (log.monitor?.qr_code || '').toLowerCase().includes(normalizedFilter)
            const unitMatch = (log.unit?.qr_code || '').toLowerCase().includes(normalizedFilter)
            const descriptionMatch = (log.description || '').toLowerCase().includes(normalizedFilter)
            const nameMatch = isAdmin
                ? (log.userName || '').toLowerCase().includes(normalizedFilter)
                : false
            return actionMatch || assetMatch || monitorMatch || unitMatch || descriptionMatch || nameMatch
        })
        : logs

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filter])

    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    )
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

    const getActionVariant = (action) => {
        const variants = {
            move: 'info',
            update: 'warning',
            repair: 'warning',
            swap: 'secondary',
        }
        return variants[action] || 'secondary'
    }

    const getInitials = (value) => {
        const text = (value || '').trim()
        if (!text) return '—'
        const parts = text.split(/\s+/).filter(Boolean)
        const first = parts[0]?.[0] || ''
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
        const initials = `${first}${last}`.toUpperCase()
        return initials || text.slice(0, 2).toUpperCase()
    }

    if (loading) {
        return <FullPageLoader title="Loading logs..." />
    }

    return (
        <div className="content-full">
            <div className="content-centered">
                <div className="py-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                        <Activity className="text-gray-300" size={36} />
                        Activity Logs
                    </h1>
                    <p className="text-gray-400">
                        {isAdmin
                            ? 'Search and filter all asset movements and changes'
                            : 'Search and filter your asset movements and changes'}
                    </p>
                </div>

                <div className="mb-6">
                    <Input
                        placeholder="Search by action, QR code, or change details..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full"
                        icon={<Search size={18} />}
                    />
                </div>

                <Card className="overflow-hidden mb-5">
                    {error ? (
                        <div className="m-6 rounded-lg border border-red-500/30 bg-red-600/20 p-6 text-red-300">
                            ⚠️ Error: {error}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map((log) => {
                                    // Determine item display and type
                                    let itemDisplay = '—'
                                    if (log.assetQrCode) {
                                        itemDisplay = `Asset: ${log.assetQrCode?.slice(0, 12) || 'N/A'}`
                                    } else if (log.monitor) {
                                        itemDisplay = `Mon: ${log.monitor.qr_code?.slice(0, 12) || 'N/A'}`
                                    } else if (log.unit) {
                                        itemDisplay = `Unit: ${log.unit.qr_code?.slice(0, 12) || 'N/A'}`
                                    }

                                    // Get changes description - prefer detailed description field
                                    let changesDisplay = '—'
                                    if (log.description) {
                                        changesDisplay = log.description
                                    } else if (log.oldStatus && log.newStatus) {
                                        changesDisplay = `Status: ${log.oldStatus} → ${log.newStatus}`
                                    } else if (log.oldLocation && log.newLocation) {
                                        changesDisplay = `Location: ${log.oldLocation} → ${log.newLocation}`
                                    }

                                    return (
                                        <TableRow key={log.id}
                                            className="cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="text-sm text-white truncate">{log.userName || '—'}</div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-300">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getActionVariant(log.action)}>
                                                    {capitalize(log.action)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-gray-900 text-lavender-300 px-2 py-1 rounded font-mono">
                                                    {itemDisplay}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-gray-300 text-xs max-w-2xl">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate max-w-sm" title={changesDisplay}>
                                                        {changesDisplay.length > 60 ? `${changesDisplay.substring(0, 60)}...` : changesDisplay}
                                                    </span>
                                                    {log.description && (log.description.includes(';') || log.description.length > 50) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-lavender-400 hover:text-lavender-300 text-xs px-2 py-0.5 h-auto whitespace-nowrap"
                                                            onClick={() => {
                                                                setSelectedChangeLog(log)
                                                                setChangeDetailsOpen(true)
                                                            }}
                                                        >
                                                            View More →
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
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
                </Card>

                {filteredLogs.length > 0 && (
                    <div>
                        <div>
                            <TablePagination
                                align="end"
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}
            </div>

            <ChangeDetailsModal
                isOpen={changeDetailsOpen}
                onClose={() => setChangeDetailsOpen(false)}
                log={selectedChangeLog}
            />
        </div>
    )
}

export default ActivityLogs
