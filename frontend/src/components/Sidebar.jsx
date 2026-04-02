import { BarChart3, Package, Monitor, QrCode, Activity, Users, Menu, X, Zap, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function Sidebar() {
    const [open, setOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: BarChart3 },
        { path: '/units', label: 'System Units', icon: Package },
        { path: '/monitors', label: 'Monitors', icon: Monitor },
        { path: '/qr-generator', label: 'QR Generator', icon: QrCode },
        { path: '/logs', label: 'Activity Logs', icon: Activity },
        { path: '/admin/users', label: 'Manage Users', icon: Users },
    ]

    const isActive = (path) => location.pathname === path

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth-change'))
        navigate('/login')
    }

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#2d2d2d] text-lavender-400 hover:bg-[#3d3d3d] hover:text-lavender-300 transition"
            >
                {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside
                className={`fixed left-0 top-0 h-screen w-64 bg-[#1a0f2e] border-r border-[#3d2e5c] text-gray-100 transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 border-b border-[#3d2e5c]">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-lavender-500" size={28} />
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
                                ? 'bg-lavender-600/20 text-lavender-400 border-l-4 border-lavender-600'
                                : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-lavender-300'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#3d2e5c]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-lavender-300 transition-all text-sm font-medium"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            <div className="lg:ml-64" />
        </>
    )
}

export default Sidebar
