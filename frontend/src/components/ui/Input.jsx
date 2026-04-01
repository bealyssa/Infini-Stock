import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef(({ className, type, ...props }, ref) => (
    <input
        type={type}
        className={cn(
            'flex h-10 w-full rounded-md border border-[#404040] bg-[#171717] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition',
            className,
        )}
        ref={ref}
        {...props}
    />
))
Input.displayName = 'Input'

export { Input }
