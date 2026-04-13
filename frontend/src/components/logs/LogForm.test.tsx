import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogForm } from './LogForm'
import type { Log } from '@/types/log'

vi.mock('@/hooks/useSources', () => ({
  useSources: () => ({ data: ['api-gateway', 'auth-service'] }),
}))

const MOCK_LOG: Log = {
  id: 1,
  timestamp: '2026-04-01T10:00:00Z',
  severity: 'INFO',
  source: 'api-server',
  message: 'Request received',
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
}

describe('LogForm', () => {
  // V-01: 正常系 — defaultValues なし（新規作成）で全フィールドが空でレンダリングされる
  it('renders_all_fields_empty_when_no_default_values_provided', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    expect(screen.getByTestId('log-form-timestamp')).toHaveValue('')
    expect(screen.getByTestId('log-form-severity')).toHaveValue('')
    expect(screen.getByTestId('log-form-source')).toHaveValue('')
    expect(screen.getByTestId('log-form-message')).toHaveValue('')
  })

  // V-02: 正常系 — defaultValues あり（編集）で各フィールドに値が初期表示される
  it('renders_fields_with_default_values_when_default_values_provided', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <LogForm
        defaultValues={MOCK_LOG}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    expect(screen.getByTestId('log-form-severity')).toHaveValue('INFO')
    expect(screen.getByTestId('log-form-source')).toHaveValue('api-server')
    expect(screen.getByTestId('log-form-message')).toHaveValue('Request received')
  })

  // V-03: 正常系 — severity で CRITICAL を選択し Submit すると onSubmit が { severity: "CRITICAL", ... } で呼ばれる
  it('calls_onSubmit_with_critical_severity_when_critical_is_selected_and_submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.selectOptions(screen.getByTestId('log-form-severity'), 'CRITICAL')
    await user.type(screen.getByTestId('log-form-source'), 'api-gateway')
    await user.type(screen.getByTestId('log-form-message'), 'test message')

    await user.click(screen.getByTestId('log-form-submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      const callArg = onSubmit.mock.calls[0][0]
      expect(callArg.severity).toBe('CRITICAL')
      expect(callArg.source).toBe('api-gateway')
      expect(callArg.message).toBe('test message')
    })
  })

  // V-04: 異常系 — source が空で Submit すると onSubmit は呼ばれず source フィールドのエラーが表示される
  it('shows_source_error_and_does_not_call_onSubmit_when_source_is_empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.selectOptions(screen.getByTestId('log-form-severity'), 'INFO')
    await user.type(screen.getByTestId('log-form-message'), 'test message')
    // source は未選択のまま

    await user.click(screen.getByTestId('log-form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('log-form-source-error')).toBeInTheDocument()
      expect(screen.getByTestId('log-form-source-error')).toHaveTextContent('Source is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // V-05: 異常系 — message が空で Submit すると onSubmit は呼ばれず message フィールドのエラーが表示される
  it('shows_message_error_and_does_not_call_onSubmit_when_message_is_empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.selectOptions(screen.getByTestId('log-form-severity'), 'WARNING')
    await user.type(screen.getByTestId('log-form-source'), 'api-gateway')
    // message は空のまま

    await user.click(screen.getByTestId('log-form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('log-form-message-error')).toBeInTheDocument()
      expect(screen.getByTestId('log-form-message-error')).toHaveTextContent('Message is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // V-06: 異常系 — severity が未選択で Submit すると onSubmit は呼ばれず severity フィールドのエラーが表示される
  it('shows_severity_error_and_does_not_call_onSubmit_when_severity_not_selected', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.type(screen.getByTestId('log-form-source'), 'api-gateway')
    await user.type(screen.getByTestId('log-form-message'), 'test message')
    // severity は選択しない

    await user.click(screen.getByTestId('log-form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('log-form-severity-error')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // V-07: 境界値 — timestamp が空文字でも Submit できる（必須でない）
  it('allows_submit_when_timestamp_is_empty_because_it_is_optional', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    // timestamp は入力しない
    await user.selectOptions(screen.getByTestId('log-form-severity'), 'ERROR')
    await user.type(screen.getByTestId('log-form-source'), 'auth-service')
    await user.type(screen.getByTestId('log-form-message'), 'test message')

    await user.click(screen.getByTestId('log-form-submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      const callArg = onSubmit.mock.calls[0][0]
      // W-04: timestamp は payload に含まれない
      expect(callArg.timestamp).toBeUndefined()
    })
  })

  // V-08: 正常系 — Cancel ボタン押下で onCancel コールバックが呼ばれる
  it('calls_onCancel_when_cancel_button_is_clicked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(<LogForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.click(screen.getByTestId('log-form-cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})