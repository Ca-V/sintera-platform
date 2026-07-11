import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import Card, { type CardProps } from './Card'

interface SectionProps extends Omit<CardProps, 'title'> {
  /** Ícone do cabeçalho, renderizado numa caixa arredondada padrão. */
  icon?: ReactNode
  /** Classe de fundo da caixa do ícone (default bg-blush). Ex.: 'bg-blush'. */
  iconBox?: string
  /** Título do painel (h2 · font-body · semibold — padrão real dos painéis). */
  title?: ReactNode
  /** Ação à direita do cabeçalho (botão/link). */
  action?: ReactNode
  /** Classe aplicada ao corpo (ex.: 'space-y-3'), separada do cabeçalho. */
  bodyClassName?: string
  children?: ReactNode
}

// Section premium (Design System · TEMA B). Um Card com o cabeçalho PADRÃO dos
// painéis da SINTERA — [ícone em caixa] + título + ação — extraído do padrão real
// (ex.: Configurações). Padroniza o "painel com título" hoje reimplementado à mão.
// Container estático (herda o escopo do Card: sem polimorfismo/motion).
export default function Section({ icon, iconBox, title, action, bodyClassName, children, ...props }: SectionProps) {
  const hasHeader = icon != null || title != null || action != null
  return (
    <Card {...props}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon != null && (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBox ?? 'bg-blush')}>
                {icon}
              </div>
            )}
            {title != null && (
              <h2 className="font-body text-sm font-semibold text-onyx break-words min-w-0">{title}</h2>
            )}
          </div>
          {action != null && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {bodyClassName != null ? <div className={bodyClassName}>{children}</div> : children}
    </Card>
  )
}
