// BOD-001 área ⑤ — Marcos da Evolução. PURO/FACTUAL.
//
// INVARIANTE: marcos são PROJEÇÕES de domínios já existentes (Histórico de Saúde, Agenda, Medicamentos,
// Suplementos, Exames) — NÃO há tabela de marcos e NÃO se cria informação. Cada marco preserva rastreabilidade
// até o registro original (href). São anotações sobre os gráficos para CONTEXTUALIZAR a evolução (RDC 657: não
// interpreta; só posiciona no tempo fatos que a pessoa já registrou).

export type MilestoneCategory = 'medicamento' | 'suplemento' | 'avaliacao' | 'consulta'

export const MILESTONE_CATEGORIES: { key: MilestoneCategory; label: string; color: string }[] = [
  { key: 'medicamento', label: 'Medicamentos', color: '#1B7B85' },
  { key: 'suplemento', label: 'Suplementos', color: '#4CA37A' },
  { key: 'avaliacao', label: 'Avaliações', color: '#C4A06A' },
  { key: 'consulta', label: 'Consultas', color: '#8E86C9' },
]
export const MILESTONE_COLOR: Record<MilestoneCategory, string> =
  Object.fromEntries(MILESTONE_CATEGORIES.map(c => [c.key, c.color])) as Record<MilestoneCategory, string>

export interface Milestone {
  key: string
  date: string                 // ISO yyyy-mm-dd
  category: MilestoneCategory
  title: string
  href: string | null          // link ao registro de origem (rastreabilidade)
}

// ── Entradas normalizadas (o chamador mapeia as linhas do banco para estas formas) ──
export interface MedInput { id: string; name: string; kind: string; startedOn: string | null; untilOn: string | null; status: string }
export interface AssessmentInput { date: string; sourceLabel: string; examId: string | null }
export interface ConsultaInput { id: string; date: string; professionalKind: string | null; professionalLabel: string | null; title: string | null }

// Especialidades cujas consultas se relacionam ao acompanhamento CORPORAL (v1). Endocrinologia/Medicina do
// Esporte hoje caem em "médico" genérico (sem especialidade distinta) → fora do filtro para não gerar ruído;
// o início do medicamento (ex.: GLP-1) já entra como marco próprio.
const BODY_CONSULTA_KINDS = new Set(['nutricionista', 'fisioterapeuta'])

/** Marcos de medicamentos/suplementos: início (started_on) e suspensão (status suspenso + until_date). */
export function medicationMilestones(meds: MedInput[]): Milestone[] {
  const out: Milestone[] = []
  for (const m of meds) {
    const category: MilestoneCategory = m.kind === 'suplemento' ? 'suplemento' : 'medicamento'
    const href = m.kind === 'suplemento' ? '/dashboard/suplementos' : '/dashboard/medicamentos'
    if (m.startedOn) out.push({ key: `med:${m.id}:start`, date: m.startedOn, category, title: `Início: ${m.name}`, href })
    if (m.status === 'suspenso' && m.untilOn) out.push({ key: `med:${m.id}:stop`, date: m.untilOn, category, title: `Suspenso: ${m.name}`, href })
  }
  return out
}

/** Marcos de avaliações corporais (bioimpedância/DEXA/…): a data de cada avaliação, rastreável ao exame. */
export function assessmentMilestones(assessments: AssessmentInput[]): Milestone[] {
  return assessments.map((a, i) => ({
    key: `assess:${a.examId ?? a.date}:${i}`, date: a.date, category: 'avaliacao' as const,
    title: a.sourceLabel, href: a.examId ? `/dashboard/exams/${a.examId}` : null,
  }))
}

/** Marcos de consultas relacionadas ao acompanhamento corporal (nutrição/fisioterapia). Rastreável à timeline. */
export function consultaMilestones(consultas: ConsultaInput[]): Milestone[] {
  const out: Milestone[] = []
  for (const c of consultas) {
    if (!c.professionalKind || !BODY_CONSULTA_KINDS.has(c.professionalKind)) continue
    out.push({
      key: `consulta:${c.id}`, date: c.date, category: 'consulta',
      title: `Consulta · ${c.professionalLabel ?? 'profissional'}`, href: '/dashboard/timeline',
    })
  }
  return out
}

/** Junta e ordena (asc) todos os marcos. Puro. */
export function buildMilestones(inputs: { meds: MedInput[]; assessments: AssessmentInput[]; consultas: ConsultaInput[] }): Milestone[] {
  return [
    ...medicationMilestones(inputs.meds),
    ...assessmentMilestones(inputs.assessments),
    ...consultaMilestones(inputs.consultas),
  ].filter(m => !!m.date).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
