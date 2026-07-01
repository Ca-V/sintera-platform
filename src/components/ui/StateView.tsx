'use client'

import { cn } from '@/lib/utils'
import Button from './Button'
import { stateSpec, type StateTone, type UIStateKind } from '@/lib/ui/states'
import { type CardAction } from '@/lib/ui/action'
import { type ReactNode } from 'react'

interface StateViewProps {
  kind: UIStateKind
  title: string
  message?: string
  primary?: CardAction
  secondary?: CardAction
  /** ícone opcional (o consumidor decide a fonte); cai no ponto de tom se ausente */
  icon?: ReactNode
  className?: string
}

const toneIcon: Record<StateTone, string> = {
  neutral: 'bg-ivory text-mauve',
  success: 'bg-sage-light text-sage',
  danger: 'bg-blush text-petal-dark',
  info: 'bg-lavender-light text-lavender',
}

function ActionButton({ action, variant }: { action: CardAction; variant: 'primary' | 'ghost' }) {
  const content = action.label
  if (action.href) {
    return (
      <a href={action.href} className="inline-flex">
        <Button variant={variant} size="sm" type="button">{content}</Button>
      </a>
    )
  }
  return (
    <Button variant={variant} size="sm" type="button" onClick={action.onClick}>{content}</Button>
  )
}

/**
 * Renderizador ÚNICO de estados de UI (Biblioteca de Estados).
 * Garante mesmo tom/comportamento para Empty/Loading/Processing/Success/
 * Error/Pending/Interrupted/Finished em toda a plataforma.
 */
export default function StateView({ kind, title, message, primary, secondary, icon, className }: StateViewProps) {
  const spec = stateSpec(kind)
  return (
    <div className={cn('flex items-start gap-3', className)} role={spec.tone === 'danger' ? 'alert' : undefined}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneIcon[spec.tone])} aria-hidden="true">
        {spec.busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon ?? <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body font-medium text-onyx">{title}</p>
        {message && <p className="mt-0.5 text-sm text-mauve">{message}</p>}
        {(primary || secondary) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {primary && <ActionButton action={primary} variant="primary" />}
            {secondary && <ActionButton action={secondary} variant="ghost" />}
          </div>
        )}
      </div>
    </div>
  )
}
