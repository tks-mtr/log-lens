import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FilterPanel } from './FilterPanel'

describe('FilterPanel', () => {
  // V-08: 正常系 — Apply ボタン押下で onApply が現在の入力値を引数として呼ばれる
  it('calls_onApply_with_current_input_values_when_apply_clicked', () => {
    const onApply = vi.fn()
    render(<FilterPanel onApply={onApply} />)

    // Source 入力
    fireEvent.change(screen.getByTestId('filter-source'), {
      target: { value: 'api-server' },
    })
    // Apply ボタン
    fireEvent.click(screen.getByTestId('filter-apply'))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'api-server',
      })
    )
  })

  // V-09: 正常系 — Severity を選択して Apply すると選択値が onApply に渡される
  it('calls_onApply_with_selected_severities_when_severity_selected', () => {
    const onApply = vi.fn()
    render(<FilterPanel onApply={onApply} />)

    // ERROR を選択
    fireEvent.click(screen.getByRole('button', { name: 'ERROR' }))
    fireEvent.click(screen.getByTestId('filter-apply'))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        severities: expect.arrayContaining(['ERROR']),
      })
    )
  })

  // V-10: 境界値 — 全フィールド空状態で Apply したとき onApply がデフォルト値で呼ばれる
  it('calls_onApply_with_default_values_when_all_fields_empty', () => {
    const onApply = vi.fn()
    render(<FilterPanel onApply={onApply} />)

    fireEvent.click(screen.getByTestId('filter-apply'))

    expect(onApply).toHaveBeenCalledWith({
      start: undefined,
      end: undefined,
      severities: [],
      source: '',
    })
  })

  // 追加: Source プレースホルダーが "exact match" であることを確認 (C-09)
  it('has_exact_match_placeholder_for_source_input', () => {
    render(<FilterPanel onApply={vi.fn()} />)
    const sourceInput = screen.getByTestId('filter-source')
    expect(sourceInput).toHaveAttribute('placeholder', 'Enter source (exact match)...')
  })

  // 追加: Apply ボタンが存在することを確認 (C-07)
  it('renders_apply_button', () => {
    render(<FilterPanel onApply={vi.fn()} />)
    expect(screen.getByTestId('filter-apply')).toBeInTheDocument()
  })

  // 追加: 複数の severity を選択して Apply すると全て渡される
  it('calls_onApply_with_multiple_severities_when_multiple_selected', () => {
    const onApply = vi.fn()
    render(<FilterPanel onApply={onApply} />)

    fireEvent.click(screen.getByRole('button', { name: 'ERROR' }))
    fireEvent.click(screen.getByRole('button', { name: 'CRITICAL' }))
    fireEvent.click(screen.getByTestId('filter-apply'))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        severities: expect.arrayContaining(['ERROR', 'CRITICAL']),
      })
    )
    const callArg = onApply.mock.calls[0][0]
    expect(callArg.severities).toHaveLength(2)
  })
})
