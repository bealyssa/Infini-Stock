import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-[#171717]',
    {
        variants: {
            variant: {
                default: 'border-white bg-white text-black hover:bg-gray-200',
                secondary: 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700',
                destructive: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
                outline: 'border-white text-white hover:bg-white/10',
                success: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
                warning: 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700',
                info: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)

const Badge = forwardRef(({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
))
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
