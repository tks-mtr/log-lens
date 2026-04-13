import { useQuery } from '@tanstack/react-query'
import { getLogs } from '@/lib/api'
import type { LogListParams, LogListResponse } from '@/types/log'

/**
 * `GET /api/v1/logs` を取得するフック。
 * queryKey にフィルタ・ソート・ページネーション状態をすべて含めることで、
 * いずれかの状態変化時に自動再フェッチされる。
 */
export function useLogs(params: LogListParams = {}) {
  return useQuery<LogListResponse, Error>({
    queryKey: ['logs', params],
    queryFn: () => getLogs(params),
  })
}