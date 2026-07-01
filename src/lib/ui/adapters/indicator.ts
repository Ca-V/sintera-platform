// ============================================================
// Adapter — BiomarkerSummary (projeção real) → IndicatorViewProps
// ============================================================
// Camada "queries → props" da pirâmide. LÊ a projeção canônica (grouping.ts,
// view current_biomarkers) e mapeia para o contrato de apresentação. Puro e
// testável. Read-only — não escreve nada (Estado 2 congelado).
// Q1/Q2/Q3 têm dado real; Q4 (EventLink) e Q5 (próximo acompanhamento) ainda
// não — dependem do Estado 2 / Agenda, então saem vazios/factuais.
// ============================================================

import { fmtDayMonthYear, fmtMonthShortYear } from '../date'
import type { BiomarkerSummary } from '@/lib/biomarkers/grouping'
import type { ReferenceStatus } from '@/lib/ui/indicator'
import type { IndicatorViewProps } from '@/components/indicator/IndicatorView'

export function interpretationToStatus(interp: string | null | undefined): ReferenceStatus {
  if (interp === 'dentro_da_referencia') return 'within'
  if (interp === 'acima_da_referencia' || interp === 'abaixo_da_referencia') return 'outside'
  return 'unknown'
}

const TREND_READING: Record<string, { icon: 'down' | 'up' | 'flat'; text: string }> = {
  down: { icon: 'down', text: 'tendência de queda' },
  up: { icon: 'up', text: 'tendência de alta' },
  stable: { icon: 'flat', text: 'valores estáveis' },
  single: { icon: 'flat', text: 'medição única' },
  unit_mismatch: { icon: 'flat', text: 'unidades diferentes entre exames' },
}

/** Projeção real → contrato das 5 perguntas. Q4/Q5 vazios até o Estado 2. */
export function biomarkerToIndicatorView(s: BiomarkerSummary): IndicatorViewProps {
  const latest = s.latest
  const ms = s.measurements

  const readings: IndicatorViewProps['readings'] = []
  const t = TREND_READING[s.trend] ?? TREND_READING.single
  readings.push({ icon: t.icon, text: ms.length >= 2 ? `${t.text} nas últimas ${ms.length} medições` : t.text })
  if (s.totalDeltaPercent !== null) {
    readings.push({ icon: 'flat', text: `variação total de ${s.totalDeltaPercent > 0 ? '+' : ''}${s.totalDeltaPercent}% no período` })
  }
  const withRef = ms.filter((m) => m.interpretation === 'dentro_da_referencia' || m.interpretation === 'acima_da_referencia' || m.interpretation === 'abaixo_da_referencia')
  if (withRef.length > 0) {
    const within = withRef.filter((m) => m.interpretation === 'dentro_da_referencia').length
    readings.push({ icon: 'target', text: `${within} de ${withRef.length} medições dentro da referência` })
  }

  // linha de referência só quando o limite superior é constante em toda a série
  const refMaxs = ms.map((m) => m.referenceMax).filter((v): v is number => v !== null)
  const reference = refMaxs.length === ms.length && ms.length > 0 && new Set(refMaxs).size === 1 ? refMaxs[0] : undefined

  return {
    name: s.displayName,
    value: latest ? latest.value.toLocaleString('pt-BR') : '—',
    unit: s.unit || undefined,
    status: interpretationToStatus(latest?.interpretation),
    collectedAt: latest ? fmtDayMonthYear(latest.date) : '—',
    readings,
    series: ms.map((m) => ({ x: fmtMonthShortYear(m.date), y: m.value })),
    reference,
    influences: [], // EventLink = Estado 2 (ainda sem dado real)
    lastCollection: latest ? fmtDayMonthYear(latest.date) : '—',
    nextFollowUp: '—', // Agenda/Estado 2 (ainda sem dado real)
  }
}
