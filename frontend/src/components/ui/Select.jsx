import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Select = forwardRef(({ className, ...props }, ref) => (
    <select
        className={cn(
            'flex h-10 w-full rounded-md border border-[#3d2e5c] bg-[#171717] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-600/50 focus-visible:border-lavender-500 disabled:cursor-not-allowed disabled:opacity-50 transition',
            className,
        )}
        ref={ref}
        {...props}
    />
))
Select.displayName = 'Select'

export { Select }
