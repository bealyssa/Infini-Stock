import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Table = forwardRef(({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-inner shadow-black/40 backdrop-blur-md">
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
        className={cn('border-b border-white/10 bg-white/5 text-gray-300', className)}
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
            'border-t border-white/10 bg-white/5 font-medium [&>tr]:last:border-b-0',
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
            'border-b border-white/10 bg-transparent transition-colors hover:bg-white/5 data-[state=selected]:bg-white/10',
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
            'h-12 bg-transparent px-6 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-gray-300 first:pl-8 last:pr-8 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
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
            'px-6 py-4 align-middle text-gray-100 first:pl-8 last:pr-8 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
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
