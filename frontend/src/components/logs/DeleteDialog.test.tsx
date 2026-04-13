import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteDialog } from './DeleteDialog'

describe('DeleteDialog', () => {
  // V-09: 正常系 — open=true のとき確認ダイアログが表示される
  it('renders_delete_dialog_when_open_is_true', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <DeleteDialog open={true} onConfirm={onConfirm} onCancel={onCancel} />
    )

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('delete-dialog-title')).toBeInTheDocument()
    expect(screen.getByTestId('delete-dialog-description')).toBeInTheDocument()
    expect(screen.getByTestId('delete-dialog-cancel')).toBeInTheDocument()
    expect(screen.getByTestId('delete-dialog-confirm')).toBeInTheDocument()
  })

  // V-10: 正常系 — Delete ボタン押下で onConfirm コールバックが呼ばれる
  it('calls_onConfirm_when_delete_button_is_clicked', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <DeleteDialog open={true} onConfirm={onConfirm} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByTestId('delete-dialog-confirm'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  // V-11: 正常系 — Cancel ボタン押下でダイアログが閉じ onConfirm が呼ばれない
  it('calls_onCancel_and_does_not_call_onConfirm_when_cancel_button_is_clicked', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <DeleteDialog open={true} onConfirm={onConfirm} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByTestId('delete-dialog-cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // V-12: 境界値 — open=false のときダイアログが表示されない
  it('does_not_render_dialog_content_when_open_is_false', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <DeleteDialog open={false} onConfirm={onConfirm} onCancel={onCancel} />
    )

    // open=false のときダイアログのコンテンツはDOMに存在しない
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument()
  })
})