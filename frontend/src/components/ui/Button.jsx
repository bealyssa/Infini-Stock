import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[#171717] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-white text-[#171717] hover:bg-gray-200',
                destructive: 'bg-red-600 text-white hover:bg-red-700',
                outline: 'border border-white bg-[#171717] text-white hover:bg-[#262626] hover:border-white',
                secondary: 'bg-gray-700 text-white hover:bg-gray-600',
                ghost: 'hover:bg-[#262626] hover:text-white text-gray-400',
                link: 'text-white underline-offset-4 hover:underline',
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
