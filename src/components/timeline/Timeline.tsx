'use client'

// ============================================================
// Timeline — composição (narrativa, não audit log)
// ============================================================
// Reúne EventCard (mínimo) + RelatedItems (sob demanda) + agrupamento relativo.
// Apresentação: recebe eventos por props; estado local só de filtro (UI).
// Não acessa domínio/banco. Valida: EventCard em escala · RelatedItems explica
// relações · agrupamento temporal natural · história legível sem abrir detalhes.
// ============================================================

import { useState } from 'react'
import { cn } from '@/lib/utils'
import EventCard from '@/components/ui/EventCard'
import RelatedItems from '@/components/ui/RelatedItems'
import { groupByTime } from '@/lib/ui/timeGroup'
import type { EventNature } from '@/lib/ui/event'
import type { RelatedItem } from '@/lib/ui/related'
import { SlidersHorizontal } from 'lucide-react'

export interface TimelineEvent {
  iso: string
  nature: EventNature
  title: string
  when: string
  context?: string
  /** relação em linguagem natural (EventLink), aberta sob demanda */
  related?: RelatedItem[]
  onOpen?: () => void
}

type Filter = 'all' | EventNature

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'exam', label: 'Exames' },
  { id: 'purchase', label: 'Compras' },
  { id: 'consult', label: 'Consultas' },
  { id: 'document', label: 'Documentos' },
  { id: 'vaccine', label: 'Vacinas' },
]

export default function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = filter === 'all' ? events : events.filter((e) => e.nature === filter)
  const groups = groupByTime(visible, (e) => e.iso)

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* filtros leves */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              filter === f.id ? 'border-petal bg-blush text-petal-dark' : 'border-border bg-white text-mauve hover:bg-mist'
            )}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="ml-auto inline-flex items-center gap-1.5 text-xs text-mauve hover:text-petal">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros avançados
        </button>
      </div>

      {groups.length === 0 && (
        <p className="rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-mauve">
          Nenhum acontecimento neste filtro.
        </p>
      )}

      {/* grupos relativos, em fluxo narrativo */}
      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-mauve">{g.label}</h2>
          <ol className="relative flex flex-col gap-3 border-l border-border pl-4">
            {g.items.map((e, i) => (
              <li key={`${e.iso}-${i}`} className="relative">
                <span className="absolute -left-[1.30rem] top-5 h-2 w-2 rounded-full bg-border" aria-hidden="true" />
                <EventCard nature={e.nature} title={e.title} when={e.when} context={e.context} onOpen={e.onOpen} />
                {e.related && e.related.length > 0 && (
                  <div className="mt-2">
                    <RelatedItems items={e.related} title="Este acontecimento está relacionado a" collapsible />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
