import { type ReactNode } from 'react'
import Card, { type CardProps } from './Card'

interface SectionProps extends Omit<CardProps, 'title'> {
  /** Título da seção (h2, fonte display). */
  title?: ReactNode
  /** Rótulo curto acima do título (petal, maiúsculas), alinhado ao PageHeader. */
  eyebrow?: string
  /** Ação à direita do cabeçalho (botão/link). */
  action?: ReactNode
  children?: ReactNode
}

// Section premium (Design System · TEMA B). Um Card com o cabeçalho padrão
// (eyebrow + título + ação), padronizando o padrão "painel com título" hoje
// reimplementado à mão em várias páginas. Hierarquia idêntica à do PageHeader.
export default function Section({ title, eyebrow, action, children, ...props }: SectionProps) {
  const hasHeader = title != null || eyebrow != null || action != null
  return (
    <Card {...props}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {eyebrow != null && (
              <p className="font-body text-xs font-medium uppercase tracking-wider text-petal mb-1">{eyebrow}</p>
            )}
            {title != null && (
              <h2 className="font-display text-lg font-semibold text-onyx break-words">{title}</h2>
            )}
          </div>
          {action != null && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  )
}
