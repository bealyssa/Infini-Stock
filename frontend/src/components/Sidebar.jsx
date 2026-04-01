import { BarChart3, Package, Monitor, QrCode, Activity, Users, Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
    const [open, setOpen] = useState(true)
    const location = useLocation()

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: BarChart3 },
        { path: '/units', label: 'System Units', icon: Package },
        { path: '/monitors', label: 'Monitors', icon: Monitor },
        { path: '/qr-generator', label: 'QR Generator', icon: QrCode },
        { path: '/logs', label: 'Activity Logs', icon: Activity },
        { path: '/admin/users', label: 'Manage Users', icon: Users },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
            >
                {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside
                className={`fixed left-0 top-0 h-screen w-64 bg-[#171717] border-r border-[#404040] text-gray-100 transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-gray-400" size={28} />
                        <h1 className="text-2xl font-bold text-white">
                            Infini-Stock
                        </h1>
                    </div>
                    <p className="text-sm text-gray-400">
                        IoT Inventory System
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map(({ path, label, icon: Icon }) => (
                        <Link
                            key={path}
                            to={path}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(path)
                                    ? 'bg-gray-800 text-white border-l-2 border-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className="lg:ml-64" />
        </>
    )
}

export default Sidebar
