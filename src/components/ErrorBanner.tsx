'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

// Banner de erro dismissível PADRÃO (Design System). Mesmo visual/comportamento em
// todos os módulos — substitui os banners vermelhos reimplementados à mão.
// `message` falsy → não renderiza (uso: <ErrorBanner message={err} onDismiss={() => setErr(null)} />).
export default function ErrorBanner({ message, onDismiss }: { message?: ReactNode; onDismiss?: () => void }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="font-body text-xs text-red-600 leading-relaxed break-words">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Fechar"
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={14} /></button>
      )}
    </div>
  )
}
