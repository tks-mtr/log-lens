'use client'

interface PaginationProps {
  page: number
  pages: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

// W-06: limit の最大値は 200
const LIMIT_OPTIONS = [10, 25, 50, 100, 200]

export function Pagination({ page, pages, limit, onPageChange, onLimitChange }: PaginationProps) {
  const isPrevDisabled = page <= 1
  const isNextDisabled = page >= pages

  return (
    <div className="flex items-center justify-between gap-4 py-3" data-testid="pagination">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isPrevDisabled}
          className="px-3 py-1.5 text-sm rounded border border-input hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="pagination-prev"
        >
          ← Prev
        </button>

        <span className="text-sm text-muted-foreground px-2" data-testid="pagination-info">
          Page {page} / {pages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isNextDisabled}
          className="px-3 py-1.5 text-sm rounded border border-input hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="pagination-next"
        >
          Next →
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Rows per page</label>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded border border-input bg-background px-2 py-1 text-sm"
          data-testid="pagination-limit"
        >
          {LIMIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}