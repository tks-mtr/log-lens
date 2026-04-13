// Severity 型
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

// Log エンティティ
export interface Log {
  id: number
  timestamp: string // ISO 8601
  severity: Severity
  source: string
  message: string
  created_at: string
  updated_at: string
}

// POST /logs リクエスト
export interface LogCreate {
  timestamp?: string
  severity: Severity
  source: string
  message: string
}

// PATCH /logs/{id} リクエスト（全フィールド省略可）
export interface LogUpdate {
  timestamp?: string
  severity?: Severity
  source?: string
  message?: string
}

// GET /logs レスポンス（ページネーション付き）
export interface LogListResponse {
  data: Log[]
  total: number
  page: number
  limit: number
  pages: number
}

// GET /logs クエリパラメータ
export interface LogListParams {
  start?: string
  end?: string
  severity?: Severity | Severity[]
  source?: string
  search?: string
  sort_by?: 'timestamp' | 'severity' | 'source'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// GET /logs/analytics/summary レスポンス
export interface AnalyticsSummaryResponse {
  summary: {
    INFO: number
    WARNING: number
    ERROR: number
    CRITICAL: number
  }
  histogram: HistogramEntry[]
}

export interface HistogramEntry {
  source: string
  INFO: number
  WARNING: number
  ERROR: number
  CRITICAL: number
}

// GET /logs/analytics/timeseries レスポンス
export interface AnalyticsTimeseriesResponse {
  interval: 'hour' | 'day' | 'week'
  data: TimeseriesEntry[]
}

export interface TimeseriesEntry {
  timestamp: string
  INFO: number
  WARNING: number
  ERROR: number
  CRITICAL: number
}

// 分析系クエリパラメータ
export interface AnalyticsParams {
  start?: string
  end?: string
  severity?: Severity | Severity[]
  source?: string
  interval?: 'hour' | 'day' | 'week'
}

// CreateLogInput / UpdateLogInput (alias for clarity)
export type CreateLogInput = LogCreate
export type UpdateLogInput = LogUpdate
