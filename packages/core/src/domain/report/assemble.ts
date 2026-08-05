// @sintera/core — Relatório (Camada de Comunicação, REL-001): COMPILAÇÃO FACTUAL dos dados que a pessoa
// registrou, para levar/enviar a um profissional. NÃO é laudo, diagnóstico nem parecer (RDC 657/2022): só
// reúne, filtra por período e ORGANIZA o que já existe. Puro/determinístico — sem React/Supabase/plataforma.
// Fonte ÚNICA da montagem (seleção + período + ordenação + rótulos): Web e Mobile consomem o mesmo modelo.
import { resolvePeriod, inPeriod, overlapsPeriod, periodLabel, type Period } from '../communication/period'
import { typeLabel, professionalKindLabel } from '../agenda/presentation'
import { isClosedStatus, type HealthEvent } from '../agenda/event'
import { contraceptiveLabel } from '../cycle'
import { DOMAIN_LABEL, type OmicsDomain } from '../omics/domains'
import { bodyMetricLabel } from '../body/metrics'
import type { BiomarkerSummary } from '../biomarkerGrouping'

// ── Entradas (espelham as tabelas; o api-client/página mapeia o banco para cá) ───────────────────────────────
export interface ReportMed { name: string; kind: string; dose: string | null; frequency: string | null; startedOn: string | null; untilOn: string | null; status: string }
export interface ReportExam { id: string; type: string; date: string; fileUrl?: string | null }
export interface ReportMeasure { metric: string; label: string | null; valueText: string; unit: string | null; date: string; examId?: string | null }
export interface ReportCondition { scope: string; name: string; relative: string | null; since: string | null; notes: string | null }
export interface ReportHabit { category: string; description: string; frequency: string | null; notes: string | null }
export interface ReportEyewear { kind: string; prescribedOn: string | null; prescriber: string | null; grauOD: string; grauOE: string }
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
  bioSummaries: BiomarkerSummary[]
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
}

// ── Modelo de saída ──────────────────────────────────────────────────────────────────────────────────────────
export interface ReportSectionOut { key: ReportSectionKey; heading: string; lines: string[] }
export interface ReportGroupOut { title: string; sections: ReportSectionOut[] }
export interface ReportModel { periodLabel: string; groups: ReportGroupOut[] }

const VITAL_METRICS = ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']
const isVital = (m: string) => VITAL_METRICS.includes(m)
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
  return `${head}${prof ? ` · ${prof}` : ''}`
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

  const sectionLines: Record<ReportSectionKey, string[]> = {
    eventos: agenda.map(eventLine),
    registros: historico.map(eventLine),
    histexames: data.bioSummaries.map(s => `${s.displayName}: ${s.latest ? `${s.latest.value}${s.unit ? ` ${s.unit}` : ''}` : '—'}${s.latest ? ` (${fmt(s.latest.date)})` : ''} · ${s.count} ${s.count === 1 ? 'medição' : 'medições'}`),
    medidas: measuresCorpo.map(m => `${fmt(m.date)} — ${m.metric === 'outro' ? (m.label ?? 'Medida') : bodyMetricLabel(m.metric)}: ${m.valueText}${m.unit ? ` ${m.unit}` : ''}`),
    sinais: measuresVitais.map(m => `${fmt(m.date)} — ${bodyMetricLabel(m.metric)}: ${m.valueText}${m.unit ? ` ${m.unit}` : ''}`),
    exames: exams.map(e => `${fmt(e.date)} — ${e.type}`),
    omica: omics.map(o => `${DOMAIN_LABEL[o.domain as OmicsDomain] ?? o.domain}${o.laboratory ? ` · ${o.laboratory}` : ''}${o.totalFeatures ? ` · ${o.totalFeatures} marcadores` : ''}${o.date ? ` (${fmt(o.date)})` : ''}`),
    condicoes: [
      ...condProprias.map(c => `${c.name}${c.since ? ` (desde ${c.since})` : ''}${c.notes ? ` — ${c.notes}` : ''}`),
      ...condFamiliar.map(c => `Familiar${c.relative ? ` (${c.relative})` : ''}: ${c.name}`),
    ],
    medicamentos: medsOut(false, 'medicamentos'),
    suplementos: medsOut(true, 'suplementos'),
    visao: data.eyewear.map(e => `${e.kind === 'lentes_contato' ? 'Lentes de contato' : 'Óculos'}${e.prescribedOn ? ` (${fmt(e.prescribedOn)})` : ''}${e.grauOD ? ` · OD: ${e.grauOD}` : ''}${e.grauOE ? ` · OE: ${e.grauOE}` : ''}`),
    habitos: data.habits.map(h => `${HABIT_LABEL[h.category] ?? h.category}: ${h.description}${h.frequency ? ` · ${h.frequency}` : ''}`),
    ciclo: [
      ...data.contraceptives.map(c => `${contraceptiveLabel(c.kind)}${c.brand ? ` (${c.brand})` : ''}${c.status !== 'ativo' ? ` — ${c.status}` : ''}${c.startedOn ? ` · desde ${fmt(c.startedOn)}` : ''}`),
      ...menstr.map(m => `Menstruação: ${fmt(m.startedOn)}${m.notes ? ` — ${m.notes}` : ''}`),
    ],
    gastos: expenses.map(x => `${fmt(x.date)} — ${x.title || typeLabel(x.type)}: ${fmtCents(x.amountCents)}`),
  }

  const groups: ReportGroupOut[] = REPORT_GROUPS.map(g => ({
    title: g.title,
    sections: g.items
      .filter(it => on(it.key) && sectionLines[it.key].length > 0)
      .map(it => ({ key: it.key, heading: it.label, lines: sectionLines[it.key] })),
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
