'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogs } from '@/hooks/useLogs'
import { LogTable } from '@/components/logs/LogTable'
import { LogFilterPanel, type LogFilterValues } from '@/components/logs/LogFilterPanel'
import { Pagination } from '@/components/logs/Pagination'
import type { Severity } from '@/types/log'

interface FilterState {
  start?: string
  end?: string
  severity?: Severity[]
  source?: string
}

interface SortState {
  sort_by: 'timestamp' | 'severity' | 'source'
  order: 'asc' | 'desc'
}

export default function LogsPage() {
  const router = useRouter()

  const [filters, setFilters] = useState<FilterState>({})
  const [sort, setSort] = useState<SortState>({ sort_by: 'timestamp', order: 'desc' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const { data, isLoading, isError, error } = useLogs({
    ...filters,
    sort_by: sort.sort_by,
    order: sort.order,
    page,
    limit,
  })

  // W-05: フィルタ変更時に page を 1 にリセット
  function handleApplyFilters(newFilters: LogFilterValues) {
    setFilters({
      start: newFilters.start,
      end: newFilters.end,
      severity: newFilters.severity,
      source: newFilters.source,
    })
    setPage(1)
  }

  function handleSortChange(newSort: SortState) {
    setSort(newSort)
    setPage(1)
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit)
    setPage(1)
  }

  function handleRowClick(id: number) {
    router.push(`/logs/${id}`)
  }

  function handleNewLog() {
    router.push('/logs/new')
  }

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="logs-page">
      <h1 className="text-2xl font-bold" data-testid="logs-page-title">
        Log List
      </h1>

      <LogFilterPanel
        onApply={handleApplyFilters}
        onNewLog={handleNewLog}
        currentFilters={filters}
      />

      {isLoading && (
        <div className="flex flex-col gap-2" data-testid="logs-loading">
          {/* スケルトン */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded bg-muted animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="logs-error"
        >
          Failed to load logs: {error?.message ?? 'Unknown error'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <LogTable
            logs={data.data}
            sortBy={sort.sort_by}
            order={sort.order}
            onSortChange={handleSortChange}
            onRowClick={handleRowClick}
          />

          <Pagination
            page={data.page}
            pages={data.pages}
            limit={data.limit}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  )
}