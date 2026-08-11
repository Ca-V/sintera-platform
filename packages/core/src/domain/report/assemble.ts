// @sintera/core — Relatório (Camada de Comunicação, REL-001): COMPILAÇÃO FACTUAL dos dados que a pessoa
// registrou, para levar/enviar a um profissional. NÃO é laudo, diagnóstico nem parecer (RDC 657/2022): só
// reúne, filtra por período e ORGANIZA o que já existe. Puro/determinístico — sem React/Supabase/plataforma.
// Fonte ÚNICA da montagem (seleção + período + ordenação + rótulos): Web e Mobile consomem o mesmo modelo.
import { resolvePeriod, inPeriod, overlapsPeriod, periodLabel, type Period } from '../communication/period'
import { typeLabel, professionalKindLabel } from '../agenda/presentation'
import { isClosedStatus, type HealthEvent } from '../agenda/event'
import { contraceptiveLabel } from '../cycle'
import { DOMAIN_LABEL, type OmicsDomain } from '../omics/domains'
import { bodyMetricLabel, isVital } from '../body/metrics'
import { currentSummary, type SummaryPoint } from '../body/summary'
import { summarizeBiomarkers, examDate, type BiomarkerSummary, type BiomarkerRow } from '../biomarkerGrouping'

// ── Entradas (espelham as tabelas; o api-client/página mapeia o banco para cá) ───────────────────────────────
export interface ReportMed { name: string; kind: string; dose: string | null; frequency: string | null; startedOn: string | null; untilOn: string | null; status: string }
export interface ReportExam { id: string; type: string; date: string; fileUrl?: string | null }
export interface ReportMeasure { metric: string; label: string | null; valueText: string; unit: string | null; date: string; examId?: string | null }
export interface ReportCondition { scope: string; name: string; relative: string | null; since: string | null; notes: string | null }
export interface ReportHabit { category: string; description: string; frequency: string | null; notes: string | null }
export interface ReportEyewear { kind: string; prescribedOn: string | null; prescriber: string | null; grauOD: string; grauOE: string; dnp: string | null; bc: string | null; dia: string | null }
export interface ReportOmics { domain: string; laboratory: string | null; totalFeatures: number | null; date: string | null }
export interface ReportContraceptive { kind: string; brand: string | null; startedOn: string | null; replaceOn: string | null; status: string }
export interface ReportMenstruation { startedOn: string; notes: string | null }

export interface ReportData {
  meds: ReportMed[]
  events: HealthEvent[]
  exams: ReportExam[]
  measures: ReportMeasure[]
  conditions: ReportCondition[]
  habits: ReportHabit[]
  eyewear: ReportEyewear[]
  omics: ReportOmics[]
  contraceptives: ReportContraceptive[]
  menstruations: ReportMenstruation[]
  expenses: HealthEvent[]
  /** Biomarcadores CRUS (view current_biomarkers). O Histórico de Exames os resume DENTRO do período
   *  selecionado (assembleReport chama summarizeBiomarkers já filtrado por data) — antes ignorava o período. */
  biomarkers: BiomarkerRow[]
  /** Altura (cm) do perfil — base do IMC calculado no resumo de Composição Corporal. */
  heightCm?: number | null
}

// ── Seleção (espelha a Sidebar / menu lateral — FB-010) ──────────────────────────────────────────────────────
export type ReportSectionKey =
  | 'eventos' | 'registros' | 'histexames' | 'medidas' | 'sinais'
  | 'exames' | 'omica'
  | 'condicoes' | 'medicamentos' | 'suplementos' | 'visao' | 'habitos' | 'ciclo'
  | 'gastos'

export const REPORT_SECTIONS: readonly ReportSectionKey[] = [
  'eventos', 'registros', 'histexames', 'medidas', 'sinais', 'exames', 'omica',
  'condicoes', 'medicamentos', 'suplementos', 'visao', 'habitos', 'ciclo', 'gastos',
] as const

