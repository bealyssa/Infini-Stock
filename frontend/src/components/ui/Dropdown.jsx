import { useState, useRef, useEffect } from 'react'

export function Dropdown({ trigger, children, dropUp = false }) {
    const [open, setOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState({})
    const triggerRef = useRef(null)
    const ref = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const menuHeight = 150 // Approximate height of dropdown menu
            const spaceBelow = window.innerHeight - rect.bottom

            // Check if there's enough space below, otherwise position above
            let top
            if (spaceBelow < menuHeight || dropUp) {
                // Position above the trigger
                top = `${rect.top - menuHeight - 8}px`
            } else {
                // Position below the trigger (default)
                top = `${rect.bottom + 8}px`
            }

            setMenuStyle({
                position: 'fixed',
                top: top,
                right: `${window.innerWidth - rect.right}px`,
                width: '192px',
            })
        }
    }, [open, dropUp])

    const handleTriggerClick = (e) => {
        e.stopPropagation()
        setOpen(!open)
    }

    return (
        <div className="relative inline-block" ref={ref}>
            <div ref={triggerRef} onClick={handleTriggerClick}>
                {typeof trigger === 'function' ? trigger(handleTriggerClick) : trigger}
            </div>
            {open && (
                <div
                    className="rounded-lg border border-[#3d2e5c] bg-[#1f1a2f] shadow-2xl z-[9999] overflow-hidden"
                    style={menuStyle}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

export function DropdownItem({ icon: Icon, label, onClick }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
        >
            {Icon && <Icon size={16} />}
            <span>{label}</span>
        </button>
    )
}
