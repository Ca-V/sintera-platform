'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

// Card de listagem UNIFICADO (padrão único em Agenda, Histórico, Medicamentos,
// Despesas). Mobile-first, altura mínima, hierarquia clara:
//   Linha 1: [ícone] Nome (dominante, no máx. 2 linhas, sem quebrar palavra) · trailing (valor/status)
//   Linha 2: meta (categoria • data • forma/dose) — secundária
//   Linha 3: chips compactos (opcional)
//   Linha 4: ações discretas, à direita (opcional)
// O nome usa break-words + line-clamp-2 (nunca break-all).

const TONES: Record<string, string> = {
  sage: 'text-petal bg-blush border-petal/20',
  petal: 'text-petal bg-blush border-petal/20',
  gold: 'text-gold bg-warm border-amber-200',
  mauve: 'text-mauve bg-mauve/10 border-mauve/20',
  neutral: 'text-mauve bg-black/[0.03] border-border',
}

export function CardChip({ tone = 'neutral', children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center font-body text-[11px] font-medium rounded-full px-1.5 py-0.5 border whitespace-nowrap ${TONES[tone] ?? TONES.neutral}`}>
      {children}
    </span>
  )
}

export default function ListCard({
  leading, title, titleHref, onTitleClick, trailing, meta, chips, actions, dim = false,
}: {
  leading?: ReactNode
  title: string
  titleHref?: string
  onTitleClick?: () => void
  trailing?: ReactNode
  meta?: ReactNode
  chips?: ReactNode
  actions?: ReactNode
  dim?: boolean
}) {
  const titleCls = 'font-body text-sm font-semibold text-onyx leading-snug break-words line-clamp-2 min-w-0 text-left'
  const titleEl = titleHref
    ? <Link href={titleHref} className={`${titleCls} hover:text-petal`}>{title}</Link>
    : onTitleClick
      ? <button type="button" onClick={onTitleClick} className={`${titleCls} hover:text-petal`}>{title}</button>
      : <p className={titleCls}>{title}</p>

  return (
    <div className={`card-premium p-3.5 ${dim ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2.5">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {titleEl}
            {trailing != null && <div className="flex-shrink-0">{trailing}</div>}
          </div>
          {meta != null && <div className="font-body text-[11px] text-mauve mt-0.5 break-words">{meta}</div>}
          {chips != null && <div className="flex flex-wrap items-center gap-1 mt-1.5">{chips}</div>}
          {actions != null && <div className="flex items-center justify-end gap-0.5 mt-1.5 -mr-1">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
