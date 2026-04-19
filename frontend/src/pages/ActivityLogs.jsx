import { Activity, Search, RefreshCw } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
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
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [appliedStartDate, setAppliedStartDate] = useState('')
    const [appliedEndDate, setAppliedEndDate] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedChangeLog, setSelectedChangeLog] = useState(null)
    const [changeDetailsOpen, setChangeDetailsOpen] = useState(false)
    const itemsPerPage = 10
    const startDateRef = useRef(null)
    const endDateRef = useRef(null)

    const fetchLogs = async () => {
        try {
            setRefreshing(true)
            const { data } = await activityApi.listLogs(200)
            setLogs(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = async () => {
        await fetchLogs()
    }

    const handleApplyDateRange = () => {
        setAppliedStartDate(startDate)
        setAppliedEndDate(endDate)
        setCurrentPage(1)
    }

    const handleClearDateRange = () => {
        setStartDate('')
        setEndDate('')
        setAppliedStartDate('')
        setAppliedEndDate('')
        setCurrentPage(1)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const normalizedFilter = (filter || '').toLowerCase()
    const filteredLogs = logs.filter((log) => {
        // Text search filter
        let matchesText = true
        if (filter) {
            const actionMatch = (log.action || '').toLowerCase().includes(normalizedFilter)
            const assetMatch = (log.assetQrCode || '').toLowerCase().includes(normalizedFilter)
            const monitorMatch = (log.monitor?.qr_code || '').toLowerCase().includes(normalizedFilter)
            const unitMatch = (log.unit?.qr_code || '').toLowerCase().includes(normalizedFilter)
            const descriptionMatch = (log.description || '').toLowerCase().includes(normalizedFilter)
            const nameMatch = isAdmin
                ? (log.userName || '').toLowerCase().includes(normalizedFilter)
                : false
            matchesText = actionMatch || assetMatch || monitorMatch || unitMatch || descriptionMatch || nameMatch
        }

        // Date range filter (use applied dates, not input dates)
        let matchesDateRange = true
        if (appliedStartDate || appliedEndDate) {
            const logDate = new Date(log.timestamp)
            if (appliedStartDate) {
                const start = new Date(appliedStartDate)
                start.setHours(0, 0, 0, 0)
                matchesDateRange = matchesDateRange && logDate >= start
            }
            if (appliedEndDate) {
                const end = new Date(appliedEndDate)
                end.setHours(23, 59, 59, 999)
                matchesDateRange = matchesDateRange && logDate <= end
            }
        }

        return matchesText && matchesDateRange
    })

    // Sort by newest first (by timestamp descending)
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        const dateA = new Date(a.timestamp)
        const dateB = new Date(b.timestamp)
        return dateB - dateA // Descending order (newest first)
    })

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filter, appliedStartDate, appliedEndDate])

    const paginatedLogs = sortedLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    )
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

    const getActionVariant = (action) => {
        const variants = {
            created: 'success',
            deleted: 'destructive',
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
                <div className="pt-8 flex justify-between items-start">
                    <div>
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
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                <div className="mb-6 flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by action, QR code, or change details..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full"
                            icon={<Search size={18} />}
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">From Date</label>
                        <input
                            ref={startDateRef}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onClick={(e) => {
                                e.currentTarget.showPicker?.()
                            }}
                            className="w-full px-3 py-2 bg-purple-900/40 border border-lavender-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500/30 transition-colors cursor-pointer hover:border-lavender-500/50"
                            style={{ accentColor: '#a855f7' }}
                        />
                        <style>{`
                            input[type="date"]::-webkit-calendar-picker-indicator {
                                filter: invert(0.8) hue-rotate(270deg);
                                cursor: pointer;
                            }
                        `}</style>
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">To Date</label>
                        <input
                            ref={endDateRef}
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onClick={(e) => {
                                e.currentTarget.showPicker?.()
                            }}
                            className="w-full px-3 py-2 bg-purple-900/40 border border-lavender-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-500/30 transition-colors cursor-pointer hover:border-lavender-500/50"
                            style={{ accentColor: '#a855f7' }}
                        />
                        <style>{`
                            input[type="date"]::-webkit-calendar-picker-indicator {
                                filter: invert(0.8) hue-rotate(270deg);
                                cursor: pointer;
                            }
                        `}</style>
                    </div>
                    <Button
                        onClick={handleClearDateRange}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        Clear
                    </Button>
                    <Button
                        onClick={handleApplyDateRange}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        Apply
                    </Button>
                </div>

                <Card className="overflow-hidden mb-5 relative">
                    {refreshing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw size={32} className="animate-spin text-purple-400" />
                                <p className="text-white font-medium">Refreshing logs...</p>
                            </div>
                        </div>
                    )}
                    {error ? (
                        <div className="m-6 rounded-lg border border-red-500/30 bg-red-600/20 p-6 text-red-300">
                            ⚠️ Error: {error}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="max-h-[600px] overflow-y-auto">
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
                                        // Prefer stored denormalized item info so history shows even after deletion
                                        if (log.itemQr) {
                                            itemDisplay = `${log.itemQr?.slice(0, 12) || 'N/A'}`
                                        } else if (log.itemName) {
                                            itemDisplay = log.itemName
                                        } else if (log.deletedItemQr) {
                                            // Fallback to deleted-specific fields for old data
                                            itemDisplay = `${log.deletedItemQr?.slice(0, 12) || 'N/A'}`
                                        } else if (log.deletedItemName) {
                                            itemDisplay = log.deletedItemName
                                        } else if (log.assetQrCode) {
                                            itemDisplay = `Asset: ${log.assetQrCode?.slice(0, 12) || 'N/A'}`
                                        } else if (log.monitor) {
                                            itemDisplay = `Mon: ${log.monitor.qr_code?.slice(0, 12) || 'N/A'}`
                                        } else if (log.unit) {
                                            itemDisplay = `Unit: ${log.unit.qr_code?.slice(0, 12) || 'N/A'}`
                                        }

                                        // Get changes description - prefer detailed description field
                                        let changesDisplay = '—'
                                        let changeCount = 0

                                        if (log.description) {
                                            try {
                                                const parsed = JSON.parse(log.description)
                                                if (parsed.changes && Array.isArray(parsed.changes)) {
                                                    changeCount = parsed.changes.length
                                                    // Build a summary of fields changed
                                                    const fields = parsed.changes.map(c => c.field).join(', ')
                                                    changesDisplay = `${changeCount} field${changeCount !== 1 ? 's' : ''} changed: ${fields}`
                                                }
                                            } catch (e) {
                                                // Not JSON format, use as-is
                                                changesDisplay = log.description
                                            }
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
                                                        {log.description && (
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
                        </div>
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
                        <div className='mb-5'>
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
