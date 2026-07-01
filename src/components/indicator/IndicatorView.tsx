'use client'

// ============================================================
// IndicatorView — contrato FORMAL das 5 perguntas
// ============================================================
// Qualquer indicador responde SEMPRE, nesta ordem:
//   1. Situação atual · 2. O que mudou? · 3. Evolução ·
//   4. O que influenciou? · 5. O que acontece depois?
// A estrutura de props É o contrato. Apresentação pura (dados por props).
// ============================================================

import { cn } from '@/lib/utils'
import IndicatorSummaryCard from '@/components/ui/IndicatorSummaryCard'
import IndicatorChangeCard, { type Reading } from '@/components/ui/IndicatorChangeCard'
import IndicatorEvolutionCard, { type SeriesPoint } from '@/components/ui/IndicatorEvolutionCard'
import RelatedItems from '@/components/ui/RelatedItems'
import type { ReferenceStatus } from '@/lib/ui/indicator'
import type { RelatedItem } from '@/lib/ui/related'
import { CalendarHeart } from 'lucide-react'

export interface IndicatorViewProps {
  name: string
  // Q1 — situação atual
  value: string
  unit?: string
  status: ReferenceStatus
  collectedAt: string
  // Q2 — o que mudou
  readings: Reading[]
  // Q3 — evolução
  series: SeriesPoint[]
  reference?: number
  // Q4 — o que influenciou (EventLink em linguagem natural)
  influences: RelatedItem[]
  // Q5 — o que acontece depois
  lastCollection: string
  nextFollowUp: string
  className?: string
}

function Q({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-mauve">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blush text-[11px] text-petal-dark">{n}</span>
        {label}
      </h2>
      {children}
    </section>
  )
}

export default function IndicatorView(props: IndicatorViewProps) {
  const { name, value, unit, status, collectedAt, readings, series, reference, influences, lastCollection, nextFollowUp, className } = props
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <Q n={1} label="Situação atual">
        <IndicatorSummaryCard name={name} value={value} unit={unit} status={status} collectedAt={collectedAt} />
      </Q>

      <Q n={2} label="O que mudou?">
        <IndicatorChangeCard readings={readings} />
      </Q>

      <Q n={3} label="Evolução">
        <IndicatorEvolutionCard series={series} reference={reference} />
      </Q>

      <Q n={4} label="O que influenciou?">
        {influences.length > 0 ? (
          <RelatedItems items={influences} title="Este indicador está relacionado a" collapsible />
        ) : (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm text-mauve">Sem relações registradas para este período.</p>
        )}
      </Q>

      {/* Q5 — ainda como texto (observar recorrência antes de promover a componente) */}
      <Q n={5} label="O que acontece depois?">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <CalendarHeart className="h-5 w-5 shrink-0 text-mauve" aria-hidden="true" />
          <div className="text-sm">
            <p className="text-mauve">última coleta · <span className="text-onyx">{lastCollection}</span></p>
            <p className="text-mauve">próximo acompanhamento previsto · <span className="text-onyx">{nextFollowUp}</span></p>
          </div>
        </div>
      </Q>
    </div>
  )
}
