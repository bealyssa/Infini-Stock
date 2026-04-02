import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[#171717] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-lavender-600 text-white hover:bg-lavender-700 active:bg-lavender-800',
                destructive: 'bg-red-600 text-white hover:bg-red-700',
                outline: 'border border-lavender-600 bg-transparent text-lavender-400 hover:bg-lavender-600/10 hover:text-lavender-300',
                secondary: 'bg-[#2d2d2d] text-gray-100 hover:bg-[#3d3d3d]',
                ghost: 'hover:bg-lavender-600/20 hover:text-lavender-300 text-gray-400',
                link: 'text-lavender-400 underline-offset-4 hover:underline hover:text-lavender-300',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

const Button = forwardRef(({ className, variant, size, ...props }, ref) => (
    <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
    />
))
Button.displayName = 'Button'

export { Button, buttonVariants }
