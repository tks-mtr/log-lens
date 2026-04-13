'use client'

import type { Log, Severity } from '@/types/log'

interface SortState {
  sort_by: 'timestamp' | 'severity' | 'source'
  order: 'asc' | 'desc'
}

interface LogTableProps {
  logs: Log[]
  sortBy: string
  order: string
  onSortChange: (sort: SortState) => void
  onRowClick: (id: number) => void
}

const SEVERITY_BADGE_CLASSES: Record<Severity, string> = {
  INFO: 'bg-blue-500 text-white',
  WARNING: 'bg-yellow-500 text-white',
  ERROR: 'bg-orange-500 text-white',
  CRITICAL: 'bg-red-600 text-white',
}

type SortableColumn = 'timestamp' | 'severity' | 'source'
const SORTABLE_COLUMNS: SortableColumn[] = ['timestamp', 'severity', 'source']

function SortIcon({ column, sortBy, order }: { column: string; sortBy: string; order: string }) {
  if (sortBy !== column) return <span className="ml-1 text-muted-foreground opacity-50">↕</span>
  return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
}

export function LogTable({ logs, sortBy, order, onSortChange, onRowClick }: LogTableProps) {
  function handleSortClick(column: SortableColumn) {
    if (sortBy === column) {
      onSortChange({ sort_by: column, order: order === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ sort_by: column, order: 'asc' })
    }
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border" data-testid="log-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">id</th>
              {SORTABLE_COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium">
                  <button
                    type="button"
                    onClick={() => handleSortClick(col)}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    {col}
                    <SortIcon column={col} sortBy={sortBy} order={order} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium">message</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground" data-testid="log-table-empty">
                No logs found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="rounded-md border" data-testid="log-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">id</th>
            {SORTABLE_COLUMNS.map((col) => (
              <th key={col} className="px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSortClick(col)}
                  className="flex items-center hover:text-primary transition-colors"
                  data-testid={`sort-${col}`}
                >
                  {col}
                  <SortIcon column={col} sortBy={sortBy} order={order} />
                </button>
              </th>
            ))}
            <th className="px-4 py-3 text-left font-medium">message</th>
            <th className="px-4 py-3 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log.id)}
              className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
              data-testid={`log-row-${log.id}`}
            >
              <td className="px-4 py-3 text-muted-foreground">{log.id}</td>
              <td className="px-4 py-3 whitespace-nowrap" data-testid={`log-timestamp-${log.id}`}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3" data-testid={`log-severity-${log.id}`}>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SEVERITY_BADGE_CLASSES[log.severity]}`}
                  data-testid={`severity-badge-${log.severity.toLowerCase()}`}
                >
                  {log.severity}
                </span>
              </td>
              <td className="px-4 py-3" data-testid={`log-source-${log.id}`}>
                {log.source}
              </td>
              <td className="px-4 py-3 max-w-xs truncate" data-testid={`log-message-${log.id}`}>
                {log.message}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRowClick(log.id)
                  }}
                  className="px-2 py-1 text-xs rounded border border-input hover:bg-accent transition-colors"
                  data-testid={`edit-btn-${log.id}`}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
