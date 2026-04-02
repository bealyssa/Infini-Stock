import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'

function Header() {
    const navigate = useNavigate()
    const [time, setTime] = useState('')
    const [date, setDate] = useState('')
    const [user, setUser] = useState(null)

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

        // Get user from localStorage
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }

        return () => clearInterval(interval)
    }, [])

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-[#1a0f2e] border-b border-[#3d2e5c] flex items-center justify-between px-6 lg:px-8 z-30">
            <div className="flex items-center gap-3">
                {user && (
                    <div className="text-left">
                        <p className="text-gray-300 font-semibold text-sm">
                            {user.full_name}
                        </p>
                        <p className="text-gray-500 text-xs capitalize">
                            {user.role}
                        </p>
                    </div>
                )}
            </div>

            <div className="text-right">
                <p className="text-gray-300 font-semibold text-sm">
                    {time}
                </p>
                <p className="text-gray-500 text-xs">{date}</p>
            </div>
        </header>
    )
}

export default Header
