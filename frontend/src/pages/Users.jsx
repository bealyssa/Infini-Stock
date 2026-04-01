import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import axios from 'axios'

function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingUserId, setEditingUserId] = useState(null)

    const ROLES = ['admin', 'manager', 'technician', 'staff', 'viewer']

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'staff',
    })

    // Fetch users on mount
    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('authToken')
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            setUsers(response.data)
            setError('')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users')
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
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            const token = localStorage.getItem('authToken')

            if (isEditMode) {
                // Update user
                const response = await axios.patch(
                    `http://localhost:5000/api/admin/users/${editingUserId}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                setSuccess('User updated successfully')
                setUsers(
                    users.map((u) =>
                        u.id === editingUserId ? response.data : u
                    )
                )
            } else {
                // Create new user
                const response = await axios.post(
                    'http://localhost:5000/api/admin/users',
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                setSuccess('User created successfully')
                setUsers([...users, response.data])
            }

            handleCloseDialog()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save user')
            console.error('Save user error:', err)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return
        }

        try {
            const token = localStorage.getItem('authToken')
            await axios.delete(
                `http://localhost:5000/api/admin/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            setSuccess('User deleted successfully')
            setUsers(users.filter((u) => u.id !== userId))
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user')
            console.error('Delete user error:', err)
        }
    }

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('authToken')
            const response = await axios.patch(
                `http://localhost:5000/api/admin/users/${userId}`,
                { is_active: !currentStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            setUsers(
                users.map((u) => (u.id === userId ? response.data : u))
            )
            setSuccess(
                `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            )
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user')
            console.error('Toggle active error:', err)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <Card>
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
            </Card>

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
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#404040]">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-[#404040] hover:bg-[#262626] transition"
                                    >
                                        <td className="px-6 py-3 text-gray-100">
                                            {user.full_name}
                                        </td>
                                        <td className="px-6 py-3 text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-[#262626] text-gray-300">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <button
                                                onClick={() =>
                                                    handleToggleActive(
                                                        user.id,
                                                        user.is_active
                                                    )
                                                }
                                                className="flex items-center gap-2 text-gray-300 hover:text-gray-100 transition"
                                            >
                                                {user.is_active ? (
                                                    <>
                                                        <ToggleRight
                                                            size={20}
                                                            className="text-green-500"
                                                        />
                                                        <span className="text-sm">
                                                            Active
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft
                                                            size={20}
                                                            className="text-gray-500"
                                                        />
                                                        <span className="text-sm">
                                                            Inactive
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleOpenDialog(user)
                                                }
                                                className="p-2 rounded-lg hover:bg-[#262626] text-gray-400 hover:text-gray-200 transition"
                                                title="Edit user"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(user.id)
                                                }
                                                className="p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition"
                                                title="Delete user"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                placeholder="john@example.com"
                                required
                                disabled={isEditMode}
                            />
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
