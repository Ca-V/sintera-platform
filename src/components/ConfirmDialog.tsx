'use client'

// Confirmação PRÓPRIA do app (não usa window.confirm). Motivo: o popup nativo
// bloqueia a thread principal e dispara aviso de INP (performance); este é um
// diálogo React não-bloqueante, estilizado e que funciona no mobile. Reutilizável
// em ações com consequência (concluir, reabrir, excluir…).

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-border p-5">
        {title && <p className="font-display text-base font-semibold text-onyx mb-1.5">{title}</p>}
        <p className="font-body text-sm text-onyx/80 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-mauve font-body text-sm hover:bg-ivory transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-xl gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
