import {
    Activity,
    AlertCircle,
    BarChart3,
    CheckCircle,
    PieChart as PieChartIcon,
    TrendingUp,
    Zap,
    RefreshCw,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { activityApi, assetApi } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { isViewOnly } from '../lib/permissions'
import { ChangeDetailsModal } from '../components/ActionModals'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'

const STATUS_ORDER = ['active', 'repair', 'broken', 'inactive', 'maintenance']
const STATUS_LABELS = {
    active: 'Active',
    repair: 'Repair',
    broken: 'Broken',
    inactive: 'Inactive',
    maintenance: 'Maintenance',
}

const CHART_COLORS = {
    lavender300: '#ddd6fe',
    lavender400: '#c4b5fd',
    lavender500: '#a78bfa',
    lavender600: '#9333ea',
    lavender700: '#7e22ce',
    dark800: '#171717',
    dark600: '#2d2d2d',
    // Status-specific colors
    statusActive: '#10b981',     // Green - working/operational
    statusRepair: '#f59e0b',     // Orange - needs attention
    statusBroken: '#ef4444',     // Red - not working
    statusInactive: '#6b7280',   // Gray - not in use
    statusMaintenance: '#8b5cf6',      // Purple - under maintenance
}

function toDateKeyLocal(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatShortDateLabel(date) {
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: '2-digit',
    }).format(date)
}

