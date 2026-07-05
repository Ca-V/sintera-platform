'use client'

import type { ReactNode } from 'react'

// Cabeçalho de página PADRÃO (Design System). Hierarquia fixa:
//   eyebrow (ícone + rótulo) · Título (h1) · Subtítulo (LARGURA TOTAL) · ação
// Mobile-first: no celular o título e a ação empilham e o subtítulo ocupa toda a
// largura útil (menos linhas, menos altura); no desktop, título e ação lado a lado.
export default function PageHeader({ icon, eyebrow, title, subtitle, action }: {
  icon?: ReactNode
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="space-y-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          {(icon || eyebrow) && (
            <div className="inline-flex items-center gap-1.5 text-petal mb-2">
              {icon}
              {eyebrow && <span className="font-body text-xs font-medium uppercase tracking-wider">{eyebrow}</span>}
            </div>
          )}
          <h1 className="font-display text-2xl font-semibold text-onyx break-words">{title}</h1>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {subtitle != null && <p className="font-body text-sm text-mauve leading-relaxed">{subtitle}</p>}
    </header>
  )
}
