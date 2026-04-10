import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import FullPageLoader from '../components/FullPageLoader'
import TablePagination from '../components/TablePagination'
import { adminApi } from '../api'

function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingUserId, setEditingUserId] = useState(null)

    const [touched, setTouched] = useState({
        full_name: false,
        email: false,
        password: false,
    })

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

    const getInitials = (value) => {
        const text = (value || '').trim()
        if (!text) return '—'
        const parts = text.split(/\s+/).filter(Boolean)
        const first = parts[0]?.[0] || ''
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
        const initials = `${first}${last}`.toUpperCase()
        return initials || text.slice(0, 2).toUpperCase()
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
    }, [users.length])

    const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
    const pagedUsers = users.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const validateForm = (data) => {
        return {
            full_name: validateFullName(data.full_name),
            email: validateEmail(data.email),
            password: validatePassword(data.password),
        }
    }

    // Fetch users on mount
    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await adminApi.listUsers()
            setUsers(response.data)
            setError('')
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch users')
            console.error('Fetch users error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (user = null) => {
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
        setError('')
        setSuccess('')

        const nextErrors = validateForm(formData)
        setFormErrors(nextErrors)
        setTouched({
            full_name: true,
            email: true,
            password: true,
        })

        const hasErrors = Object.values(nextErrors).some(Boolean)
        if (hasErrors) {
            setError('Please fix the highlighted fields')
            return
        }

        try {
            const token = localStorage.getItem('authToken')

            if (isEditMode) {
                // Update user
                const response = await adminApi.updateUser(editingUserId, formData)
                setSuccess('User updated successfully')
                setUsers(
                    users.map((u) =>
                        u.id === editingUserId ? response.data : u
                    )
                )
            } else {
                // Create new user
                const response = await adminApi.createUser(formData)
                setSuccess(
                    response.data?.verification_sent
                        ? 'User created. Verification email sent (expires in 5 minutes).'
                        : 'User created successfully'
                )
                setUsers([...users, response.data])
            }

            handleCloseDialog()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save user')
            console.error('Save user error:', err)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return
        }

        try {
            await adminApi.deleteUser(userId)
            setSuccess('User deleted successfully')
            setUsers(users.filter((u) => u.id !== userId))
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to delete user')
            console.error('Delete user error:', err)
        }
    }

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const response = await adminApi.updateUser(userId, { is_active: !currentStatus })
            setUsers(
                users.map((u) => (u.id === userId ? response.data : u))
            )
            setSuccess(
                `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            )
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to update user')
            console.error('Toggle active error:', err)
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
                        {users.length} total users
                    </p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add User
                </Button>
            </div>

            {error && (
                <Card className="border-l-4 border-red-500">
                    <p className="text-red-400">{error}</p>
                </Card>
            )}

            {success && (
                <Card className="border-l-4 border-green-500">
                    <p className="text-green-400">{success}</p>
                </Card>
            )}

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">Loading users...</div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-400">No users found</div>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Name</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Email</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Role</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Status</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-sm font-semibold text-lavender-200">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="px-6 py-3 text-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-semibold text-lavender-200">
                                                    {getInitials(user.full_name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-white truncate">{user.full_name}</div>
                                                </div>
                                            </div>
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
                                                    onClick={() => handleOpenDialog(user)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition"
                                                    title="Edit user"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition"
                                                    title="Delete user"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {users.length > ITEMS_PER_PAGE ? (
                            <div className="px-5 py-4 border-t border-white/10">
                                <TablePagination
                                    align="center"
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        ) : null}
                    </>
                )}
            </Card>

            {/* Add/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
