import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import ShapeGrid from '../components/ShapeGrid'

function Login() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Call backend login endpoint
            const apiUrl = 'https://infinistock-backend.onrender.com/api'
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Login failed')
            }

            // Store token and user in localStorage
            localStorage.setItem('authToken', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

            // Dispatch custom auth event
            window.dispatchEvent(new Event('auth-change'))

            // Small delay to ensure state updates
            setTimeout(() => {
                navigate('/')
            }, 100)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050814] via-[#070A1C] to-[#0A0F2A] relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-lavender-600/10 blur-3xl" />
                <div className="absolute bottom-[-220px] right-[-220px] h-[520px] w-[520px] rounded-full bg-lavender-500/10 blur-3xl" />
            </div>

            {/* ShapeGrid Background */}
            <div className="absolute inset-0 z-0 opacity-40">
                <ShapeGrid
                    speed={0.5}
                    squareSize={40}
                    direction="diagonal"
                    borderColor="#ffffff14"
                    hoverFillColor="#ffffff0a"
                    shape="square"
                    hoverTrailAmount={0}
                />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white mb-4">
                            <LogIn className="text-[#171717]" size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Infini-Stock
                        </h1>
                        <p className="text-gray-400">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-md bg-red-500/10 border border-red-500/50">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <Input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <Input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-sm mt-8">
                    © 2024 Infini-Stock. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default Login
