import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function capitalize(str) {
    if (!str) return ''
    return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase()
}
