import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import SystemUnits from './pages/SystemUnits'
import Monitors from './pages/Monitors'
import ActivityLogs from './pages/ActivityLogs'
import Users from './pages/Users'
import Login from './pages/Login'
import ScanQrFab from './components/ScanQrFab'
import './index.css'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = () => {
            const token = localStorage.getItem('authToken')
            setIsAuthenticated(!!token)
            setLoading(false)
        }

        checkAuth()

        // Listen for custom auth events (login/logout)
        window.addEventListener('auth-change', checkAuth)

        // Listen for storage changes (login in other tabs)
        window.addEventListener('storage', checkAuth)

        return () => {
            window.removeEventListener('auth-change', checkAuth)
            window.removeEventListener('storage', checkAuth)
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050814] via-[#070A1C] to-[#0A0F2A]">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                    path="/*"
                    element={
                        isAuthenticated ? (
                            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050814] via-[#070A1C] to-[#0A0F2A]">
                                <div className="pointer-events-none absolute inset-0">
                                    <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-lavender-600/10 blur-3xl" />
                                    <div className="absolute bottom-[-220px] right-[-220px] h-[520px] w-[520px] rounded-full bg-lavender-500/10 blur-3xl" />
                                </div>

                                <Sidebar />

                                <div className="relative z-10 md:ml-64 flex flex-col min-h-screen">
                                    <Header />
                                    <main className="flex-1 overflow-auto pt-[75px]">
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/units" element={<SystemUnits />} />
                                            <Route path="/monitors" element={<Monitors />} />
                                            <Route path="/logs" element={<ActivityLogs />} />
                                            <Route path="/admin/users" element={<Users />} />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </main>
                                    <ScanQrFab />
                                </div>
                            </div>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
            </Routes>
        </Router>
    )
}

export default App
