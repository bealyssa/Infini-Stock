import React, { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'

const DialogContext = createContext()

export function Dialog({ children, open, onOpenChange }) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({ children, asChild, ...props }) {
    const { onOpenChange } = useContext(DialogContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: () => onOpenChange(true),
            ...props,
        })
    }

    return (
        <button onClick={() => onOpenChange(true)} {...props}>
            {children}
        </button>
    )
}

export function DialogContent({ children, className = '' }) {
    const { open, onOpenChange } = useContext(DialogContext)

    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#404040] bg-[#171717] p-6 shadow-lg animate-in fade-in zoom-in-95">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-md text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
                <div>{children}</div>
            </div>
        </>
    )
}

export function DialogHeader({ children, className = '' }) {
    return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>
}

export function DialogFooter({ children, className = '' }) {
    return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }) {
    return <h2 className={`text-lg font-semibold text-white ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = '' }) {
    return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>
}

// Hook for using dialog state
export function useDialog(initialOpen = false) {
    const [open, setOpen] = useState(initialOpen)
    return { open, onOpenChange: setOpen }
}
