import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-lavender-500 focus:ring-offset-[#171717]',
    {
        variants: {
            variant: {
                default: 'border-lavender-600 bg-lavender-600 text-white hover:bg-lavender-700',
                secondary: 'border-[#3d2e5c] bg-[#1f1a2f] text-lavender-300 hover:bg-[#2d1f4a]',
                destructive: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
                outline: 'border-lavender-600 text-lavender-400 hover:bg-lavender-600/10',
                success: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
                warning: 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700',
                info: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
                active: 'border-lavender-500 bg-lavender-500/20 text-lavender-300',
                inactive: 'border-gray-600 bg-gray-600/20 text-gray-300',
                maintenance: 'border-amber-600 bg-amber-600/20 text-amber-300',
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
