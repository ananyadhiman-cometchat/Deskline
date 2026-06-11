import { Button } from './Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isFirstPage = page === 1
  const isLastPage = page === totalPages || total === 0

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">
            Showing <span className="font-semibold text-[var(--color-navy)]">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-[var(--color-navy)]">{Math.min(page * pageSize, total)}</span> of{' '}
            <span className="font-semibold text-[var(--color-navy)]">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px" aria-label="Pagination">
            <Button
              variant="ghost"
              size="sm"
              disabled={isFirstPage}
              onClick={() => onPageChange(page - 1)}
              className="rounded-none border-[var(--color-border)] px-2"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center justify-center border border-l-0 border-r-0 border-[var(--color-border)] bg-[var(--theme-surface)] px-4 text-sm font-semibold text-[var(--color-navy)]">
              {page} / {totalPages}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isLastPage}
              onClick={() => onPageChange(page + 1)}
              className="rounded-none border-[var(--color-border)] px-2"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>

      {/* Mobile view */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          size="sm"
          disabled={isFirstPage}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isLastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
