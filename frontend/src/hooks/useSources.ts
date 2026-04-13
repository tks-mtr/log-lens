import { useQuery } from '@tanstack/react-query'
import { getSources } from '@/lib/api'

/**
 * `GET /api/v1/logs/sources` から source 一覧を取得するフック。
 * 候補リストは変化が少ないため staleTime を長めに設定する。
 */
export function useSources() {
  return useQuery<string[], Error>({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: 5 * 60 * 1000, // 5分
  })
}
