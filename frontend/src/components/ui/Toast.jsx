import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export function Toast({ message, type = 'success', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    if (!isVisible) return null

    const bgColor = type === 'success'
        ? 'bg-gradient-to-r from-green-600/30 to-green-500/20 border-green-500/50'
        : 'bg-gradient-to-r from-red-600/30 to-red-500/20 border-red-500/50'
    const textColor = type === 'success' ? 'text-green-200' : 'text-red-200'
    const Icon = type === 'success' ? CheckCircle : AlertCircle
    const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400'

    return (
        <div className={`flex items-center gap-3 rounded-lg border backdrop-blur-sm ${bgColor} px-5 py-3.5 ${textColor} shadow-lg`}>
            <Icon size={20} className={`flex-shrink-0 ${iconColor}`} />
            <span className="flex-1 font-medium text-sm">{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false)
                    onClose?.()
                }}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
                <X size={18} />
            </button>
        </div>
    )
}

export function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 max-w-md px-4" style={{ zIndex: 999999 }}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                    duration={toast.duration}
                />
            ))}
        </div>
    )
}

