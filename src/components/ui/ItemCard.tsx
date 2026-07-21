'use client'

import { cn } from '@/lib/utils'
import { Badge, Button } from "@/lib/ui/ds"
import { clickableContainerProps, type ClickableCardProps } from '@/lib/ui/clickable'
import { type CardAction } from '@/lib/ui/action'
import { STATUS_BADGE, itemKindLabel, type ItemKind, type ItemStatus } from '@/lib/ui/item'
import {
  Pill, Leaf, Package, Watch, FlaskConical, HeartPulse, LayoutGrid, FileText,
  type LucideIcon,
} from 'lucide-react'

const KIND_ICON: Record<ItemKind, LucideIcon> = {
  medication: Pill,
  supplement: Leaf,
  product: Package,
  device: Watch,
  exam: FlaskConical,
  condition: HeartPulse,
  program: LayoutGrid,
  document: FileText,
}

interface ItemMeta {
  label: string
  value: string
}

interface ItemCardProps extends ClickableCardProps {
  kind: ItemKind
  title: string
  subtitle?: string
  status?: ItemStatus
  meta?: ItemMeta[]
  /** ação secundária explícita (ex.: → ActionForm) */
  action?: CardAction
  className?: string
}

/**
 * Card de item do Catálogo — MESMO componente parametrizado por `kind`
 * (medicamento ≡ dispositivo ≡ exame…). Apresentação pura.
 */
export default function ItemCard({ kind, title, subtitle, status, meta, onOpen, action, className }: ItemCardProps) {
  const Icon = KIND_ICON[kind]
  const clickable = Boolean(onOpen)
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-4',
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...clickableContainerProps(onOpen)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-mauve" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-body font-medium text-onyx">{title}</p>
              <p className="text-xs text-mauve">{subtitle ?? itemKindLabel(kind)}</p>
            </div>
            {status && <Badge tone={STATUS_BADGE[status].tone}>{STATUS_BADGE[status].label}</Badge>}
          </div>

          {meta && meta.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {meta.map((m) => (
                <div key={m.label} className="text-xs">
                  <dt className="inline text-mauve">{m.label}: </dt>
                  <dd className="inline text-onyx">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {action && (
        <div className="mt-3 flex justify-end">
          {action.href ? (
            <a href={action.href} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" type="button">{action.label}</Button>
            </a>
          ) : (
            <Button variant="ghost" size="sm" type="button" onClick={(e) => { e.stopPropagation(); action.onClick?.() }}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
