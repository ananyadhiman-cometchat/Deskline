import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      {description && (
        <div className="mb-6 flex gap-3 text-sm text-[var(--color-navy)] mt-2">
          {isDestructive && (
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-brand-red)]" />
          )}
          <p>{description}</p>
        </div>
      )}
      
      <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button 
          variant={isDestructive ? 'danger' : 'primary'} 
          onClick={onConfirm} 
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
