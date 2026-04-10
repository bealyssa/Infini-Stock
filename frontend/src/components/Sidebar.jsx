import { BarChart3, Package, Monitor, QrCode, Activity, Users, Menu, X, Zap, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from './ui/Dialog'
import { Button } from './ui/Button'

function Sidebar() {
    const [open, setOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()
    const logoutDialog = useDialog()

    const menuGroups = [
        {
            title: 'Overview',
            items: [{ path: '/', label: 'Dashboard', icon: BarChart3 }],
        },
        {
            title: 'Device Management',
            items: [
                { path: '/units', label: 'System Units', icon: Package },
                { path: '/monitors', label: 'Monitors', icon: Monitor },
                { path: '/qr-generator', label: 'QR Generator', icon: QrCode },
            ],
        },
        {
            title: 'Account Management',
            items: [
                { path: '/logs', label: 'Activity Logs', icon: Activity },
                { path: '/admin/users', label: 'Manage Users', icon: Users },
            ],
        },
    ]

    const isActive = (path) => location.pathname === path

    const handleLogout = () => {
        logoutDialog.onOpenChange(true)
    }

    const confirmLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth-change'))
        logoutDialog.onOpenChange(false)
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
                className={`fixed left-0 top-0 h-screen w-64 bg-transparent text-gray-100 transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="m-3 h-[calc(100vh-1.5rem)] rounded-2xl border border-[#3d2e5c]/60 bg-gradient-to-b from-[#1a0f2e]/85 to-[#2d1f4d]/50 backdrop-blur-md shadow-lg shadow-black/30 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="text-lavender-500" size={28} />
                            <h1 className="text-2xl font-bold text-white">
                                Infini-Stock
                            </h1>
                        </div>
                        <p className="text-sm text-gray-300/80">
                            IoT Inventory System
                        </p>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-4">
                        {menuGroups.map((group) => (
                            <div key={group.title}>
                                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300/70">
                                    {group.title}
                                </p>
                                <div className="space-y-2">
                                    {group.items.map(({ path, label, icon: Icon }) => (
                                        <Link
                                            key={path}
                                            to={path}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(path)
                                                ? 'bg-lavender-600/20 text-lavender-200 border-l-4 border-lavender-600'
                                                : 'text-gray-300/70 hover:bg-white/5 hover:text-lavender-100'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300/70 hover:bg-white/5 hover:text-lavender-100 transition-all text-sm font-medium"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            <div className="lg:ml-64" />

            <Dialog open={logoutDialog.open} onOpenChange={logoutDialog.onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to logout? You will need to login again to access the system.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => logoutDialog.onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmLogout}
                        >
                            <LogOut className="mr-2" size={16} />
                            Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default Sidebar
