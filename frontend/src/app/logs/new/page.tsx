'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { createLog } from '@/lib/api'
import { LogForm, type LogFormValues } from '@/components/logs/LogForm'

export default function LogNewPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: LogFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      // A-04: timestamp が空ならキーごと除外（LogForm 側で処理済み）
      await createLog({
        severity: values.severity,
        source: values.source,
        message: values.message,
        ...(values.timestamp ? { timestamp: values.timestamp } : {}),
      })
      // A-08: キャッシュ invalidate
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      // A-05: 成功後 /logs へリダイレクト
      router.push('/logs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log')
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    router.push('/logs')
  }

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="log-new-page">
      {/* Back link */}
      <Link
        href="/logs"
        className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        data-testid="back-to-log-list"
      >
        ← Back to Log List
      </Link>

      <h1 className="text-2xl font-bold" data-testid="log-new-title">
        Create Log
      </h1>

      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="log-new-error"
        >
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <LogForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Create Log"
        />
      </div>
    </div>
  )
}