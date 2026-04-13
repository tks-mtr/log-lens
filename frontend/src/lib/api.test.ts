import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLogs,
  getLog,
  createLog,
  updateLog,
  deleteLog,
  getAnalyticsSummary,
  getAnalyticsTimeseries,
  exportLogsCSV,
  getSources,
  buildSearchParams,
} from './api'
import type { Log, LogListResponse, AnalyticsSummaryResponse, AnalyticsTimeseriesResponse } from '@/types/log'

// ---- モックデータ ----
const mockLog: Log = {
  id: 1,
  timestamp: '2026-04-01T12:00:00Z',
  severity: 'ERROR',
  source: 'api-server',
  message: 'Connection timeout',
  created_at: '2026-04-01T12:00:01Z',
  updated_at: '2026-04-01T12:00:01Z',
}

const mockLogListResponse: LogListResponse = {
  data: [mockLog],
  total: 1,
  page: 1,
  limit: 50,
  pages: 1,
}

const mockSummaryResponse: AnalyticsSummaryResponse = {
  summary: { INFO: 120, WARNING: 45, ERROR: 30, CRITICAL: 5 },
  histogram: [
    { source: 'api-server', INFO: 80, WARNING: 20, ERROR: 15, CRITICAL: 2 },
  ],
}

const mockTimeseriesResponse: AnalyticsTimeseriesResponse = {
  interval: 'day',
  data: [
    { timestamp: '2026-04-01T00:00:00Z', INFO: 50, WARNING: 10, ERROR: 5, CRITICAL: 1 },
  ],
}

// ---- fetch モック ----
function createFetchMock(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ============================================================
// getLogs
// ============================================================
describe('getLogs', () => {
  it('test_getLogs_正常系_ページネーション付きレスポンスを返す', async () => {
    global.fetch = createFetchMock(200, mockLogListResponse)

    const result = await getLogs()

    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(50)
    expect(result.pages).toBe(1)
  })

  it('test_getLogs_クエリパラメータが正しくURLに付与される', async () => {
    global.fetch = createFetchMock(200, mockLogListResponse)

    await getLogs({ source: 'api-server', page: 2, limit: 20, sort_by: 'timestamp', order: 'asc' })

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('source=api-server')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('limit=20')
    expect(calledUrl).toContain('sort_by=timestamp')
    expect(calledUrl).toContain('order=asc')
  })

  it('test_getLogs_severityが複数の場合_クエリに複数パラメータが付与される', async () => {
    global.fetch = createFetchMock(200, mockLogListResponse)

    await getLogs({ severity: ['ERROR', 'CRITICAL'] })

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('severity=ERROR')
    expect(calledUrl).toContain('severity=CRITICAL')
  })

  it('test_getLogs_severityが単一の場合_クエリに1つのパラメータが付与される', async () => {
    global.fetch = createFetchMock(200, mockLogListResponse)

    await getLogs({ severity: 'INFO' })

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('severity=INFO')
  })

  it('test_getLogs_パラメータなし_クエリ文字列なしのURLを呼ぶ', async () => {
    global.fetch = createFetchMock(200, mockLogListResponse)

    await getLogs()

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).not.toContain('?')
    expect(calledUrl).toContain('/logs')
  })
})

// ============================================================
// getLog
// ============================================================
describe('getLog', () => {
  it('test_getLog_正常系_単一ログを返す', async () => {
    global.fetch = createFetchMock(200, mockLog)

    const result = await getLog(1)

    expect(result.id).toBe(1)
    expect(result.severity).toBe('ERROR')
    expect(result.source).toBe('api-server')
    expect(result.message).toBe('Connection timeout')
  })

  it('test_getLog_404_Errorをスローする', async () => {
    global.fetch = createFetchMock(404, { detail: 'Log not found' })

    await expect(getLog(9999)).rejects.toThrow('Log not found')
  })
})

// ============================================================
// createLog
// ============================================================
describe('createLog', () => {
  it('test_createLog_正常系_201でLogを返す', async () => {
    global.fetch = createFetchMock(201, mockLog)

    const result = await createLog({
      severity: 'ERROR',
      source: 'api-server',
      message: 'Connection timeout',
    })

    expect(result.id).toBe(1)
    expect(result.severity).toBe('ERROR')

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[1].method).toBe('POST')
    expect(JSON.parse(fetchCall[1].body as string).severity).toBe('ERROR')
  })

  it('test_createLog_422_Errorをスローする', async () => {
    global.fetch = createFetchMock(422, { detail: [{ msg: 'field required' }] })

    await expect(
      createLog({ severity: 'ERROR', source: '', message: '' })
    ).rejects.toThrow('HTTP error 422: validation error')
  })
})

