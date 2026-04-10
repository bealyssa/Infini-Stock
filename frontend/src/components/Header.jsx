import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { authApi } from '../api'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    useDialog,
} from './ui/Dialog'

function getInitials(fullName) {
    const name = (fullName || '').trim()
    if (!name) return ''
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : ''
    return (first + last).toUpperCase()
}

function Header() {
    const location = useLocation()
    const [time, setTime] = useState('')
    const [date, setDate] = useState('')
    const [user, setUser] = useState(null)
    const [menuOpen, setMenuOpen] = useState(false)

    const accountDialog = useDialog()
    const menuRef = useRef(null)

    const pageMeta = useMemo(() => {
        const path = location.pathname || '/'
        if (path === '/' || path === '') {
            return { category: 'OVERVIEW', page: 'DASHBOARD' }
        }
        if (path.startsWith('/units')) {
            return { category: 'DEVICE MANAGEMENT', page: 'SYSTEM UNITS' }
        }
        if (path.startsWith('/monitors')) {
            return { category: 'DEVICE MANAGEMENT', page: 'MONITORS' }
        }
        if (path.startsWith('/qr-generator')) {
            return { category: 'DEVICE MANAGEMENT', page: 'QR GENERATOR' }
        }
        if (path.startsWith('/logs')) {
            return { category: 'ACCOUNT MANAGEMENT', page: 'ACTIVITY LOGS' }
        }
        if (path.startsWith('/admin/users')) {
            return { category: 'ACCOUNT MANAGEMENT', page: 'MANAGE USERS' }
        }
        return { category: 'OVERVIEW', page: 'DASHBOARD' }
    }, [location.pathname])

    const [infoForm, setInfoForm] = useState({ full_name: '', email: '' })
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
    })
    const [accountBusy, setAccountBusy] = useState(false)
    const [accountError, setAccountError] = useState(null)
    const [accountSuccess, setAccountSuccess] = useState(null)

    useEffect(() => {
        const updateTimeDate = () => {
            const now = new Date()
            setTime(now.toLocaleTimeString('en-US', { hour12: true }))
            setDate(
                now.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                }),
            )
        }

        updateTimeDate()
        const interval = setInterval(updateTimeDate, 1000)

        const readUser = () => {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                try {
                    const parsed = JSON.parse(userStr)
                    setUser(parsed)
                } catch {
                    setUser(null)
                }
            } else {
                setUser(null)
            }
        }

        readUser()
        window.addEventListener('storage', readUser)
        window.addEventListener('auth-change', readUser)

        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', readUser)
            window.removeEventListener('auth-change', readUser)
        }
    }, [])

    useEffect(() => {
        if (!accountDialog.open) return
        setAccountError(null)
        setAccountSuccess(null)
        setInfoForm({
            full_name: user?.full_name || '',
            email: user?.email || '',
        })
        setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_new_password: '',
        })
    }, [accountDialog.open, user])

    useEffect(() => {
        if (!menuOpen) return

        const onDocMouseDown = (e) => {
            if (!menuRef.current) return
            if (menuRef.current.contains(e.target)) return
            setMenuOpen(false)
        }

        const onKeyDown = (e) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }

        document.addEventListener('mousedown', onDocMouseDown)
        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown)
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [menuOpen])

    const submitInfo = async (e) => {
        e.preventDefault()
        setAccountError(null)
        setAccountSuccess(null)

        const full_name = (infoForm.full_name || '').trim()
        const email = (infoForm.email || '').trim()

        if (!full_name) {
            setAccountError('Full name is required')
            return
        }
        if (!email) {
            setAccountError('Email is required')
            return
        }

        setAccountBusy(true)
        try {
            const res = await authApi.updateMe({ full_name, email })
            const updatedUser = res?.data?.user
            const token = res?.data?.token

            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser))
                setUser(updatedUser)
                window.dispatchEvent(new Event('auth-change'))
            }
            if (token) {
                localStorage.setItem('authToken', token)
                window.dispatchEvent(new Event('auth-change'))
            }

            setAccountSuccess('Account updated')
        } catch (err) {
            setAccountError(err?.response?.data?.message || err?.message || 'Failed to update account')
        } finally {
            setAccountBusy(false)
        }
    }

    const submitPassword = async (e) => {
        e.preventDefault()
        setAccountError(null)
        setAccountSuccess(null)

        const current_password = passwordForm.current_password
        const new_password = passwordForm.new_password
        const confirm = passwordForm.confirm_new_password

        if (!current_password || !new_password) {
            setAccountError('Current password and new password are required')
            return
        }
        if (new_password.length < 8) {
            setAccountError('New password must be at least 8 characters')
            return
        }
        if (new_password !== confirm) {
            setAccountError('New passwords do not match')
            return
        }

        setAccountBusy(true)
        try {
            await authApi.changePassword({ current_password, new_password })
            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_new_password: '',
            })
            setAccountSuccess('Password updated')
        } catch (err) {
            setAccountError(err?.response?.data?.message || err?.message || 'Failed to update password')
        } finally {
            setAccountBusy(false)
        }
    }

    return (
        <>
            <header className="fixed top-0 right-0 left-0 lg:left-64 h-[75px] z-30">
                <div className="h-full px-4 lg:px-6 flex items-center">
                    <div className="h-[63px] w-full rounded-2xl border border-[#3d2e5c]/60 bg-gradient-to-r from-[#1a0f2e]/80 to-[#2d1f4d]/55 backdrop-blur-md shadow-lg shadow-black/30">
                        <div className="h-full flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="text-left">
                                    <p className="text-gray-100 font-semibold text-xl tracking-wide">
                                        <span className="text-gray-300/80">{pageMeta.category}</span>
                                        <span className="text-gray-400/70"> / </span>
                                        <span className="text-gray-100">{pageMeta.page}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="text-right">
                                    <p className="text-gray-100 font-semibold text-lg leading-none">{time}</p>
                                    <p className="mt-1 text-gray-300/80 text-sm leading-none">{date}</p>
                                </div>

                                <div className="relative" ref={menuRef}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-11 px-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-3"
                                        onClick={() => setMenuOpen((v) => !v)}
                                        aria-label="Open account menu"
                                    >
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                            {user?.full_name ? (
                                                <span className="text-xs font-bold text-gray-100">
                                                    {getInitials(user.full_name) || (
                                                        <User size={18} className="text-gray-300" />
                                                    )}
                                                </span>
                                            ) : (
                                                <User size={18} className="text-gray-300" />
                                            )}
                                        </span>

                                        <span className="text-sm font-semibold text-gray-100 whitespace-nowrap max-w-[200px] truncate">
                                            {user?.full_name || 'Account'}
                                        </span>
                                    </Button>

                                    {menuOpen ? (
                                        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-[#3d2e5c] bg-[#0f0a1a] shadow-lg">
                                            <button
                                                type="button"
                                                className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-lavender-500/10"
                                                onClick={() => {
                                                    setMenuOpen(false)
                                                    accountDialog.onOpenChange(true)
                                                }}
                                            >
                                                Account
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <Dialog
                open={accountDialog.open}
                onOpenChange={(open) => accountDialog.onOpenChange(open)}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Account</DialogTitle>
                        <DialogDescription>
                            Update your information and password
                        </DialogDescription>
                    </DialogHeader>

                    {accountError ? (
                        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {accountError}
                        </div>
                    ) : null}
                    {accountSuccess ? (
                        <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                            {accountSuccess}
                        </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-4">
                        <form
                            onSubmit={submitInfo}
                            className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4"
                        >
                            <p className="text-sm font-semibold text-gray-200">Information</p>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                                        Full Name
                                    </label>
                                    <Input
                                        value={infoForm.full_name}
                                        onChange={(e) =>
                                            setInfoForm((p) => ({ ...p, full_name: e.target.value }))
                                        }
                                        disabled={accountBusy}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                                        Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={infoForm.email}
                                        onChange={(e) =>
                                            setInfoForm((p) => ({ ...p, email: e.target.value }))
                                        }
                                        disabled={accountBusy}
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button type="submit" disabled={accountBusy}>
                                    {accountBusy ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        </form>

                        <form
                            onSubmit={submitPassword}
                            className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4"
                        >
                            <p className="text-sm font-semibold text-gray-200">Password</p>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                                        Current Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.current_password}
                                        onChange={(e) =>
                                            setPasswordForm((p) => ({
                                                ...p,
                                                current_password: e.target.value,
                                            }))
                                        }
                                        disabled={accountBusy}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.new_password}
                                        onChange={(e) =>
                                            setPasswordForm((p) => ({
                                                ...p,
                                                new_password: e.target.value,
                                            }))
                                        }
                                        disabled={accountBusy}
                                        placeholder="min 8 characters"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                                        Confirm New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordForm.confirm_new_password}
                                        onChange={(e) =>
                                            setPasswordForm((p) => ({
                                                ...p,
                                                confirm_new_password: e.target.value,
                                            }))
                                        }
                                        disabled={accountBusy}
                                        placeholder="repeat new password"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button type="submit" disabled={accountBusy}>
                                    {accountBusy ? 'Updating…' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => accountDialog.onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default Header
