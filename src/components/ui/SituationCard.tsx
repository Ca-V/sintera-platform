'use client'

import { cn } from '@/lib/utils'
import Button from './Button'
import { clickableContainerProps, type ClickableCardProps } from '@/lib/ui/clickable'
import { type CardAction } from '@/lib/ui/action'
import { SITUATION_TONE, type SituationTone } from '@/lib/ui/situation'
import { AlertCircle, Info, CircleCheck, Clock, type LucideIcon } from 'lucide-react'

const TONE_ICON: Record<SituationTone, LucideIcon> = {
  attention: AlertCircle,
  information: Info,
  success: CircleCheck,
  processing: Info,
  pending: Clock,
}

interface SituationCardProps extends ClickableCardProps {
  tone: SituationTone
  title: string
  description?: string
  /** prazo/etiqueta curta opcional, ex.: "vence em 5 dias" */
  deadline?: string
  primaryAction?: CardAction
  secondaryAction?: CardAction
  className?: string
}

function ActionButton({ action, variant }: { action: CardAction; variant: 'primary' | 'ghost' }) {
  if (action.href) {
    return (
      <a href={action.href} className="inline-flex" onClick={(e) => e.stopPropagation()}>
        <Button variant={variant} size="sm" type="button">{action.label}</Button>
      </a>
    )
  }
  return (
    <Button variant={variant} size="sm" type="button" onClick={(e) => { e.stopPropagation(); action.onClick?.() }}>
      {action.label}
    </Button>
  )
}

/**
 * Card de SITUAÇÃO — um único componente, vários tons. Sempre com uma ação.
 * Usado em "Requer atenção", "Continuar", pendências de programa, etc.
 */
export default function SituationCard({ tone, title, description, deadline, primaryAction, secondaryAction, onOpen, className }: SituationCardProps) {
  const spec = SITUATION_TONE[tone]
  const Icon = TONE_ICON[tone]
  const clickable = Boolean(onOpen)
  const containerProps = clickable
    ? clickableContainerProps(onOpen)
    : tone === 'attention' ? { role: 'alert' as const } : {}
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-border bg-white p-4',
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
      {...containerProps}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', spec.node)} aria-hidden="true">
        {spec.busy
          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          : <Icon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 font-body font-medium text-onyx">{title}</p>
          {deadline && <span className="shrink-0 text-xs text-mauve">{deadline}</span>}
        </div>
        {description && <p className="mt-0.5 text-sm text-mauve">{description}</p>}
        {(primaryAction || secondaryAction) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
            {secondaryAction && <ActionButton action={secondaryAction} variant="ghost" />}
          </div>
        )}
      </div>
    </div>
  )
}