/** Grupos e rótulos — mesma taxonomia/ordem da Sidebar. Qualquer mudança na Sidebar reflete aqui. */
export const REPORT_GROUPS: { title: string; items: { key: ReportSectionKey; label: string }[] }[] = [
  { title: 'Acompanhamento', items: [
    { key: 'eventos', label: 'Agenda' }, { key: 'registros', label: 'Histórico de Saúde' },
    { key: 'histexames', label: 'Histórico de Exames' }, { key: 'medidas', label: 'Composição Corporal' },
    { key: 'sinais', label: 'Monitoramento' },
  ] },
  { title: 'Documentos', items: [{ key: 'exames', label: 'Exames' }, { key: 'omica', label: 'Exames de ômica' }] },
  { title: 'Minha Saúde', items: [
    { key: 'condicoes', label: 'Condições de Saúde' }, { key: 'medicamentos', label: 'Medicamentos' },
    { key: 'suplementos', label: 'Suplementos' }, { key: 'visao', label: 'Recursos de Saúde' },
    { key: 'habitos', label: 'Hábitos' }, { key: 'ciclo', label: 'Ciclo e Contracepção' },
  ] },
  { title: 'Organização', items: [{ key: 'gastos', label: 'Despesas' }] },
]

export function defaultSections(): Record<ReportSectionKey, boolean> {
  return Object.fromEntries(REPORT_SECTIONS.map(k => [k, true])) as Record<ReportSectionKey, boolean>
}

export interface ReportSelection {
  sections: Record<ReportSectionKey, boolean>
  /** Itens desmarcados por seção (exames/medicamentos/suplementos por nome; eventos por tipo). */
  excluded?: Partial<Record<string, string[]>>
  period: Period
  /** Inclui seções SELECIONADAS mas vazias (com aviso "sem registros"), como faz a Web — sinaliza ao
   *  profissional que a seção foi considerada. Default false (omite seções vazias). */
  showEmpty?: boolean
}

// ── Modelo de saída ──────────────────────────────────────────────────────────────────────────────────────────
export interface ReportSectionOut { key: ReportSectionKey; heading: string; lines: string[] }
export interface ReportGroupOut { title: string; sections: ReportSectionOut[] }
export interface ReportModel { periodLabel: string; groups: ReportGroupOut[] }

const HABIT_LABEL: Record<string, string> = {
  atividade_fisica: 'Atividade física', sono: 'Sono', tabagismo: 'Tabagismo',
  alcool: 'Álcool', alimentacao: 'Alimentação', hidratacao: 'Hidratação', outro: 'Outro',
}

