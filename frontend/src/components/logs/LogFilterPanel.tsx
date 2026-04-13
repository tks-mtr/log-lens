'use client'

import { useState } from 'react'
import type { Severity, LogListParams } from '@/types/log'
import { exportLogsCSV } from '@/lib/api'
import { SEVERITIES } from '@/constants/severity'
import { useSources } from '@/hooks/useSources'

export interface LogFilterValues {
  start?: string
  end?: string
  severity?: Severity[]
  source?: string
}

interface LogFilterPanelProps {
  onApply: (filters: LogFilterValues) => void
  onNewLog: () => void
  currentFilters?: LogFilterValues
}

export function LogFilterPanel({ onApply, onNewLog, currentFilters = {} }: LogFilterPanelProps) {
  const [start, setStart] = useState<string>(currentFilters.start ?? '')
  const [end, setEnd] = useState<string>(currentFilters.end ?? '')
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>(
    currentFilters.severity ?? []
  )
  const [source, setSource] = useState<string>(currentFilters.source ?? '')
  const { data: sources = [] } = useSources()

  function toggleSeverity(sev: Severity) {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    )
  }

  function handleApply() {
    onApply({
      start: start || undefined,
      end: end || undefined,
      severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
      source: source || undefined,
    })
  }

  function handleCSVDownload() {
    // W-03: fetch ではなく <a> タグの download 属性でダウンロード
    const params: LogListParams = {
      start: start || undefined,
      end: end || undefined,
      severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
      source: source || undefined,
    }
    const url = exportLogsCSV(params)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logs.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-muted/30" data-testid="log-filter-panel">
      {/* Date Range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Start Date</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-sm"
          data-testid="log-filter-start"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">End Date</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-sm"
          data-testid="log-filter-end"
        />
      </div>

      {/* Severity multi-select */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Severity</label>
        <div className="flex gap-1 flex-wrap" data-testid="log-filter-severity">
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => toggleSeverity(sev)}
              aria-pressed={selectedSeverities.includes(sev)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                selectedSeverities.includes(sev)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input text-muted-foreground hover:bg-accent'
              }`}
              data-testid={`severity-toggle-${sev}`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Source — W-01: 部分一致。datalist で候補を表示しつつ自由入力も許容 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Source</label>
        <input
          type="text"
          list="source-options"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Search by source..."
          className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[220px]"
          data-testid="log-filter-source"
        />
        <datalist id="source-options">
          {sources.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      {/* Apply */}
      <button
        type="button"
        onClick={handleApply}
        className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        data-testid="log-filter-apply"
      >
        Apply
      </button>

      {/* CSV ダウンロード — W-03: <a> タグ方式 */}
      <button
        type="button"
        onClick={handleCSVDownload}
        className="px-4 py-1.5 rounded border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
        data-testid="log-filter-csv"
      >
        CSV
      </button>

      {/* + New Log */}
      <button
        type="button"
        onClick={onNewLog}
        className="px-4 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        data-testid="log-filter-new"
      >
        + New Log
      </button>
    </div>
  )
}
