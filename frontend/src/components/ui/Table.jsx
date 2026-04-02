import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Table = forwardRef(({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-xl border border-[#3d2e5c] bg-[#0f0a1a] shadow-[0_0_0_1px_rgba(147,51,234,0.1)]">
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm', className)}
            {...props}
        />
    </div>
))
Table.displayName = 'Table'

const TableHeader = forwardRef(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn('border-b border-[#3d2e5c] bg-[#2d1f4a] text-lavender-300', className)}
        {...props}
    />
))
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
    />
))
TableBody.displayName = 'TableBody'

const TableFooter = forwardRef(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            'border-t border-gray-800 bg-black font-medium [&>tr]:last:border-b-0',
            className,
        )}
        {...props}
    />
))
TableFooter.displayName = 'TableFooter'

const TableRow = forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            'border-b border-[#2d215a] bg-[#171717] transition-colors hover:bg-[#1f1a2f] data-[state=selected]:bg-[#2d215a]',
            className,
        )}
        {...props}
    />
))
TableRow.displayName = 'TableRow'

const TableHead = forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-11 bg-[#2d1f4a] px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.14em] text-lavender-300 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
            className,
        )}
        {...props}
    />
))
TableHead.displayName = 'TableHead'

const TableCell = forwardRef(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'px-4 py-4 align-middle text-gray-100 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
            className,
        )}
        {...props}
    />
))
TableCell.displayName = 'TableCell'

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
}
