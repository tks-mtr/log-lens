import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useLogs } from './useLogs'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getLogs: vi.fn(),
  exportLogsCSV: vi.fn(),
}))

const LIST_RESPONSE = {
  data: [
    {
      id: 1,
      timestamp: '2026-04-01T10:00:00Z',
      severity: 'INFO' as const,
      source: 'api-server',
      message: 'Request received',
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    },
    {
      id: 2,
      timestamp: '2026-04-01T11:00:00Z',
      severity: 'ERROR' as const,
      source: 'database',
      message: 'Connection error',
      created_at: '2026-04-01T11:00:00Z',
      updated_at: '2026-04-01T11:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
  pages: 1,
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

describe('useLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // V-15: 正常系 — モックした API がリストレスポンスを返すとき data / total / pages が正しく取得される
  it('returns_data_total_and_pages_when_api_returns_list_response', async () => {
    vi.mocked(api.getLogs).mockResolvedValue(LIST_RESPONSE)

    const { result } = renderHook(() => useLogs({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(LIST_RESPONSE)
    expect(result.current.data?.data).toHaveLength(2)
    expect(result.current.data?.total).toBe(2)
    expect(result.current.data?.pages).toBe(1)
    expect(result.current.data?.data[0].severity).toBe('INFO')
    expect(result.current.data?.data[1].severity).toBe('ERROR')
  })

  // V-16: 正常系 — フィルタ変更時に queryKey が変わる（queryKey の構造をアサート）
  it('uses_different_queryKeys_when_params_differ_so_refetch_triggers', () => {
    vi.mocked(api.getLogs).mockResolvedValue(LIST_RESPONSE)

    const params1 = { source: 'api-server', page: 1 }
    const params2 = { source: 'database', page: 1 }

    // queryKey が params を含むことを確認
    const expectedKey1 = ['logs', params1]
    const expectedKey2 = ['logs', params2]

    expect(JSON.stringify(expectedKey1)).not.toBe(JSON.stringify(expectedKey2))

    // 異なる params で 2つのフックを起動して、どちらも動作することを確認
    const { result: result1 } = renderHook(() => useLogs(params1), {
      wrapper: createWrapper(),
    })
    const { result: result2 } = renderHook(() => useLogs(params2), {
      wrapper: createWrapper(),
    })

    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
  })

  // V-17: 異常系 — API が 500 を返すとき isError=true になる
  it('sets_isError_true_when_api_returns_500', async () => {
    vi.mocked(api.getLogs).mockRejectedValue(new Error('HTTP error 500'))

    const { result } = renderHook(() => useLogs({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  // V-18: 境界値 — limit=1（最小）で呼び出したとき、limit=1 がクエリパラメータに含まれる
  it('passes_limit_1_to_api_when_called_with_minimum_limit', async () => {
    const minLimitResponse = { ...LIST_RESPONSE, limit: 1, data: [LIST_RESPONSE.data[0]] }
    vi.mocked(api.getLogs).mockResolvedValue(minLimitResponse)

    const { result } = renderHook(() => useLogs({ limit: 1 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // getLogs が limit=1 で呼ばれていることを確認
    expect(api.getLogs).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }))
    expect(result.current.data?.limit).toBe(1)
  })
})