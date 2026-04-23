import { BarChart3, Package, Monitor, Activity, Users, Menu, X, Zap, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useDialog } from './ui/Dialog'
import { Button } from './ui/Button'


function Sidebar() {
    const [open, setOpen] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()
    const logoutDialog = useDialog()

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userRole = user?.role

    const menuGroups = [
        // Overview - available to all authenticated users
        {
            title: 'Overview',
            items: [{ path: '/', label: 'Dashboard', icon: BarChart3 }],
        },
        {
            title: 'Device Management',
            items: [
                { path: '/units', label: 'System Units', icon: Package },
                { path: '/monitors', label: 'Monitors', icon: Monitor },
            ],
        },
        // Account Management - hidden entirely for staff and viewer
        ...(userRole !== 'staff' && userRole !== 'viewer' ? [{
            title: 'Account Management',
            items: [
                // Activity Logs - hidden for staff and viewer (view-only roles)
                ...(userRole !== 'staff' && userRole !== 'viewer' ? [{ path: '/logs', label: 'Activity Logs', icon: Activity }] : []),
                // Show "Manage Users" for admin and manager roles
                ...(userRole === 'admin' || userRole === 'manager' ? [{ path: '/admin/users', label: 'Manage Users', icon: Users }] : []),
            ],
        }] : []),
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
                className="fixed top-4 left-4 z-10 md:hidden p-2 rounded-lg bg-lavender-600 text-white hover:bg-lavender-700 transition"
            >
                {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop for mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 h-screen w-64 bg-[#190F2B] border-r border-[#3d2e5c] text-gray-100 transition-transform duration-300 ease-in-out z-20 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-[23px] border-b border-[#3d2e5c]">
                        <div className="flex items-center gap-3">
                            <Zap className="text-lavender-500" size={28} />
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Infini-Stock
                                </h1>
                    
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                        {menuGroups.map((group) => (
                            <div key={group.title}>
                                <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {group.title}
                                </p>
                                <div className="space-y-1">
                                    {group.items.map(({ path, label, icon: Icon }) => (
                                        <Link
                                            key={path}
                                            to={path}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(path)
                                                ? 'bg-[#311850] text-lavender-300 border-l-2 border-lavender-600'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className={`text-sm ${isActive(path) ? 'font-bold' : 'font-medium'}`}>{label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#3d2e5c]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all text-sm font-medium"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

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
