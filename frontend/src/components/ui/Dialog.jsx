import React, { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { Portal } from '../Portal'

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
        <Portal>
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50"
                    style={{ zIndex: 50000 }}
                    onClick={() => onOpenChange(false)}
                />

                {/* Modal */}
                <div
                    className={`fixed left-1/2 top-1/2 w-[calc(100%-2rem)] sm:w-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#3d2e5c] bg-[#190F2B] p-5 shadow-2xl shadow-black/70 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto min-w-fit ${className}`}
                    style={{ zIndex: 50001 }}
                >
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-6 top-6 text-gray-400 hover:text-gray-100 transition-colors p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div>{children}</div>
                </div>
            </>
        </Portal>
    )
}

export function DialogHeader({ children, className = '' }) {
    return <div className={`flex flex-col space-y-1 text-left mb-3 border-b border-[#3d2e5c] pb-3 ${className}`}>{children}</div>
}

export function DialogFooter({ children, className = '' }) {
    return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2 mt-4 pt-3 border-t border-[#3d2e5c] ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }) {
    return <h2 className={`text-xl font-bold text-white tracking-tight ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = '' }) {
    return <p className={`text-sm text-gray-400 leading-relaxed ${className}`}>{children}</p>
}

// Hook for using dialog state
export function useDialog(initialOpen = false) {
    const [open, setOpen] = useState(initialOpen)
    return { open, onOpenChange: setOpen }
}
