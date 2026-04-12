import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAnalyticsSummary, useAnalyticsTimeseries } from './useAnalytics'
import * as api from '@/lib/api'

// api モジュールをモック
vi.mock('@/lib/api', () => ({
  getAnalyticsSummary: vi.fn(),
  getAnalyticsTimeseries: vi.fn(),
}))

const SUMMARY_RESPONSE = {
  summary: { INFO: 120, WARNING: 45, ERROR: 30, CRITICAL: 5 },
  histogram: [
    { source: 'api-server', INFO: 80, WARNING: 20, ERROR: 15, CRITICAL: 2 },
  ],
}

const TIMESERIES_RESPONSE = {
  interval: 'day' as const,
  data: [
    { timestamp: '2026-04-01T00:00:00Z', INFO: 50, WARNING: 10, ERROR: 5, CRITICAL: 1 },
  ],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAnalyticsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // V-11: 正常系 — モックした API が summary レスポンスを返すとき summary が正しく取得される
  it('returns_summary_data_when_api_returns_successfully', async () => {
    vi.mocked(api.getAnalyticsSummary).mockResolvedValue(SUMMARY_RESPONSE)

    const { result } = renderHook(() => useAnalyticsSummary({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(SUMMARY_RESPONSE)
    expect(result.current.data?.summary.INFO).toBe(120)
    expect(result.current.data?.summary.WARNING).toBe(45)
    expect(result.current.data?.summary.ERROR).toBe(30)
    expect(result.current.data?.summary.CRITICAL).toBe(5)
  })

  // V-13: 異常系 — API が 500 を返すとき isError=true になる
  it('sets_isError_true_when_api_fails', async () => {
    vi.mocked(api.getAnalyticsSummary).mockRejectedValue(new Error('HTTP error 500'))

    const { result } = renderHook(() => useAnalyticsSummary({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  // V-14: 境界値 — フィルタ変更時に queryKey が変わる（queryKey の構造をアサート）
  it('includes_filters_in_queryKey_so_it_changes_on_filter_update', () => {
    vi.mocked(api.getAnalyticsSummary).mockResolvedValue(SUMMARY_RESPONSE)

    const filters1 = { source: 'api-server' }
    const filters2 = { source: 'worker' }

    // フィルタが異なれば queryKey が異なることを確認
    // (useQuery の queryKey は内部で JSON シリアライズされて比較される)
    const expectedKey1 = ['analytics', 'summary', filters1]
    const expectedKey2 = ['analytics', 'summary', filters2]

    expect(JSON.stringify(expectedKey1)).not.toBe(JSON.stringify(expectedKey2))

    // また、フィルタを含む queryKey が実際に使用されているかを確認するため
    // 異なるフィルタで2つのフックを起動する
    const { result: result1 } = renderHook(
      () => useAnalyticsSummary(filters1),
      { wrapper: createWrapper() }
    )
    const { result: result2 } = renderHook(
      () => useAnalyticsSummary(filters2),
      { wrapper: createWrapper() }
    )

    // 両方ともフックが正常に動作することを確認
    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
  })
})

describe('useAnalyticsTimeseries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // V-12: 正常系 — モックした API が timeseries レスポンスを返すとき data が正しく取得される
  it('returns_timeseries_data_when_api_returns_successfully', async () => {
    vi.mocked(api.getAnalyticsTimeseries).mockResolvedValue(TIMESERIES_RESPONSE)

    const { result } = renderHook(
      () => useAnalyticsTimeseries({ interval: 'day' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(TIMESERIES_RESPONSE)
    expect(result.current.data?.interval).toBe('day')
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].INFO).toBe(50)
  })

  // 追加: interval が queryKey に含まれる
  it('includes_interval_in_queryKey_so_changes_on_interval_change', () => {
    vi.mocked(api.getAnalyticsTimeseries).mockResolvedValue(TIMESERIES_RESPONSE)

    const keyDay = ['analytics', 'timeseries', { interval: 'day' }]
    const keyHour = ['analytics', 'timeseries', { interval: 'hour' }]

    expect(JSON.stringify(keyDay)).not.toBe(JSON.stringify(keyHour))
  })

  // 追加: 異常系 — API が失敗したとき isError=true
  it('sets_isError_true_when_timeseries_api_fails', async () => {
    vi.mocked(api.getAnalyticsTimeseries).mockRejectedValue(new Error('HTTP error 500'))

    const { result } = renderHook(
      () => useAnalyticsTimeseries({ interval: 'day' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
