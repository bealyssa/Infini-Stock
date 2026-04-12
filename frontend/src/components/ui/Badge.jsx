import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
    {
        variants: {
            variant: {
                default: 'border-lavender-600 bg-lavender-600/20 text-lavender-200',
                secondary: 'border-[#3d2e5c] bg-[#1f1a2f] text-lavender-300',
                destructive: 'border-red-600 bg-red-600/20 text-red-200',
                outline: 'border-lavender-600 text-lavender-300',
                success: 'border-green-600 bg-green-600/20 text-green-200',
                warning: 'border-amber-600 bg-amber-600/20 text-amber-200',
                info: 'border-blue-600 bg-blue-600/20 text-blue-200',
                active: 'border-green-600 bg-green-600/20 text-green-200',
                inactive: 'border-gray-600 bg-gray-600/20 text-gray-200',
                maintenance: 'border-amber-600 bg-amber-600/20 text-amber-200',
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
