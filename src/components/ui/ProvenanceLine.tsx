'use client'

// Linha de proveniência PADRÃO (DS-001), consumidora da camada `@/lib/provenance`.
// Renderiza "Origem: <fonte>" e, quando houver documento, o link "Ver documento
// original". Sem documento → só a origem (nunca link fictício). Reutilizável em
// Relatório, Histórico, Timeline, Exames, Medicamentos, Recursos e futuros KG/SRL/IA.

import { Paperclip } from 'lucide-react'
import { type Provenance, sourceLabel, hasDocument, documentUrl } from '@/lib/provenance'

export default function ProvenanceLine({ provenance, showOrigin = true, className = '' }: {
  provenance: Provenance
  /** false quando o contexto já deixa a origem óbvia (ex.: dentro da seção "Exames"). */
  showOrigin?: boolean
  className?: string
}) {
  const meta = [sourceLabel(provenance.kind), provenance.issuer, provenance.date].filter(Boolean).join(' · ')
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-body text-[11px] text-mauve/70 ${className}`}>
      {showOrigin && <span>Origem: {meta}</span>}
      {hasDocument(provenance) && (
        <a href={documentUrl(provenance) as string} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-petal hover:underline">
          <Paperclip size={11} /> Ver documento original
        </a>
      )}
    </span>
  )
}
