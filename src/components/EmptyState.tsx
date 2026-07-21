'use client'

import type { ReactNode } from 'react'

// Estado vazio PADRÃO (Design System): mesmo layout, ícone, espaçamento e botão
// em todas as páginas.
export default function EmptyState({ icon, title, message, action }: {
  icon: ReactNode
  title: string
  message?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="ds-card p-10 text-center">
      <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <h2 className="font-display text-lg font-semibold text-onyx mb-2">{title}</h2>
      {message != null && <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed mb-5">{message}</p>}
      {action}
    </div>
  )
}
