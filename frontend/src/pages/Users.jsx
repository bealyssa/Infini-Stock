import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Trash, Eye, Shield } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { ToastContainer } from '../components/ui/Toast'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'
import { canEditData, isViewOnly, isManager, getManagerOperations } from '../lib/permissions'
import { adminApi } from '../api'

function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [toasts, setToasts] = useState([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingUserId, setEditingUserId] = useState(null)
    const canEdit = canEditData()
    const viewOnly = isViewOnly()

    const [touched, setTouched] = useState({
        full_name: false,
        email: false,
        password: false,
    })

    const showToast = (message, type = 'success', duration = 3000) => {
        const id = Math.random()
        setToasts(prev => [...prev, { id, message, type, duration }])
        return id
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const [formErrors, setFormErrors] = useState({
        full_name: '',
        email: '',
        password: '',
    })

    const ROLES = ['admin', 'manager', 'technician', 'staff', 'viewer']

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'staff',
    })

    const [selectedUsers, setSelectedUsers] = useState(new Set())
    const [searchQuery, setSearchQuery] = useState('')

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const validateEmail = (value) => {
        if (isEditMode) return ''
        const email = (value || '').trim()
        if (!email) return 'Email is required'
        const basicEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        if (!basicEmailOk) return 'Enter a valid email address'
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return 'Email must be a @gmail.com address'
        }
        return ''
    }

    const validateFullName = (value) => {
        const name = (value || '').trim()
        if (!name) return 'Full name is required'
        if (name.length < 3) return 'Full name is too short'
        return ''
    }

    const validatePassword = (value) => {
        const password = value || ''
        if (isEditMode && !password) return ''
        if (!password) return 'Password is required'
        if (password.length < 8) return 'Password must be at least 8 characters'
        if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter'
        if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter'
        if (!/[0-9]/.test(password)) return 'Password must include a number'
        return ''
    }


    const formatRole = (role) => {
        const value = (role || '').trim()
        if (!value) return '—'
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    const getRoleVariant = (role) => {
        const value = (role || '').toLowerCase()
        if (value === 'admin') return 'destructive'
        if (value === 'manager') return 'warning'
        if (value === 'technician') return 'info'
        if (value === 'staff') return 'secondary'
        if (value === 'viewer') return 'outline'
        return 'secondary'
    }

    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
    const pagedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const toggleUserSelection = (userId) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUsers(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set())
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) return

        const currentUserId = getCurrentUserId()
        if (selectedUsers.has(currentUserId)) {
            showToast('You cannot delete your own account', 'error')
            return
        }

        if (!confirm(`Delete ${selectedUsers.size} user(s)? This cannot be undone.`)) return

        try {
            const idsToDelete = Array.from(selectedUsers)
            await Promise.all(idsToDelete.map(id => adminApi.deleteUser(id)))
            setUsers(prev => prev.filter(u => !idsToDelete.includes(u.id)))
            setSelectedUsers(new Set())
            showToast(`${selectedUsers.size} user(s) deleted successfully`, 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete users', 'error')
        }
    }

    const validateForm = (data) => {
        return {
            full_name: validateFullName(data.full_name),
            email: validateEmail(data.email),
            password: validatePassword(data.password),
        }
    }

    // Fetch users on mount
    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true)
                const response = await adminApi.listUsers()
                setUsers(response.data)
            } catch (err) {
                showToast(err.response?.data?.message || err.message || 'Failed to fetch users', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    const handleOpenDialog = (user = null) => {
        if (!canEdit) {
            showToast('View-only mode: You cannot edit users', 'error')
            return
        }
        if (user) {
            setIsEditMode(true)
            setEditingUserId(user.id)
            setFormData({
                full_name: user.full_name,
                email: user.email,
                password: '',
                role: user.role,
            })
        } else {
            setIsEditMode(false)
            setEditingUserId(null)
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'staff',
            })
        }

        setTouched({
            full_name: false,
            email: false,
            password: false,
        })
        setFormErrors({
            full_name: '',
            email: '',
            password: '',
        })
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role: 'staff',
        })
        setTouched({
            full_name: false,
            email: false,
            password: false,
        })
        setFormErrors({
            full_name: '',
            email: '',
            password: '',
        })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target

        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: value,
            }

            // realtime validation
            const nextErrors = validateForm(next)
            setFormErrors(nextErrors)
            return next
        })

        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const nextErrors = validateForm(formData)
        setFormErrors(nextErrors)
        setTouched({
            full_name: true,
            email: true,
            password: true,
        })

        const hasErrors = Object.values(nextErrors).some(Boolean)
        if (hasErrors) {
            showToast('Please fix the highlighted fields', 'error')
            return
        }

        try {
            if (isEditMode) {
                // Update user
                const response = await adminApi.updateUser(editingUserId, formData)
                showToast('User updated successfully', 'success')
                setUsers(
                    users.map((u) =>
                        u.id === editingUserId ? response.data : u
                    )
                )
            } else {
                // Create new user
                const response = await adminApi.createUser(formData)
                const message = response.data?.verification_sent
                    ? 'User created. Verification email sent (expires in 5 minutes).'
                    : 'User created successfully'
                showToast(message, 'success')
                setUsers([...users, response.data])
            }

            handleCloseDialog()
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to save user', 'error')
        }
    }

    const getCurrentUserId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            return user?.id
        } catch {
            return null
        }
    }

    const handleDeleteUser = async (userId) => {
        const currentUserId = getCurrentUserId()
        if (currentUserId === userId) {
            showToast("You cannot delete your own account", 'error')
            return
        }

        if (!window.confirm('Are you sure you want to delete this user?')) {
            return
        }

        try {
            await adminApi.deleteUser(userId)
            showToast('User deleted successfully', 'success')
            setUsers(users.filter((u) => u.id !== userId))
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to delete user', 'error')
        }
    }

    const handleToggleActive = async (userId, currentStatus) => {
        const currentUserId = getCurrentUserId()
        if (currentUserId === userId) {
            showToast("You cannot deactivate your own account", 'error')
            return
        }

        try {
            const response = await adminApi.updateUser(userId, { is_active: !currentStatus })
            setUsers(
                users.map((u) => (u.id === userId ? response.data : u))
            )
            const message = `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            showToast(message, 'success')
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to update user', 'error')
        }
    }

    if (loading) {
        return <FullPageLoader title="Loading users..." />
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Manage Users
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {filteredUsers.length} {searchQuery ? 'matching' : 'total'} users
                    </p>
                </div>
                <div className="flex gap-2">
                    {viewOnly && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-500/50 text-blue-200 text-sm font-medium">
                            <Eye size={16} />
                            View-only mode
                        </div>
                    )}
                    {isManager() && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/50 text-purple-200 text-sm font-medium">
                            <Shield size={16} />
                            Manager Mode: {getManagerOperations().display}
                        </div>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={selectedUsers.size === 0 || !canEdit}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash size={16} className="mr-2" />
                        Delete {selectedUsers.size > 0 && `(${selectedUsers.size})`}
                    </Button>
                    <Button
                        onClick={() => handleOpenDialog()}
                        disabled={!canEdit}
                        className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={20} />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">Loading users...</div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">No users found</div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">No users match your search</div>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200 w-12">
                                        <input
                                            type="checkbox"
                                            checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                                            onChange={toggleSelectAll}
                                            ref={el => {
                                                if (el) el.indeterminate = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length
                                            }}
                                            className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                        />
                                    </TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Name</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Email</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Role</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Status</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedUsers.map((user) => (
                                    <TableRow key={user.id}
                                        onClick={() => handleOpenDialog(user)}
                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <TableCell className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={e => {
                                                    e.stopPropagation();
                                                    toggleUserSelection(user.id)
                                                }}
                                                className="appearance-none w-4 h-4 border-2 border-[#3d2e5c] bg-[#0f0a1a] rounded cursor-pointer checked:bg-lavender-600 checked:border-lavender-600 checked:bg-[length:100%_100%] checked:[background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjcwNyA1LjI5M2ExIDEgMCAwIDEgMCAxLjQxNGwtOCA4YTEgMSAwIDAgMS0xLjQxNCAwbC00LTRhMSAxIDAgMCAxIDEuNDE0LTEuNDE0TDggMTIuNTg2bDcuMjkzLTcuMjkzYTEgMSAwIDAgMSAxLjQxNCAweiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] checked:bg-center checked:bg-no-repeat transition-colors"
                                            />
                                        </TableCell>
                                        <TableCell className="px-6 py-3 text-gray-100">
                                            <div className="font-medium text-white">{user.full_name}</div>
                                        </TableCell>
                                        <TableCell className="px-6 py-3 text-gray-300">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="px-6 py-3">
                                            <Badge variant={getRoleVariant(user.role)}>
                                                {formatRole(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-3">
                                            <button
                                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                                className="flex items-center gap-2 text-gray-300 hover:text-gray-100 transition"
                                            >
                                                {user.is_active ? (
                                                    <>
                                                        <ToggleRight size={20} className="text-green-500" />
                                                        <span className="text-sm">Active</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft size={20} className="text-gray-500" />
                                                        <span className="text-sm">Inactive</span>
                                                    </>
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => canEdit && handleOpenDialog(user)}
                                                    disabled={!canEdit}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={canEdit ? 'Edit user' : 'View-only mode'}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => canEdit && handleDeleteUser(user.id)}
                                                    disabled={!canEdit}
                                                    className="p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={canEdit ? 'Delete user' : 'View-only mode'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </>
                )}
            </Card>

            <div className="mt-6">
                <div className="px-5 py-4">
                    <TablePagination
                        align="end"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Add/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Full Name
                            </label>
                            <Input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                                required
                            />
                            {touched.full_name && formErrors.full_name ? (
                                <p className="mt-1 text-sm text-red-400">{formErrors.full_name}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Email
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="name@gmail.com"
                                required
                                disabled={isEditMode}
                            />
                            {!isEditMode ? (
                                <p className="mt-1 text-xs text-gray-500">Only @gmail.com emails are allowed.</p>
                            ) : null}
                            {touched.email && formErrors.email ? (
                                <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                {isEditMode ? 'Password (leave blank to keep current)' : 'Password'}
                            </label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required={!isEditMode}
                            />
                            {touched.password && formErrors.password ? (
                                <p className="mt-1 text-sm text-red-400">{formErrors.password}</p>
                            ) : (
                                <p className="mt-1 text-xs text-gray-500">
                                    8+ chars, upper/lowercase, number
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Role
                            </label>
                            <Select
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        role: e.target.value,
                                    })
                                }
                            >
                                {ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() +
                                            role.slice(1)}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={Object.values(formErrors).some(Boolean)}
                            >
                                {isEditMode ? 'Update User' : 'Create User'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Users
