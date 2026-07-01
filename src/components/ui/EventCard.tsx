'use client'

import { cn } from '@/lib/utils'
import { clickableContainerProps, type ClickableCardProps } from '@/lib/ui/clickable'
import { EVENT_NATURE, type EventNature, type EventTone } from '@/lib/ui/event'
import {
  ShoppingCart, FlaskConical, ArrowLeftRight, FileText, Stethoscope, Syringe, Circle,
  type LucideIcon,
} from 'lucide-react'

const NATURE_ICON: Record<EventNature, LucideIcon> = {
  purchase: ShoppingCart,
  exam: FlaskConical,
  operation: ArrowLeftRight,
  document: FileText,
  consult: Stethoscope,
  vaccine: Syringe,
  generic: Circle,
}

const TONE_NODE: Record<EventTone, string> = {
  accent: 'bg-lavender-light text-lavender',
  neutral: 'bg-ivory text-mauve',
  attention: 'bg-warm text-gold',
  positive: 'bg-sage-light text-sage',
}

interface EventCardProps extends ClickableCardProps {
  nature: EventNature
  title: string
  /** data já formatada para exibição (componente puro não formata domínio) */
  when?: string
  /** uma linha de contexto (ex.: "Metformina 850 mg") — nunca listas */
  context?: string
  className?: string
}

/**
 * Card de Evento — MÍNIMO por desígnio. Responde apenas quatro perguntas:
 * o que aconteceu? · quando? · em qual contexto? · o que posso fazer agora?
 * Relações, gráficos e listas ficam FORA (RelatedItems, sob demanda).
 * Reutilizado em Timeline · Histórico · drill-down. Nunca reordena.
 */
export default function EventCard({ nature, title, when, context, onOpen, className }: EventCardProps) {
  const Icon = NATURE_ICON[nature]
  const tone = EVENT_NATURE[nature].tone
  const clickable = Boolean(onOpen)
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-border bg-white p-4',
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
      {...clickableContainerProps(onOpen)}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONE_NODE[tone])} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 font-body font-medium text-onyx">{title}</p>
          {when && <span className="shrink-0 text-xs text-mauve">{when}</span>}
        </div>
        {context && <p className="mt-0.5 text-sm text-mauve">{context}</p>}
      </div>
    </div>
  )
}