function Dashboard() {
    const viewOnly = isViewOnly()
    const [assets, setAssets] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const [refreshing, setRefreshing] = useState(false)
    const [selectedChangeLog, setSelectedChangeLog] = useState(null)
    const [changeDetailsOpen, setChangeDetailsOpen] = useState(false)

    // Auto-refresh every 30 seconds for real-time activity monitoring
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetResponse, logResponse] = await Promise.all([
                    assetApi.listAssets(),
                    activityApi.listLogs(250),
                ])

                setAssets(assetResponse.data)
                setLogs(logResponse.data)
                setError(null)
                setLastUpdated(new Date())
            } catch (err) {
                setError(err.response?.data?.message || err.message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        // Initial fetch
        fetchData()

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(fetchData, 30000)

        return () => clearInterval(intervalId)
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            const [assetResponse, logResponse] = await Promise.all([
                assetApi.listAssets(),
                activityApi.listLogs(250),
            ])

            setAssets(assetResponse.data)
            setLogs(logResponse.data)
            setError(null)
            setLastUpdated(new Date())
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setRefreshing(false)
        }
    }

    const formatLastUpdated = () => {
        const now = new Date()
        const diff = now - lastUpdated
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        if (seconds < 60) return 'Just Now'
        else if (minutes < 60) return `${minutes}M Ago`
        else if (hours < 24) return `${hours}H Ago`
        else return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const LOG_PAGE_SIZE = 10 // Show 10 items per page for better overview
    const [logPage, setLogPage] = useState(0)

    const filteredLogs = useMemo(() => {
        if (!logs || logs.length === 0) return []

        // Filter to show only activities from the last 24 hours
        const now = new Date()
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        return logs.filter(log => {
            const logTime = new Date(log.timestamp)
            return logTime >= twentyFourHoursAgo
        })
    }, [logs])

    useEffect(() => {
        setLogPage(0)
    }, [filteredLogs])

    const totalAssets = assets.length
    const activeAssets = assets.filter((asset) => asset.status === 'active').length
    const brokenAssets = assets.filter((asset) =>
        ['broken', 'repair'].includes(asset.status),
    ).length

    const totalLogPages = useMemo(() => {
        const pages = Math.ceil((filteredLogs?.length || 0) / LOG_PAGE_SIZE)
        return pages > 0 ? pages : 1
    }, [filteredLogs])

    const pagedLogs = useMemo(() => {
        const start = logPage * LOG_PAGE_SIZE
        return filteredLogs.slice(start, start + LOG_PAGE_SIZE)
    }, [filteredLogs, logPage])

    const statusChartData = useMemo(() => {
        const counts = assets.reduce((acc, asset) => {
            const key = asset?.status || 'other'
            acc[key] = (acc[key] || 0) + 1
            return acc
        }, {})

        return STATUS_ORDER.map((status) => ({
            name: STATUS_LABELS[status] ?? status,
            value: counts[status] || 0,
            status,
        }))
    }, [assets])

    const topLocationsData = useMemo(() => {
        const byLocation = new Map()
        for (const asset of assets) {
            const location = asset?.location?.trim() || 'Unassigned'
            if (!byLocation.has(location)) {
                byLocation.set(location, 0)
            }
            byLocation.set(location, byLocation.get(location) + 1)
        }

        return Array.from(byLocation.entries())
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }, [assets])

    const activityOverTimeData = useMemo(() => {
        const fallbackDays = 14
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const end = today
        const start = new Date(end)
        start.setDate(start.getDate() - (fallbackDays - 1))

        const msPerDay = 24 * 60 * 60 * 1000
        const spanDays = Math.max(1, Math.floor((end - start) / msPerDay) + 1)
        const days = Math.min(spanDays, 31)
        const cappedStart = new Date(end)
        cappedStart.setDate(end.getDate() - (days - 1))

        const counts = new Map()
        for (const log of logs) {
            if (!log?.timestamp) continue
            const ts = new Date(log.timestamp)
            if (Number.isNaN(ts.getTime())) continue

            const tsLocal = new Date(ts)
            tsLocal.setHours(0, 0, 0, 0)

            if (tsLocal < cappedStart || tsLocal > end) continue
            const key = toDateKeyLocal(tsLocal)
            counts.set(key, (counts.get(key) || 0) + 1)
        }

        const series = []
        for (let i = 0; i < days; i += 1) {
            const d = new Date(cappedStart)
            d.setDate(cappedStart.getDate() + i)
            const key = toDateKeyLocal(d)
            series.push({
                key,
                label: formatShortDateLabel(d),
                count: counts.get(key) || 0,
            })
        }

        return series
    }, [logs])

    const stats = [
        {
            label: 'Total Assets',
            value: String(totalAssets),
            info: 'All tagged items in inventory',
            iconClassName: 'text-gray-200',
            icon: Zap,
            bg: 'bg-white/5',
            card: 'bg-gradient-to-r from-lavender-600/30 to-lavender-500/10',
        },
        {
            label: 'Active',
            value: String(activeAssets),
            info: 'Ready for use / deployed',
            iconClassName: 'text-green-400',
            icon: CheckCircle,
            bg: 'bg-white/5',
            card: 'bg-gradient-to-r from-lavender-500/25 to-lavender-700/10',
        },
        {
            label: 'Broken/Repair',
            value: String(brokenAssets),
            info: 'Needs attention or repair',
            iconClassName: 'text-red-400',
            icon: AlertCircle,
            bg: 'bg-white/5',
            card: 'bg-gradient-to-r from-lavender-700/20 to-lavender-600/10',
        },
    ]

    if (loading) {
        return <FullPageLoader title="Loading dashboard..." />
    }

    return (
        <div className="content-full">
            <div className="content-centered py-8">
                {/* Page Title + Stats on same line */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:gap-8">
                    {/* Title */}
                    <div className="flex-shrink-0">
                        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                        <p className="mt-1 text-lg text-gray-400">Overview and recent system activity</p>
                        <div className="mt-1 flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                                title="Refresh data"
                            >
                                <RefreshCw
                                    size={18}
                                    className={`text-gray-400 hover:text-gray-200 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                                />
                            </button>
                            <span className="text-sm text-gray-500">
                                Last updated: {formatLastUpdated()}
                            </span>
                        </div>
                    </div>

                    {/* 3 Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        {stats.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <Card
                                    key={stat.label}
                                    className={`border border-border-dark hover:border-lavender-600 transition-colors ${stat.card}`}
                                >
                                    <CardHeader className="pb-3 pt-4 px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                                                    {stat.label}
                                                </p>
                                                <p className="text-3xl font-bold text-white mb-1">
                                                    {stat.value}
                                                </p>
                                                <p className="text-xs text-gray-300/80">
                                                    {stat.info}
                                                </p>
                                            </div>
                                            <div className={`${stat.bg} p-3 rounded-lg flex-shrink-0`}>
                                                <Icon
                                                    className={stat.iconClassName}
                                                    size={20}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                {/* Charts + Recent Activity in one grid */}
                <div className={`grid gap-5 mb-8 items-stretch ${viewOnly
                    ? 'grid-cols-1 lg:grid-cols-2'
                    : 'grid-cols-1 lg:grid-cols-3 lg:[grid-template-rows:auto_auto]'
                    }`}>
                    {!viewOnly && (
                        <Card className="lg:col-span-2 lg:row-start-1 flex flex-col min-h-[318px]">
                            <CardHeader className="pb-3 pt-4 px-5">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                                        <TrendingUp size={18} className="text-lavender-400" />
                                        Activity
                                    </CardTitle>
                                    <p className="mt-1 text-sm text-gray-300/80">
                                        Activity logs over the last 14 days
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 flex-1 min-h-0">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        Loading chart…
                                    </div>
                                ) : error ? (
                                    <div className="h-full flex items-center justify-center text-red-400 text-sm">
                                        Warning: {error}
                                    </div>
                                ) : (
                                    <div className="h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={activityOverTimeData} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={CHART_COLORS.lavender500} stopOpacity={0.35} />
                                                        <stop offset="70%" stopColor={CHART_COLORS.lavender500} stopOpacity={0.08} />
                                                        <stop offset="100%" stopColor={CHART_COLORS.lavender500} stopOpacity={0} />
                                                    </linearGradient>
                                                    <filter id="activityGlow" x="-30%" y="-30%" width="160%" height="160%">
                                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <CartesianGrid
                                                    stroke={CHART_COLORS.dark600}
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="label"
                                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                    axisLine={{ stroke: CHART_COLORS.dark600 }}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                    axisLine={{ stroke: CHART_COLORS.dark600 }}
                                                    tickLine={false}
                                                    allowDecimals={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: CHART_COLORS.dark800,
                                                        border: `1px solid ${CHART_COLORS.dark600}`,
                                                        borderRadius: 6,
                                                    }}
                                                    itemStyle={{ color: '#e5e7eb' }}
                                                    labelStyle={{ color: '#9ca3af' }}
                                                    cursor={{
                                                        stroke: CHART_COLORS.lavender500,
                                                        strokeWidth: 1,
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    name="Activity"
                                                    stroke={CHART_COLORS.lavender500}
                                                    strokeWidth={2.8}
                                                    fill="url(#activityFill)"
                                                    dot={false}
                                                    isAnimationActive={true}
                                                    filter="url(#activityGlow)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card className={`h-full flex flex-col min-h-[318px] ${!viewOnly ? 'lg:col-start-3 lg:row-start-1' : ''
                        }`}>
                        <CardHeader className="pb-3 pt-4 px-5">
                            <div>
                                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                                    <PieChartIcon size={18} className="text-lavender-400" />
                                    Status
                                </CardTitle>
                                <p className="mt-1 text-sm text-gray-300/80">
                                    Asset status distribution
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 flex-1 min-h-0">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Loading…
                                </div>
                            ) : error ? (
                                <div className="h-full flex items-center justify-center text-red-400 text-sm">
                                    Error
                                </div>
                            ) : statusChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    No data
                                </div>
                            ) : (
                                <div className="h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                contentStyle={{
                                                    background: CHART_COLORS.dark800,
                                                    border: `1px solid ${CHART_COLORS.dark600}`,
                                                    borderRadius: 6,
                                                }}
                                                itemStyle={{ color: '#e5e7eb' }}
                                                labelStyle={{ color: '#9ca3af' }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: 11,
                                                    color: '#9ca3af',
                                                    paddingTop: '6px',
                                                }}
                                            />
                                            <Pie
                                                data={statusChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={40}
                                                outerRadius={62}
                                                paddingAngle={1.5}
                                                stroke={CHART_COLORS.dark800}
                                            >
                                                {statusChartData.map((entry) => {
                                                    const colorByStatus = {
                                                        active: CHART_COLORS.statusActive,
                                                        repair: CHART_COLORS.statusRepair,
                                                        broken: CHART_COLORS.statusBroken,
                                                        inactive: CHART_COLORS.statusInactive,
                                                        maintenance: CHART_COLORS.statusMaintenance,
                                                    }
                                                    return (
                                                        <Cell
                                                            key={entry.status}
                                                            fill={
                                                                colorByStatus[entry.status] ||
                                                                CHART_COLORS.statusMaintenance
                                                            }
                                                        />
                                                    )
                                                })}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity - aligned with Location (same row) */}
                    {!viewOnly && (
                        <Card className="lg:col-span-2 lg:row-start-2 flex flex-col max-h-[500px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-5 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Activity className="text-lavender-400" size={18} />
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-white">Recent Activity</CardTitle>
                                        <p className="mt-1 text-xs text-gray-400">Latest logs and updates</p>
                                    </div>
                                </div>
                                <Badge className="bg-lavender-600 text-white text-xs">Live</Badge>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                                {loading ? (
                                    <div className="py-12 text-center">
                                        <div className="inline-block animate-spin">
                                            <Zap className="text-gray-400" size={24} />
                                        </div>
                                        <p className="text-gray-400 mt-3 text-sm">Loading activity…</p>
                                    </div>
                                ) : error ? (
                                    <p className="py-6 text-red-400 text-sm px-5">⚠️ {error}</p>
                                ) : filteredLogs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-400">Name</TableHead>
                                                    <TableHead className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-400">Timestamp</TableHead>
                                                    <TableHead className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-400">Action</TableHead>
                                                    <TableHead className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-400">Item</TableHead>
                                                    <TableHead className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-400">Details</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pagedLogs.map((log) => {
                                                    // Determine item display and type
                                                    let itemDisplay = '—'
                                                    if (log.assetQrCode) {
                                                        itemDisplay = `Asset: ${log.assetQrCode?.slice(0, 10) || 'N/A'}`
                                                    } else if (log.monitor) {
                                                        itemDisplay = `Mon: ${log.monitor.qr_code || 'N/A'}`
                                                    } else if (log.unit) {
                                                        itemDisplay = `Unit: ${log.unit.qr_code || 'N/A'}`
                                                    }

                                                    // Preference order: description > old/new status/location
                                                    let detailsDisplay = '—'
                                                    if (log.description) {
                                                        detailsDisplay = log.description
                                                    } else if (log.oldStatus && log.newStatus) {
                                                        detailsDisplay = `${log.oldStatus} → ${log.newStatus}`
                                                    } else if (log.oldLocation && log.newLocation) {
                                                        detailsDisplay = `${log.oldLocation} → ${log.newLocation}`
                                                    }

                                                    return (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="px-5 py-3 text-xs text-gray-300">
                                                                {log.userName || '—'}
                                                            </TableCell>
                                                            <TableCell className="px-5 py-3 text-xs text-gray-400">
                                                                {new Date(log.timestamp).toLocaleTimeString(undefined, {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit',
                                                                })}
                                                            </TableCell>
                                                            <TableCell className="px-5 py-3">
                                                                <Badge className="bg-lavender-600/20 text-lavender-300 text-xs border border-lavender-600/40">
                                                                    {log.action}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-5 py-3">
                                                                <code className="text-xs bg-dark-700 text-lavender-300 px-2.5 py-1 rounded border border-border-dark font-mono">
                                                                    {itemDisplay}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell className="px-5 py-3 text-gray-400 text-xs">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="truncate max-w-xs" title={detailsDisplay}>
                                                                        {detailsDisplay.length > 50 ? `${detailsDisplay.substring(0, 50)}...` : detailsDisplay}
                                                                    </span>
                                                                    {(log.description && (log.description.includes(';') || log.description.length > 50)) && (
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
                                    <p className="py-12 text-center text-gray-500 text-sm">
                                        No activity in the last 24 hours
                                    </p>
                                )}
                            </CardContent>
                            {filteredLogs.length > LOG_PAGE_SIZE ? (
                                <div className="flex justify-end px-5 py-4 border-t border-[#3d2e5c] bg-[#1a1530] flex-shrink-0">
                                    <TablePagination
                                        align="right"
                                        currentPage={logPage + 1}
                                        totalPages={totalLogPages}
                                        onPageChange={(page) => setLogPage(page - 1)}
                                    />
                                </div>
                            ) : null}
                            {filteredLogs.length > 0 && (
                                <div className="text-xs text-gray-400 px-5 py-2 border-t border-[#3d2e5c] text-center bg-[#1a1530] flex-shrink-0">
                                    Showing last 24 hours • Auto-refresh every 30s
                                </div>
                            )}
                        </Card>
                    )}

                    <Card className={`h-full flex flex-col min-h-[320px] ${!viewOnly ? 'lg:col-start-3 lg:row-start-2' : ''
                        }`}>
                        <CardHeader className="pb-3 pt-4 px-5">
                            <div>
                                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                                    <BarChart3 size={18} className="text-lavender-400" />
                                    Top Locations
                                </CardTitle>
                                <p className="mt-1 text-sm text-gray-300/80">
                                    Top 5 locations by asset count
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 flex-1 min-h-0">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Loading…
                                </div>
                            ) : error ? (
                                <div className="h-full flex items-center justify-center text-red-400 text-sm">
                                    Error: {error}
                                </div>
                            ) : topLocationsData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    No locations
                                </div>
                            ) : (
                                <div className="h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topLocationsData}
                                            margin={{ top: 10, right: 14, left: -18, bottom: 30 }}
                                        >
                                            <CartesianGrid
                                                stroke={CHART_COLORS.dark600}
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="location"
                                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                axisLine={{ stroke: CHART_COLORS.dark600 }}
                                                tickLine={false}
                                                angle={-25}
                                                textAnchor="end"
                                                height={55}
                                            />
                                            <YAxis
                                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: CHART_COLORS.dark800,
                                                    border: `1px solid ${CHART_COLORS.dark600}`,
                                                    borderRadius: 6,
                                                }}
                                                itemStyle={{ color: '#e5e7eb' }}
                                                labelStyle={{ color: '#9ca3af' }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                name="Assets"
                                                fill={CHART_COLORS.lavender500}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ChangeDetailsModal
                isOpen={changeDetailsOpen}
                onClose={() => setChangeDetailsOpen(false)}
                log={selectedChangeLog}
            />
        </div>
    )
}

export default Dashboard