function fmt(date: string | null | undefined): string {
  if (!date) return '—'
  const [y, m, d] = date.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : '—'
}
function fmtCents(c: number | null | undefined): string {
  if (c == null) return '—'
  return (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function periodo(start: string | null, until: string | null): string {
  if (start && until) return ` (de ${fmt(start)} até ${fmt(until)})`
  if (start) return ` (desde ${fmt(start)})`
  if (until) return ` (até ${fmt(until)})`
  return ''
}
function medLine(m: ReportMed): string {
  const bits = [m.dose, m.frequency].filter(Boolean).join(' · ')
  return `${m.name}${bits ? ` — ${bits}` : ''}${m.status === 'suspenso' ? periodo(m.startedOn, m.untilOn) : (m.startedOn ? ` (desde ${fmt(m.startedOn)})` : '')}`
}
function eventLine(e: HealthEvent): string {
  const prof = professionalKindLabel(e.professionalKind)
  const head = `${fmt(e.date)} — ${typeLabel(e.type)}${e.title ? `: ${e.title}` : ''}`
  const cancel = e.status === 'cancelado' ? ' · cancelado' : ''
  const notes = e.notes?.trim() ? ` — ${e.notes.trim()}` : ''
  return `${head}${prof ? ` · ${prof}` : ''}${cancel}${notes}`
}
/** Posição do último valor na faixa de referência do laudo (factual — a faixa é a do documento). */
function rangeText(m: BiomarkerSummary['latest']): string {
  if (!m || m.value == null) return ''
  if (m.referenceMin != null && m.value < m.referenceMin) return ' · abaixo da faixa'
  if (m.referenceMax != null && m.value > m.referenceMax) return ' · acima da faixa'
  if (m.referenceMin != null || m.referenceMax != null) return ' · dentro da faixa'
  return ''
}
/** Tendência longitudinal entre as duas últimas medições (direção + %). */
function trendText(tr: BiomarkerSummary['trend'], delta: number | null): string {
  if (tr === 'up') return delta != null ? ` · ▲ +${delta}%` : ' · ▲'
  if (tr === 'down') return delta != null ? ` · ▼ ${delta}%` : ' · ▼'
  if (tr === 'stable') return delta != null ? ` · estável (${delta > 0 ? '+' : ''}${delta}%)` : ' · estável'
  if (tr === 'single') return ' · medição única'
  return ''
}

/** Monta o relatório factual aplicando seleção (seções + itens) e período. Determinístico (injete `now` p/ testes). */
export function assembleReport(data: ReportData, sel: ReportSelection, now?: Date): ReportModel {
  const rp = resolvePeriod(sel.period, now ?? new Date())
  const on = (k: ReportSectionKey) => sel.sections[k]
  const itemOn = (k: string, key: string) => !(sel.excluded?.[k]?.includes(key))

  const isSup = (m: ReportMed) => m.kind === 'suplemento'
  const emUso = data.meds.filter(m => m.status === 'em_uso')
  const susp = data.meds.filter(m => m.status === 'suspenso')

  // Medicamentos / Suplementos (em uso = estado atual; suspenso = sobreposição ao período).
  const medsOut = (sup: boolean, secKey: string): string[] => {
    const uso = emUso.filter(m => isSup(m) === sup && itemOn(secKey, m.name))
    const sp = susp.filter(m => isSup(m) === sup && itemOn(secKey, m.name) && overlapsPeriod(m.startedOn, m.untilOn, rp))
    return [...uso.map(medLine), ...sp.map(m => `${medLine(m)} — suspenso`)]
  }

  // Agenda × Histórico: mesmo evento, split por status (aberto = Agenda; fechado = Histórico). FB-016-1.
  const perEvents = data.events.filter(e => inPeriod(e.date, rp) && itemOn('eventos', e.type))
  const agenda = perEvents.filter(e => !isClosedStatus(e.status))
  const historico = perEvents.filter(e => isClosedStatus(e.status))

  const exams = data.exams.filter(e => itemOn('exames', `${e.type}__${e.date}`) && inPeriod(e.date, rp))
    .slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const measuresCorpo = data.measures.filter(m => !isVital(m.metric) && inPeriod(m.date, rp))
  const measuresVitais = data.measures.filter(m => isVital(m.metric) && inPeriod(m.date, rp))
  const omics = data.omics.filter(o => inPeriod(o.date, rp))
  const menstr = data.menstruations.filter(m => inPeriod(m.startedOn, rp))
  const expenses = data.expenses.filter(x => inPeriod(x.date, rp))
  const condProprias = data.conditions.filter(c => c.scope === 'propria')
  const condFamiliar = data.conditions.filter(c => c.scope === 'familiar')
  // Histórico de Exames = resumo LONGITUDINAL por indicador, DENTRO do período (corrige FB: antes ignorava o
  // período e mostrava tudo). Filtra as medições cruas por data e resume — latest/tendência/contagem passam a
  // refletir a janela escolhida, como as demais seções temporais.
  const bioSummaries = summarizeBiomarkers(data.biomarkers.filter(r => inPeriod(examDate(r), rp)))

  // Composição Corporal (resumo antropométrico): ÚLTIMO valor de cada indicador (não medida a medida) + IMC
  // calculado (peso ÷ altura², da altura do perfil). Espelha a Web (compilação = panorama, não série completa).
  const compSummary = currentSummary(measuresCorpo
    .map(m => ({ metric: m.metric, value: Number(String(m.valueText).replace(',', '.').replace(/[^\d.-]/g, '')), unit: m.unit, date: m.date, source: null }))
    .filter(p => Number.isFinite(p.value)) as SummaryPoint[])
  const latestPeso = compSummary['peso']?.value ?? null
  const imcVal = latestPeso != null && data.heightCm ? Math.round((latestPeso / Math.pow(data.heightCm / 100, 2)) * 10) / 10 : null
  const compOrder = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura', 'altura']
  const medidasLines = [
    ...compOrder.filter(m => compSummary[m]).map(m => `${bodyMetricLabel(m)}: ${compSummary[m].value}${compSummary[m].unit ? ` ${compSummary[m].unit}` : ''} (${fmt(compSummary[m].date)})`),
    ...(imcVal != null ? [`IMC: ${imcVal} kg/m² (calculado)`] : []),
  ]

  const sectionLines: Record<ReportSectionKey, string[]> = {
    eventos: agenda.map(eventLine),
    registros: historico.map(eventLine),
    histexames: bioSummaries.map(s => `${s.displayName}: ${s.latest ? `${s.latest.value}${s.latest.unit ? ` ${s.latest.unit}` : ''}` : '—'}${s.latest ? ` (${fmt(s.latest.date)})` : ''}${rangeText(s.latest)}${trendText(s.trend, s.deltaPercent)} · ${s.count} ${s.count === 1 ? 'medição' : 'medições'}`),
    medidas: medidasLines,
    sinais: measuresVitais.map(m => `${fmt(m.date)} — ${m.metric === 'outro_sinal' ? (m.label ?? 'Outro sinal') : bodyMetricLabel(m.metric)}: ${m.valueText}${m.unit ? ` ${m.unit}` : ''}`),
    exames: exams.map(e => `${fmt(e.date)} — ${e.type}`),
    omica: omics.map(o => `${DOMAIN_LABEL[o.domain as OmicsDomain] ?? o.domain}${o.laboratory ? ` · ${o.laboratory}` : ''}${o.totalFeatures ? ` · ${o.totalFeatures} marcadores` : ''}${o.date ? ` (${fmt(o.date)})` : ''}`),
    condicoes: [
      ...condProprias.map(c => `${c.name}${c.since ? ` (desde ${c.since})` : ''}${c.notes ? ` — ${c.notes}` : ''}`),
      ...condFamiliar.map(c => `Familiar${c.relative ? ` (${c.relative})` : ''}: ${c.name}${c.since ? ` (desde ${c.since})` : ''}${c.notes ? ` — ${c.notes}` : ''}`),
    ],
    medicamentos: medsOut(false, 'medicamentos'),
    suplementos: medsOut(true, 'suplementos'),
    visao: data.eyewear.map(e => {
      const extra = [e.dnp && `DNP ${e.dnp}`, e.bc && `BC ${e.bc}`, e.dia && `DIA ${e.dia}`].filter(Boolean).join(', ')
      return `${e.kind === 'lentes_contato' ? 'Lentes de contato' : 'Óculos'}${e.prescribedOn ? ` (${fmt(e.prescribedOn)})` : ''}${e.grauOD ? ` · OD: ${e.grauOD}` : ''}${e.grauOE ? ` · OE: ${e.grauOE}` : ''}${extra ? ` · ${extra}` : ''}${e.prescriber ? ` · ${e.prescriber}` : ''}`
    }),
    habitos: data.habits.map(h => `${HABIT_LABEL[h.category] ?? h.category}: ${h.description}${h.frequency ? ` · ${h.frequency}` : ''}${h.notes ? ` — ${h.notes}` : ''}`),
    ciclo: [
      ...data.contraceptives.map(c => `${contraceptiveLabel(c.kind)}${c.brand ? ` (${c.brand})` : ''}${c.status !== 'ativo' ? ` — ${c.status}` : ''}${c.startedOn ? ` · desde ${fmt(c.startedOn)}` : ''}${c.replaceOn ? ` · troca prevista ${fmt(c.replaceOn)}` : ''}`),
      ...menstr.map(m => `Menstruação: ${fmt(m.startedOn)}${m.notes ? ` — ${m.notes}` : ''}`),
    ],
    gastos: (() => {
      const lines = expenses.map(x => `${fmt(x.date)} — ${x.title || typeLabel(x.type)}: ${fmtCents(x.amountCents)}`)
      if (lines.length > 0) { const total = expenses.reduce((s, x) => s + (x.amountCents ?? 0), 0); lines.push(`Total: ${fmtCents(total)}`) }
      return lines
    })(),
  }

  const groups: ReportGroupOut[] = REPORT_GROUPS.map(g => ({
    title: g.title,
    sections: g.items
      .filter(it => on(it.key) && (sectionLines[it.key].length > 0 || sel.showEmpty))
      .map(it => ({ key: it.key, heading: it.label, lines: sectionLines[it.key].length > 0 ? sectionLines[it.key] : ['— sem registros no período'] })),
  })).filter(g => g.sections.length > 0)

  return { periodLabel: periodLabel(sel.period), groups }
}

/** Serializa o modelo para TEXTO simples (copiar / compartilhar). Cabeçalho opcional (nome/versão). */
export function serializeReportText(model: ReportModel, header?: { name?: string; title?: string }): string {
  const out: string[] = []
  if (header?.title) out.push(header.title)
  if (header?.name) out.push(header.name)
  out.push(`Período: ${model.periodLabel}`, '')
  for (const g of model.groups) {
    out.push(`━━ ${g.title.toUpperCase()} ━━`)
    for (const s of g.sections) {
      out.push(`  ${s.heading}`)
      for (const l of s.lines) out.push(`   • ${l}`)
    }
    out.push('')
  }
  out.push('Compilação factual de registros — não é laudo, diagnóstico nem parecer.')
  return out.join('\n')
}
