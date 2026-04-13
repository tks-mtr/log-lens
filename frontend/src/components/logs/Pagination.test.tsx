import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  // V-10: 正常系 — page=1, pages=5 のとき、Prev が無効・Next が有効・"Page 1 / 5" が表示される
  it('shows_prev_disabled_next_enabled_and_page_info_when_on_first_page', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={1}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    const prevBtn = screen.getByTestId('pagination-prev')
    const nextBtn = screen.getByTestId('pagination-next')
    const info = screen.getByTestId('pagination-info')

    expect(prevBtn).toBeDisabled()
    expect(nextBtn).not.toBeDisabled()
    expect(info).toHaveTextContent('Page 1 / 5')
  })

  // V-11: 正常系 — page=5, pages=5 のとき、Next が無効・Prev が有効である
  it('shows_next_disabled_prev_enabled_when_on_last_page', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={5}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    const prevBtn = screen.getByTestId('pagination-prev')
    const nextBtn = screen.getByTestId('pagination-next')

    expect(prevBtn).not.toBeDisabled()
    expect(nextBtn).toBeDisabled()
  })

  // V-12: 正常系 — Next ボタン押下で onPageChange(2) コールバックが呼ばれる
  it('calls_onPageChange_with_next_page_number_when_next_button_clicked', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={1}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    fireEvent.click(screen.getByTestId('pagination-next'))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  // V-13: 境界値 — pages=1 のとき Prev・Next の両方が無効化される
  it('disables_both_prev_and_next_buttons_when_only_one_page_exists', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={1}
        pages={1}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    expect(screen.getByTestId('pagination-prev')).toBeDisabled()
    expect(screen.getByTestId('pagination-next')).toBeDisabled()
  })

  // V-14: 正常系 — limit Select で値を変更すると onLimitChange コールバックが新しい値で呼ばれる
  it('calls_onLimitChange_with_new_value_when_limit_select_changes', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={1}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    fireEvent.change(screen.getByTestId('pagination-limit'), {
      target: { value: '25' },
    })

    expect(onLimitChange).toHaveBeenCalledWith(25)
  })

  // 追加: Prev ボタン押下で onPageChange(page-1) が呼ばれる
  it('calls_onPageChange_with_previous_page_number_when_prev_button_clicked', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={3}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    fireEvent.click(screen.getByTestId('pagination-prev'))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  // 追加: limit の選択肢に 200 が含まれる（W-06）
  it('includes_200_as_an_option_in_limit_select', () => {
    const onPageChange = vi.fn()
    const onLimitChange = vi.fn()

    render(
      <Pagination
        page={1}
        pages={5}
        limit={50}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    )

    const select = screen.getByTestId('pagination-limit')
    const options = Array.from(select.querySelectorAll('option')).map((opt) =>
      Number((opt as HTMLOptionElement).value)
    )

    expect(options).toContain(200)
    expect(Math.max(...options)).toBe(200)
  })
})