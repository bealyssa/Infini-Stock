import { forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({ className, ...props }, ref) => (
    <div className="relative inline-block w-full">
        <select
            className={cn(
                'flex h-10 w-full rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2 pr-10 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-600/50 focus-visible:border-lavender-500 disabled:cursor-not-allowed disabled:opacity-50 transition appearance-none',
                className,
            )}
            ref={ref}
            {...props}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
    </div>
))
Select.displayName = 'Select'

export { Select }
