import { useQuery } from '@tanstack/react-query'
import { getAnalyticsSummary, getAnalyticsTimeseries } from '@/lib/api'
import type { AnalyticsParams, AnalyticsSummaryResponse, AnalyticsTimeseriesResponse } from '@/types/log'

export interface AnalyticsFilters {
  start?: string
  end?: string
  severities?: string[]
  source?: string
}

function filtersToParams(filters: AnalyticsFilters): AnalyticsParams {
  return {
    start: filters.start,
    end: filters.end,
    severity:
      filters.severities && filters.severities.length > 0
        ? (filters.severities as AnalyticsParams['severity'])
        : undefined,
    source: filters.source || undefined,
  }
}

/**
 * `GET /logs/analytics/summary` を取得するフック。
 * queryKey にフィルタ状態を含めることで、フィルタ変更時に自動再フェッチされる。
 */
export function useAnalyticsSummary(filters: AnalyticsFilters = {}) {
  return useQuery<AnalyticsSummaryResponse, Error>({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => getAnalyticsSummary(filtersToParams(filters)),
  })
}

/**
 * `GET /logs/analytics/timeseries` を取得するフック。
 * queryKey にフィルタ・interval 状態を含めることで、変更時に自動再フェッチされる。
 */
export function useAnalyticsTimeseries(
  filters: AnalyticsFilters & { interval: 'hour' | 'day' | 'week' } = { interval: 'day' }
) {
  const { interval, ...rest } = filters
  return useQuery<AnalyticsTimeseriesResponse, Error>({
    queryKey: ['analytics', 'timeseries', { ...rest, interval }],
    queryFn: () =>
      getAnalyticsTimeseries({ ...filtersToParams(rest), interval }),
  })
}
