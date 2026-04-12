'use client'

import { useState } from 'react'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { TimeseriesChart } from '@/components/dashboard/TimeseriesChart'
import { Histogram } from '@/components/dashboard/Histogram'
import { FilterPanel } from '@/components/dashboard/FilterPanel'
import { useAnalyticsSummary, useAnalyticsTimeseries } from '@/hooks/useAnalytics'
import type { AnalyticsFilters } from '@/hooks/useAnalytics'
import type { Severity } from '@/types/log'

const SEVERITIES: Severity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']

export default function DashboardPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [interval, setInterval] = useState<'hour' | 'day' | 'week'>('day')

  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorObj,
  } = useAnalyticsSummary(filters)

  const {
    data: timeseriesData,
    isLoading: timeseriesLoading,
    isError: timeseriesError,
    error: timeseriesErrorObj,
  } = useAnalyticsTimeseries({ ...filters, interval })

  const isLoading = summaryLoading || timeseriesLoading
  const isError = summaryError || timeseriesError
  const errorMessage =
    (summaryErrorObj as Error | null)?.message ||
    (timeseriesErrorObj as Error | null)?.message ||
    'Failed to load data'

  function handleApply(newFilters: AnalyticsFilters) {
    setFilters(newFilters)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Filter Panel */}
      <FilterPanel onApply={handleApply} />

      {/* Error message */}
      {isError && (
        <div
          className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive text-sm"
          data-testid="error-message"
        >
          {errorMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? SEVERITIES.map((sev) => (
              <div
                key={sev}
                className="rounded-lg bg-muted animate-pulse h-24"
                data-testid={`skeleton-card-${sev.toLowerCase()}`}
              />
            ))
          : SEVERITIES.map((sev) => (
              <SummaryCard
                key={sev}
                severity={sev}
                count={summaryData?.summary[sev] ?? 0}
              />
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-card border border-border p-4">
          {isLoading ? (
            <div className="animate-pulse bg-muted rounded h-48" data-testid="skeleton-timeseries" />
          ) : (
            <TimeseriesChart
              data={timeseriesData?.data ?? []}
              interval={interval}
              onIntervalChange={setInterval}
            />
          )}
        </div>
        <div className="rounded-lg bg-card border border-border p-4">
          {isLoading ? (
            <div className="animate-pulse bg-muted rounded h-48" data-testid="skeleton-histogram" />
          ) : (
            <Histogram data={summaryData?.histogram ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
