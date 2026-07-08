'use client'

// ============================================================
// ReportView — Relatório narrativo (composição real)
// ============================================================
// Começa pela pessoa (não pelos exames). Só organiza conhecimento existente —
// não interpreta nem diagnostica (RDC 657). Reutiliza ReportSection +
// EventCard + ItemCard + IndicatorSummaryCard/EvolutionCard + RelatedItems.
// ============================================================

import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ReportSection from '@/components/ui/ReportSection'
import EventCard from '@/components/ui/EventCard'
import ItemCard from '@/components/ui/ItemCard'
import IndicatorSummaryCard from '@/components/ui/IndicatorSummaryCard'
import IndicatorEvolutionCard, { type SeriesPoint } from '@/components/ui/IndicatorEvolutionCard'
import RelatedItems from '@/components/ui/RelatedItems'
import StateView from '@/components/ui/StateView'
import type { BlockState } from '@/components/dashboard/DashboardPriority'
import type { EventNature } from '@/lib/ui/event'
import type { ItemKind, ItemStatus } from '@/lib/ui/item'
import type { ReferenceStatus } from '@/lib/ui/indicator'
import type { RelatedItem } from '@/lib/ui/related'
import { Printer, Share2, Info } from 'lucide-react'

export interface ReportViewProps {
  cover: { name: string; period: string; generatedAt: string; objective: string }
  summary: { label: string; value: string }[]
  timeline: { nature: EventNature; title: string; when: string; context?: string }[]
  situation: { kind: ItemKind; title: string; subtitle?: string; status?: ItemStatus }[]
  evolution?: { name: string; value: string; unit?: string; status: ReferenceStatus; collectedAt: string; series: SeriesPoint[]; reference?: number }
  documents: RelatedItem[]
  attachments: { title: string; description?: string }[]
  /** estado por seção — cada uma resolve loading/erro isoladamente */
  summaryState?: BlockState
  timelineState?: BlockState
  evolutionState?: BlockState
  documentsState?: BlockState
  className?: string
}

function SectionState({ state, children }: { state: BlockState | undefined; children: React.ReactNode }) {
  if (state === 'loading') return <StateView kind="loading" title="Carregando…" />
  if (state === 'error') return <StateView kind="error" title="Não foi possível carregar esta seção" message="Tente novamente em instantes." />
  return <>{children}</>
}

export default function ReportView(props: ReportViewProps) {
  const { cover, summary, timeline, situation, evolution, documents, attachments,
    summaryState, timelineState, evolutionState, documentsState, className } = props
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-xl text-onyx">Relatório</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm"><Printer className="h-4 w-4" /> PDF</Button>
          <Button variant="primary" size="sm"><Share2 className="h-4 w-4" /> Compartilhar</Button>
        </div>
      </div>

      <p className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2 text-xs text-mauve">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        Este relatório organiza informações já registradas. Não interpreta nem diagnostica.
      </p>

      <ReportSection index={1} title="Capa">
        <p className="font-body font-medium text-onyx">{cover.name}</p>
        <p className="mt-1 text-sm text-mauve">período: {cover.period}</p>
        <p className="text-sm text-mauve">gerado em {cover.generatedAt}</p>
        <span className="mt-2 inline-block rounded-full bg-blush px-3 py-1 text-xs text-petal-dark">objetivo: {cover.objective}</span>
      </ReportSection>

      <ReportSection index={2} title="Resumo executivo">
        <SectionState state={summaryState}>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {summary.map((s) => (
              <div key={s.label} className="rounded-xl bg-cream p-3">
                <dd className="text-xl font-medium text-onyx">{s.value}</dd>
                <dt className="mt-0.5 text-xs text-mauve">{s.label}</dt>
              </div>
            ))}
          </dl>
        </SectionState>
      </ReportSection>

      <ReportSection index={3} title="Linha do tempo resumida">
        <SectionState state={timelineState}>
          {timeline.length > 0 ? (
            <div className="flex flex-col gap-3">
              {timeline.map((e, i) => (
                <EventCard key={i} nature={e.nature} title={e.title} when={e.when} context={e.context} />
              ))}
            </div>
          ) : <p className="text-sm text-mauve">Sem acontecimentos no período.</p>}
        </SectionState>
      </ReportSection>

      <ReportSection index={4} title="Situação atual">
        {situation.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {situation.map((it, i) => (
              <ItemCard key={i} kind={it.kind} title={it.title} subtitle={it.subtitle} status={it.status} />
            ))}
          </div>
        ) : <p className="text-sm text-mauve">Catálogo de condições, medicamentos e dispositivos ainda não disponível.</p>}
      </ReportSection>

      <ReportSection index={5} title="Evolução">
        <SectionState state={evolutionState}>
          {evolution ? (
            <div className="flex flex-col gap-3">
              <IndicatorSummaryCard name={evolution.name} value={evolution.value} unit={evolution.unit} status={evolution.status} collectedAt={evolution.collectedAt} />
              <IndicatorEvolutionCard series={evolution.series} reference={evolution.reference} />
            </div>
          ) : <p className="text-sm text-mauve">Sem indicadores com medições no período.</p>}
        </SectionState>
      </ReportSection>

      <ReportSection index={6} title="Documentos">
        <SectionState state={documentsState}>
          {documents.length > 0 ? (
            <RelatedItems items={documents} title="Documentos deste período" />
          ) : <p className="text-sm text-mauve">Nenhum documento no período.</p>}
        </SectionState>
      </ReportSection>

      <ReportSection index={7} title="Anexos" subtitle={`${attachments.length} arquivo(s)`} collapsible>
        <ul className="divide-y divide-border">
          {attachments.map((a, i) => (
            <li key={i} className="py-2 text-sm">
              <span className="text-onyx">{a.title}</span>
              {a.description && <span className="text-mauve"> · {a.description}</span>}
            </li>
          ))}
        </ul>
      </ReportSection>
    </div>
  )
}
