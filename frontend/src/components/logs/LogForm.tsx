'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Log, Severity } from '@/types/log'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SEVERITIES } from '@/constants/severity'
import { useSources } from '@/hooks/useSources'

// W-04: timestamp は省略可。空文字は許容する（送信時にキーから除外）
const logFormSchema = z.object({
  timestamp: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const, {
    error: 'Severity is required',
  }),
  source: z.string().min(1, 'Source is required'),
  message: z.string().min(1, 'Message is required'),
})

export type LogFormValues = z.infer<typeof logFormSchema>

interface LogFormProps {
  defaultValues?: Partial<Log>
  onSubmit: (data: LogFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function LogForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}: LogFormProps) {
  const { data: fetchedSources = [] } = useSources()
  // 編集時: 既存の source 値が取得済みリストになければ先頭に追加（データ整合性のため）
  const sources = fetchedSources.includes(defaultValues?.source ?? '')
    ? fetchedSources
    : [...(defaultValues?.source ? [defaultValues.source] : []), ...fetchedSources]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      timestamp: defaultValues?.timestamp ?? '',
      severity: defaultValues?.severity,
      source: defaultValues?.source ?? '',
      message: defaultValues?.message ?? '',
    },
  })

  function handleFormSubmit(values: LogFormValues) {
    // W-04: timestamp が空文字のときはキーごと除外
    const payload: LogFormValues = {
      severity: values.severity,
      source: values.source,
      message: values.message,
    }
    if (values.timestamp && values.timestamp.trim() !== '') {
      payload.timestamp = values.timestamp
    }
    onSubmit(payload)
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
      data-testid="log-form"
    >
      {/* Timestamp（省略可） */}
      <div className="flex flex-col gap-1">
        <label htmlFor="log-form-timestamp" className="text-sm font-medium">
          Timestamp <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input
          id="log-form-timestamp"
          type="datetime-local"
          {...register('timestamp')}
          data-testid="log-form-timestamp"
          disabled={isSubmitting}
        />
        {errors.timestamp && (
          <p className="text-sm text-red-500" data-testid="log-form-timestamp-error">
            {errors.timestamp.message}
          </p>
        )}
      </div>

      {/* Severity（必須） */}
      <div className="flex flex-col gap-1">
        <label htmlFor="log-form-severity" className="text-sm font-medium">
          Severity <span className="text-red-500">*</span>
        </label>
        <select
          id="log-form-severity"
          {...register('severity')}
          data-testid="log-form-severity"
          disabled={isSubmitting}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          defaultValue=""
        >
          <option value="" disabled>
            Select severity...
          </option>
          {SEVERITIES.map((sev) => (
            <option key={sev} value={sev}>
              {sev}
            </option>
          ))}
        </select>
        {errors.severity && (
          <p className="text-sm text-red-500" data-testid="log-form-severity-error">
            {errors.severity.message}
          </p>
        )}
      </div>

      {/* Source（必須） */}
      <div className="flex flex-col gap-1">
        <label htmlFor="log-form-source" className="text-sm font-medium">
          Source <span className="text-red-500">*</span>
        </label>
        <select
          id="log-form-source"
          {...register('source')}
          data-testid="log-form-source"
          disabled={isSubmitting}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
        >
          <option value="" disabled>Select source...</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.source && (
          <p className="text-sm text-red-500" data-testid="log-form-source-error">
            {errors.source.message}
          </p>
        )}
      </div>

      {/* Message（必須） */}
      <div className="flex flex-col gap-1">
        <label htmlFor="log-form-message" className="text-sm font-medium">
          Message <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="log-form-message"
          placeholder="Log message..."
          {...register('message')}
          data-testid="log-form-message"
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-sm text-red-500" data-testid="log-form-message-error">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-1.5 rounded border border-input bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          data-testid="log-form-cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          data-testid="log-form-submit"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}