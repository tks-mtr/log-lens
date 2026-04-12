'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLog, updateLog, deleteLog } from '@/lib/api'
import { LogForm, type LogFormValues } from '@/components/logs/LogForm'
import { DeleteDialog } from '@/components/logs/DeleteDialog'
import type { Log } from '@/types/log'

export default function LogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const id = Number(params.id)

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: log, isLoading, isError, error } = useQuery<Log, Error>({
    queryKey: ['log', id],
    queryFn: () => getLog(id),
    enabled: !isNaN(id),
  })

  async function handleSave(values: LogFormValues) {
    setIsSubmitting(true)
    setActionError(null)
    try {
      await updateLog(id, values)
      // W-05: 楽観的更新なし。キャッシュを invalidate して最新データを取得
      await queryClient.invalidateQueries({ queryKey: ['log', id] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      setIsEditing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update log')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setActionError(null)
    try {
      // W-03: deleteLog は 204 No Content のため JSON パースしない
      await deleteLog(id)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      router.push('/logs')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete log')
      setDeleteDialogOpen(false)
      setIsDeleting(false)
    }
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setActionError(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6" data-testid="log-detail-loading">
        <Link
          href="/logs"
          className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          data-testid="back-to-log-list"
        >
          ← Back to Log List
        </Link>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !log) {
    return (
      <div className="flex flex-col gap-6 p-6" data-testid="log-detail-error">
        <Link
          href="/logs"
          className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          data-testid="back-to-log-list"
        >
          ← Back to Log List
        </Link>
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="log-detail-error-message"
        >
          {error?.message ?? 'Log not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="log-detail-page">
      {/* Back link */}
      <Link
        href="/logs"
        className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        data-testid="back-to-log-list"
      >
        ← Back to Log List
      </Link>

      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="log-detail-title">
          Log Detail
        </h1>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 rounded border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
              data-testid="log-detail-edit-btn"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="px-4 py-1.5 rounded bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              data-testid="log-detail-delete-btn"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Error message for actions */}
      {actionError && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid="log-detail-action-error"
        >
          {actionError}
        </div>
      )}

      {isEditing ? (
        /* Edit mode: inline form */
        <div className="rounded-xl border bg-card p-6" data-testid="log-detail-edit-form">
          <LogForm
            defaultValues={log}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={isSubmitting}
            submitLabel="Save"
          />
        </div>
      ) : (
        /* View mode: read-only fields */
        <div className="rounded-xl border bg-card p-6" data-testid="log-detail-view">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="font-medium text-muted-foreground">id</dt>
            <dd data-testid="log-detail-id">{log.id}</dd>

            <dt className="font-medium text-muted-foreground">timestamp</dt>
            <dd data-testid="log-detail-timestamp">{log.timestamp}</dd>

            <dt className="font-medium text-muted-foreground">severity</dt>
            <dd data-testid="log-detail-severity">{log.severity}</dd>

            <dt className="font-medium text-muted-foreground">source</dt>
            <dd data-testid="log-detail-source">{log.source}</dd>

            <dt className="font-medium text-muted-foreground">message</dt>
            <dd data-testid="log-detail-message" className="whitespace-pre-wrap break-words">
              {log.message}
            </dd>

            <dt className="font-medium text-muted-foreground">created_at</dt>
            <dd data-testid="log-detail-created-at">{log.created_at}</dd>

            <dt className="font-medium text-muted-foreground">updated_at</dt>
            <dd data-testid="log-detail-updated-at">{log.updated_at}</dd>
          </dl>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  )
}