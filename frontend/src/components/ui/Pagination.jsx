import { forwardRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

const Pagination = forwardRef(({ className, ...props }, ref) => (
    <nav
        ref={ref}
        className={cn('flex items-center justify-between', className)}
        {...props}
    />
))
Pagination.displayName = 'Pagination'

const PaginationContent = forwardRef(({ className, ...props }, ref) => (
    <ul
        ref={ref}
        className={cn('flex flex-row items-center gap-1', className)}
        {...props}
    />
))
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = forwardRef(({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

const PaginationLink = forwardRef(
    ({ isActive, disabled, variant, size, className, ...props }, ref) => (
        <Button
            ref={ref}
            variant={isActive ? 'default' : variant || 'outline'}
            size={size || 'sm'}
            disabled={disabled}
            className={cn('h-8 w-8 p-0 rounded-md text-xs', className)}
            {...props}
        />
    ),
)
PaginationLink.displayName = 'PaginationLink'

const PaginationPrevious = forwardRef(({ className, ...props }, ref) => (
    <PaginationLink
        ref={ref}
        variant="outline"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        {...props}
    >
        <ChevronLeft size={16} />
    </PaginationLink>
))
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = forwardRef(({ className, ...props }, ref) => (
    <PaginationLink
        ref={ref}
        variant="outline"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        {...props}
    >
        <ChevronRight size={16} />
    </PaginationLink>
))
PaginationNext.displayName = 'PaginationNext'

const PaginationFirst = forwardRef(({ className, ...props }, ref) => (
    <PaginationLink
        ref={ref}
        variant="outline"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        {...props}
    >
        <ChevronLeft size={16} />
        <ChevronLeft size={16} className="ml-[-10px]" />
    </PaginationLink>
))
PaginationFirst.displayName = 'PaginationFirst'

const PaginationLast = forwardRef(({ className, ...props }, ref) => (
    <PaginationLink
        ref={ref}
        variant="outline"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        {...props}
    >
        <ChevronRight size={16} />
        <ChevronRight size={16} className="ml-[-10px]" />
    </PaginationLink>
))
PaginationLast.displayName = 'PaginationLast'

export {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationFirst,
    PaginationPrevious,
    PaginationNext,
    PaginationLast,
}