// ============================================================
// updateLog
// ============================================================
describe('updateLog', () => {
  it('test_updateLog_正常系_PATCHで更新済みLogを返す', async () => {
    const updatedLog: Log = { ...mockLog, severity: 'CRITICAL', updated_at: '2026-04-01T13:00:00Z' }
    global.fetch = createFetchMock(200, updatedLog)

    const result = await updateLog(1, { severity: 'CRITICAL' })

    expect(result.severity).toBe('CRITICAL')
    expect(result.updated_at).toBe('2026-04-01T13:00:00Z')

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[1].method).toBe('PATCH')
    expect(JSON.parse(fetchCall[1].body as string).severity).toBe('CRITICAL')
  })

  it('test_updateLog_空ボディ_変更なしでLogを返す', async () => {
    global.fetch = createFetchMock(200, mockLog)

    const result = await updateLog(1, {})

    expect(result.id).toBe(1)
    expect(result.severity).toBe('ERROR')

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(fetchCall[1].body as string)).toEqual({})
  })
})

// ============================================================
// deleteLog
// ============================================================
describe('deleteLog', () => {
  it('test_deleteLog_正常系_204でvoidを返す', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    })

    const result = await deleteLog(1)

    expect(result).toBeUndefined()

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(fetchCall[1].method).toBe('DELETE')
  })

  it('test_deleteLog_存在しないID_Errorをスローする', async () => {
    global.fetch = createFetchMock(404, { detail: 'Log not found' })

    await expect(deleteLog(9999)).rejects.toThrow('Log not found')
  })
})

// ============================================================
// getAnalyticsSummary
// ============================================================
describe('getAnalyticsSummary', () => {
  it('test_getAnalyticsSummary_正常系_summaryとhistogramを返す', async () => {
    global.fetch = createFetchMock(200, mockSummaryResponse)

    const result = await getAnalyticsSummary()

    expect(result.summary.INFO).toBe(120)
    expect(result.summary.WARNING).toBe(45)
    expect(result.summary.ERROR).toBe(30)
    expect(result.summary.CRITICAL).toBe(5)
    expect(result.histogram).toHaveLength(1)
    expect(result.histogram[0].source).toBe('api-server')
  })

  it('test_getAnalyticsSummary_フィルタあり_クエリパラメータが付与される', async () => {
    global.fetch = createFetchMock(200, mockSummaryResponse)

    await getAnalyticsSummary({ severity: ['ERROR', 'CRITICAL'], source: 'api-server' })

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('severity=ERROR')
    expect(calledUrl).toContain('severity=CRITICAL')
    expect(calledUrl).toContain('source=api-server')
  })
})

// ============================================================
// getAnalyticsTimeseries
// ============================================================
describe('getAnalyticsTimeseries', () => {
  it('test_getAnalyticsTimeseries_正常系_intervalとdataを返す', async () => {
    global.fetch = createFetchMock(200, mockTimeseriesResponse)

    const result = await getAnalyticsTimeseries()

    expect(result.interval).toBe('day')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].INFO).toBe(50)
    expect(result.data[0].WARNING).toBe(10)
  })
})

// ============================================================
// exportLogsCSV
// ============================================================
describe('exportLogsCSV', () => {
  it('test_exportLogsCSV_正しいURLを生成する', () => {
    const url = exportLogsCSV({
      severity: ['ERROR', 'CRITICAL'],
      source: 'api-server',
      start: '2026-04-01T00:00:00Z',
    })

    expect(url).toContain('/logs/export/csv')
    expect(url).toContain('severity=ERROR')
    expect(url).toContain('severity=CRITICAL')
    expect(url).toContain('source=api-server')
    expect(url).toContain('start=')
  })

  it('test_exportLogsCSV_パラメータなし_クエリなしURLを返す', () => {
    const url = exportLogsCSV()

    expect(url).toContain('/logs/export/csv')
    expect(url).not.toContain('?')
  })
})

// ============================================================
// buildSearchParams
// ============================================================
describe('buildSearchParams', () => {
  it('test_buildSearchParams_配列値_複数同名パラメータを生成する', () => {
    const params = buildSearchParams({ severity: ['ERROR', 'CRITICAL'] })
    const str = params.toString()

    expect(str).toContain('severity=ERROR')
    expect(str).toContain('severity=CRITICAL')
  })

  it('test_buildSearchParams_undefinedやnull_URLに含まれない', () => {
    const params = buildSearchParams({ source: undefined, page: null, limit: 50 })
    const str = params.toString()

    expect(str).not.toContain('source')
    expect(str).not.toContain('null')
    expect(str).toContain('limit=50')
  })
})

// getSources
// ============================================================
describe('getSources', () => {
  it('test_getSources_正常系_source一覧を返す', async () => {
    const mockSources = ['api-gateway', 'auth-service']
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockSources), { status: 200 })
    )
    const result = await getSources()
    expect(result).toEqual(mockSources)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/logs/sources'))
  })

  it('test_getSources_異常系_HTTPエラーでErrorをスロー', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Server error' }), { status: 500 })
    )
    await expect(getSources()).rejects.toThrow('Server error')
  })
})
