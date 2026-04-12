import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LogFilterPanel } from './LogFilterPanel'

describe('LogFilterPanel', () => {
  // V-07: 正常系 — フィルタ変更後に Apply 押下で onApply コールバックが現在の入力値を引数として呼ばれる
  it('calls_onApply_with_current_filter_values_when_apply_is_clicked', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    // source を入力
    fireEvent.change(screen.getByTestId('log-filter-source'), {
      target: { value: 'api' },
    })

    // severity を選択
    fireEvent.click(screen.getByTestId('severity-toggle-ERROR'))

    // Apply ボタンを押す
    fireEvent.click(screen.getByTestId('log-filter-apply'))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'api',
        severity: ['ERROR'],
      })
    )
  })

  // V-08: 正常系 — + New Log ボタン押下で onNewLog コールバックが呼ばれる
  it('calls_onNewLog_when_new_log_button_is_clicked', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    fireEvent.click(screen.getByTestId('log-filter-new'))

    expect(onNewLog).toHaveBeenCalledTimes(1)
  })

  // V-09: 境界値 — 全フィールド空状態で Apply したとき onApply がデフォルト値（undefined）で呼ばれる
  it('calls_onApply_with_undefined_values_when_all_fields_are_empty', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    // 何も入力せず Apply
    fireEvent.click(screen.getByTestId('log-filter-apply'))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({
      start: undefined,
      end: undefined,
      severity: undefined,
      source: undefined,
    })
  })

  // 追加: Source プレースホルダーが「部分一致」であることを示す文言を含む（W-01）
  it('source_input_has_placeholder_indicating_partial_match', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    const sourceInput = screen.getByTestId('log-filter-source')
    expect(sourceInput).toHaveAttribute('placeholder', 'Search by source...')
  })

  // 追加: CSV ボタンが存在する
  it('renders_csv_download_button', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    expect(screen.getByTestId('log-filter-csv')).toBeInTheDocument()
    expect(screen.getByTestId('log-filter-csv')).toHaveTextContent('CSV')
  })

  // 追加: 複数 severity 選択で onApply に配列として渡される
  it('calls_onApply_with_multiple_severities_when_multiple_toggled', () => {
    const onApply = vi.fn()
    const onNewLog = vi.fn()

    render(<LogFilterPanel onApply={onApply} onNewLog={onNewLog} />)

    fireEvent.click(screen.getByTestId('severity-toggle-ERROR'))
    fireEvent.click(screen.getByTestId('severity-toggle-CRITICAL'))
    fireEvent.click(screen.getByTestId('log-filter-apply'))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: expect.arrayContaining(['ERROR', 'CRITICAL']),
      })
    )
  })
})