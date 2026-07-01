// ============================================================
// EventCard — modelo de apresentação (sem domínio/Estado 2)
// ============================================================
// Card de Evento (acontecimento) para Timeline · Histórico · Relatório.
// A "natureza" é uma escolha de APRESENTAÇÃO (ícone/tom) — não o tipo de
// domínio. O consumidor traduz o evento de domínio para esta natureza.
// ============================================================

export type EventNature =
  | 'purchase'
  | 'exam'
  | 'operation'
  | 'document'
  | 'consult'
  | 'vaccine'
  | 'generic'

/** Tom do nó (cor/ícone) — mapeado à paleta no componente. */
export type EventTone = 'accent' | 'neutral' | 'attention' | 'positive'

export const EVENT_NATURE: Record<EventNature, { tone: EventTone; label: string }> = {
  purchase: { tone: 'accent', label: 'Compra' },
  exam: { tone: 'neutral', label: 'Exame' },
  operation: { tone: 'attention', label: 'Operação' },
  document: { tone: 'neutral', label: 'Documento' },
  consult: { tone: 'positive', label: 'Consulta' },
  vaccine: { tone: 'positive', label: 'Vacina' },
  generic: { tone: 'neutral', label: 'Evento' },
}

export const ALL_EVENT_NATURES = Object.keys(EVENT_NATURE) as EventNature[]
