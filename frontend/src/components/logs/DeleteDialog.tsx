'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface DeleteDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ open, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <AlertDialogContent data-testid="delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="delete-dialog-title">
            Delete this log?
          </AlertDialogTitle>
          <AlertDialogDescription data-testid="delete-dialog-description">
            This action cannot be undone. The log will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* onOpenChange が閉じるときに onCancel を呼ぶので、ここでは onClick を設定しない */}
          <AlertDialogCancel
            data-testid="delete-dialog-cancel"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant="destructive"
            data-testid="delete-dialog-confirm"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}