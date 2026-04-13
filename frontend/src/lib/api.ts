import type {
  Log,
  LogCreate,
  LogUpdate,
  LogListResponse,
  LogListParams,
  AnalyticsSummaryResponse,
  AnalyticsTimeseriesResponse,
  AnalyticsParams,
} from '@/types/log'

// W-03: 末尾スラッシュなしを前提とする
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

/**
 * URLSearchParams を組み立てるヘルパー。
 * severity の複数指定（?severity=ERROR&severity=CRITICAL）に対応。
 */
export function buildSearchParams(
  params: Record<string, string | string[] | number | boolean | undefined | null>
): URLSearchParams {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item))
      }
    } else {
      searchParams.append(key, String(value))
    }
  }
  return searchParams
}

/**
 * HTTP エラーレスポンスを Error としてスローする。
 * セキュリティ上、サーバーの詳細メッセージはそのまま公開するのではなく
 * ステータスコードと共に最小限の情報のみを返す。
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody?.detail) {
        // FastAPI の 422 では detail が配列になる場合があるため、文字列・配列両方に対応
        if (typeof errorBody.detail === 'string') {
          errorMessage = errorBody.detail
        } else if (Array.isArray(errorBody.detail)) {
          errorMessage = `HTTP error ${response.status}: validation error`
        }
      }
    } catch {
      // JSON パース失敗時はステータスコードのみ使用
    }
    throw new Error(errorMessage)
  }
  return response.json() as Promise<T>
}

/** GET /logs — ログ一覧取得（フィルタ・ソート・ページネーション） */
export async function getLogs(params: LogListParams = {}): Promise<LogListResponse> {
  const { severity, ...rest } = params
  const rawParams: Record<string, string | string[] | number | boolean | undefined | null> = {
    ...rest,
  }
  if (severity !== undefined) {
    rawParams.severity = Array.isArray(severity) ? severity : [severity]
  }
  const qs = buildSearchParams(rawParams).toString()
  const url = qs ? `${BASE_URL}/logs?${qs}` : `${BASE_URL}/logs`
  const response = await fetch(url)
  return handleResponse<LogListResponse>(response)
}

/** GET /logs/{id} — ログ詳細取得 */
export async function getLog(id: number): Promise<Log> {
  const response = await fetch(`${BASE_URL}/logs/${id}`)
  return handleResponse<Log>(response)
}

/** POST /logs — ログ新規作成 */
export async function createLog(data: LogCreate): Promise<Log> {
  const response = await fetch(`${BASE_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Log>(response)
}

/** PATCH /logs/{id} — ログ部分更新 */
export async function updateLog(id: number, data: LogUpdate): Promise<Log> {
  const response = await fetch(`${BASE_URL}/logs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Log>(response)
}

/** DELETE /logs/{id} — ログ削除（204 No Content） */
export async function deleteLog(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/logs/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody?.detail) {
        errorMessage = String(errorBody.detail)
      }
    } catch {
      // JSON パース失敗時はステータスコードのみ使用
    }
    throw new Error(errorMessage)
  }
}

/** GET /logs/analytics/summary — severity 別サマリー・ヒストグラム */
export async function getAnalyticsSummary(
  params: AnalyticsParams = {}
): Promise<AnalyticsSummaryResponse> {
  const { severity, ...rest } = params
  const rawParams: Record<string, string | string[] | number | boolean | undefined | null> = {
    ...rest,
  }
  if (severity !== undefined) {
    rawParams.severity = Array.isArray(severity) ? severity : [severity]
  }
  const qs = buildSearchParams(rawParams).toString()
  const url = qs
    ? `${BASE_URL}/logs/analytics/summary?${qs}`
    : `${BASE_URL}/logs/analytics/summary`
  const response = await fetch(url)
  return handleResponse<AnalyticsSummaryResponse>(response)
}

/** GET /logs/analytics/timeseries — 時系列ログ件数トレンド */
export async function getAnalyticsTimeseries(
  params: AnalyticsParams = {}
): Promise<AnalyticsTimeseriesResponse> {
  const { severity, ...rest } = params
  const rawParams: Record<string, string | string[] | number | boolean | undefined | null> = {
    ...rest,
  }
  if (severity !== undefined) {
    rawParams.severity = Array.isArray(severity) ? severity : [severity]
  }
  const qs = buildSearchParams(rawParams).toString()
  const url = qs
    ? `${BASE_URL}/logs/analytics/timeseries?${qs}`
    : `${BASE_URL}/logs/analytics/timeseries`
  const response = await fetch(url)
  return handleResponse<AnalyticsTimeseriesResponse>(response)
}

/** GET /logs/sources — DB に存在する source 名の一覧を重複なし・昇順で取得 */
export async function getSources(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/logs/sources`)
  return handleResponse<string[]>(response)
}

/**
 * GET /logs/export/csv — CSV エクスポート URL 生成。
 * ブラウザ側でダウンロードリンクとして使用するため URL 文字列を返す。
 * セキュリティ上、この URL は同一オリジンの認証付きリクエストを想定する。
 */
export function exportLogsCSV(params: LogListParams = {}): string {
  const { severity, ...rest } = params
  const rawParams: Record<string, string | string[] | number | boolean | undefined | null> = {
    ...rest,
  }
  if (severity !== undefined) {
    rawParams.severity = Array.isArray(severity) ? severity : [severity]
  }
  const qs = buildSearchParams(rawParams).toString()
  return qs ? `${BASE_URL}/logs/export/csv?${qs}` : `${BASE_URL}/logs/export/csv`
}
