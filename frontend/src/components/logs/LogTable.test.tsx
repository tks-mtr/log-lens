import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LogTable } from './LogTable'
import type { Log } from '@/types/log'

const MOCK_LOGS: Log[] = [
  {
    id: 1,
    timestamp: '2026-04-01T10:00:00Z',
    severity: 'INFO',
    source: 'api-server',
    message: 'Request received',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 2,
    timestamp: '2026-04-01T11:00:00Z',
    severity: 'WARNING',
    source: 'auth-service',
    message: 'Rate limit approaching',
    created_at: '2026-04-01T11:00:00Z',
    updated_at: '2026-04-01T11:00:00Z',
  },
  {
    id: 3,
    timestamp: '2026-04-01T12:00:00Z',
    severity: 'ERROR',
    source: 'database',
    message: 'Connection timeout',
    created_at: '2026-04-01T12:00:00Z',
    updated_at: '2026-04-01T12:00:00Z',
  },
  {
    id: 4,
    timestamp: '2026-04-01T13:00:00Z',
    severity: 'CRITICAL',
    source: 'payment',
    message: 'Payment service down',
    created_at: '2026-04-01T13:00:00Z',
    updated_at: '2026-04-01T13:00:00Z',
  },
]

describe('LogTable', () => {
  // V-01: 正常系 — ログデータ配列が渡されたとき、全行が id / timestamp / severity / source を含む形でレンダリングされる
  it('renders_all_log_rows_with_id_timestamp_severity_source_columns', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="timestamp"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    // 各行が表示されていること
    expect(screen.getByTestId('log-row-1')).toBeInTheDocument()
    expect(screen.getByTestId('log-row-2')).toBeInTheDocument()
    expect(screen.getByTestId('log-row-3')).toBeInTheDocument()
    expect(screen.getByTestId('log-row-4')).toBeInTheDocument()

    // source が表示されていること
    expect(screen.getByTestId('log-source-1')).toHaveTextContent('api-server')
    expect(screen.getByTestId('log-source-2')).toHaveTextContent('auth-service')
  })

  // V-02: 正常系 — severity Badge の色クラスが INFO / WARNING / ERROR / CRITICAL で正しく異なる（4パターン）
  it('renders_severity_badges_with_correct_color_classes_for_all_four_severities', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="timestamp"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    const infoBadge = screen.getByTestId('severity-badge-info')
    const warningBadge = screen.getByTestId('severity-badge-warning')
    const errorBadge = screen.getByTestId('severity-badge-error')
    const criticalBadge = screen.getByTestId('severity-badge-critical')

    expect(infoBadge).toHaveClass('bg-blue-500')
    expect(warningBadge).toHaveClass('bg-yellow-500')
    expect(errorBadge).toHaveClass('bg-orange-500')
    expect(criticalBadge).toHaveClass('bg-red-600')

    // 色クラスが互いに異なることを確認
    const classes = [
      infoBadge.className,
      warningBadge.className,
      errorBadge.className,
      criticalBadge.className,
    ]
    const uniqueClasses = new Set(classes)
    expect(uniqueClasses.size).toBe(4)
  })

  // V-03: 正常系 — timestamp 列ヘッダをクリックすると onSortChange コールバックが { sort_by: 'timestamp', order: 'asc' } で呼ばれる
  it('calls_onSortChange_with_timestamp_asc_when_timestamp_header_clicked_and_different_column', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="source"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    fireEvent.click(screen.getByTestId('sort-timestamp'))

    expect(onSortChange).toHaveBeenCalledTimes(1)
    expect(onSortChange).toHaveBeenCalledWith({ sort_by: 'timestamp', order: 'asc' })
  })

  // V-04: 正常系 — 同じ列ヘッダを再クリックすると order が asc → desc に反転する
  it('toggles_sort_order_from_asc_to_desc_when_same_column_header_clicked_again', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="timestamp"
        order="asc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    fireEvent.click(screen.getByTestId('sort-timestamp'))

    expect(onSortChange).toHaveBeenCalledWith({ sort_by: 'timestamp', order: 'desc' })
  })

  // V-05: 正常系 — 行クリックで onRowClick コールバックがログの id を引数として呼ばれる
  it('calls_onRowClick_with_log_id_when_row_is_clicked', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="timestamp"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    fireEvent.click(screen.getByTestId('log-row-1'))
    expect(onRowClick).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByTestId('log-row-3'))
    expect(onRowClick).toHaveBeenCalledWith(3)
  })

  // V-06: 境界値 — logs=[]（空配列）のとき空テーブル or "No data" メッセージが表示され、クラッシュしない
  it('renders_no_logs_found_message_when_logs_array_is_empty', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={[]}
        sortBy="timestamp"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    expect(screen.getByTestId('log-table-empty')).toBeInTheDocument()
    expect(screen.getByTestId('log-table-empty')).toHaveTextContent('No logs found.')
    // クラッシュしないことは、テストが完了することで確認
  })

  // 追加: Edit ボタンをクリックすると onRowClick が同一 id で呼ばれる
  it('calls_onRowClick_with_log_id_when_edit_button_is_clicked', () => {
    const onSortChange = vi.fn()
    const onRowClick = vi.fn()

    render(
      <LogTable
        logs={MOCK_LOGS}
        sortBy="timestamp"
        order="desc"
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />
    )

    fireEvent.click(screen.getByTestId('edit-btn-2'))
    expect(onRowClick).toHaveBeenCalledWith(2)
    // 行クリックハンドラが呼ばれないこと（stopPropagation）
    expect(onRowClick).toHaveBeenCalledTimes(1)
  })
})