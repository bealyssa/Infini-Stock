import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from './ui/Pagination'

function getPageModel(totalPages, currentPage) {
    if (!totalPages || totalPages <= 1) return []

    const safeCurrent = Math.min(Math.max(1, currentPage || 1), totalPages)
    const pages = []

    for (let page = 1; page <= totalPages; page += 1) {
        const isEdge = page === 1 || page === totalPages
        const isNear = page >= safeCurrent - 1 && page <= safeCurrent + 1
        if (isEdge || isNear) pages.push(page)
    }

    const model = []
    for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i]
        const prev = pages[i - 1]
        if (i > 0 && prev !== page - 1) model.push('ellipsis')
        model.push(page)
    }

    return model
}

function TablePagination({ currentPage, totalPages, onPageChange, align = 'end', className = '' }) {
    if (!totalPages || totalPages <= 1) return null

    const safeCurrent = Math.min(Math.max(1, currentPage || 1), totalPages)
    const model = getPageModel(totalPages, safeCurrent)
    const justifyClass =
        align === 'center'
            ? 'justify-center'
            : align === 'start'
                ? 'justify-start'
                : 'justify-end'

    return (
        <div className={className}>
            <Pagination className={justifyClass}>
                <PaginationContent className="gap-1">
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
                        disabled={safeCurrent === 1}
                    />
                </PaginationItem>

                {model.map((item, idx) =>
                    item === 'ellipsis' ? (
                        <PaginationItem key={`e-${idx}`}>
                            <span className="px-1 text-xs text-gray-500">…</span>
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={item}>
                            <PaginationLink
                                isActive={item === safeCurrent}
                                onClick={() => onPageChange(item)}
                            >
                                {item}
                            </PaginationLink>
                        </PaginationItem>
                    ),
                )}

                <PaginationItem>
                    <PaginationNext
                        onClick={() => onPageChange(Math.min(totalPages, safeCurrent + 1))}
                        disabled={safeCurrent === totalPages}
                    />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}

export default TablePagination
