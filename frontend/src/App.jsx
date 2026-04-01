import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import SystemUnits from './pages/SystemUnits'
import Monitors from './pages/Monitors'
import QRGenerator from './pages/QRGenerator'
import ActivityLogs from './pages/ActivityLogs'
import Users from './pages/Users'
import Login from './pages/Login'
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
            <div className="min-h-screen flex items-center justify-center bg-[#171717]">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    // Protected Route Component
    const ProtectedRoute = ({ element }) => {
        return isAuthenticated ? element : <Navigate to="/login" replace />
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
                            <div className="flex min-h-screen bg-[#171717]">
                                <Sidebar />
                                <div className="flex-1 flex flex-col">
                                    <Header />
                                    <main className="flex-1 overflow-auto pt-16">
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route
                                                path="/units"
                                                element={<SystemUnits />}
                                            />
                                            <Route
                                                path="/monitors"
                                                element={<Monitors />}
                                            />
                                            <Route
                                                path="/qr-generator"
                                                element={<QRGenerator />}
                                            />
                                            <Route
                                                path="/logs"
                                                element={<ActivityLogs />}
                                            />
                                            <Route
                                                path="/admin/users"
                                                element={<Users />}
                                            />
                                            <Route
                                                path="*"
                                                element={
                                                    <Navigate
                                                        to="/"
                                                        replace
                                                    />
                                                }
                                            />
                                        </Routes>
                                    </main>
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
