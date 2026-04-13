'use client'

import { useState } from 'react'
import type { AnalyticsFilters } from '@/hooks/useAnalytics'
import type { Severity } from '@/types/log'
import { SEVERITIES } from '@/constants/severity'
import { useSources } from '@/hooks/useSources'

interface FilterPanelProps {
  onApply: (filters: AnalyticsFilters) => void
}

export function FilterPanel({ onApply }: FilterPanelProps) {
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([])
  const [source, setSource] = useState<string>('')
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
      severities: selectedSeverities,
      source: source,
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-muted/30" data-testid="filter-panel">
      {/* Date Range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Start Date</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-sm"
          data-testid="filter-start"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">End Date</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-sm"
          data-testid="filter-end"
        />
      </div>

      {/* Severity multi-select */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Severity</label>
        <div className="flex gap-1 flex-wrap" data-testid="filter-severity">
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
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Source</label>
        <input
          type="text"
          list="dashboard-source-options"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Search by source..."
          className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[220px]"
          data-testid="filter-source"
        />
        <datalist id="dashboard-source-options">
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
        data-testid="filter-apply"
      >
        Apply
      </button>
    </div>
  )
}
