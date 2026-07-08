// ============================================================
// SINTERA — Agenda: sugestões TEMPORAIS (Fase 3)
// ============================================================
// APENAS sugestões baseadas em TEMPO/recência. SEM juízo clínico.
//
// Limite de escopo (definição de produto, ver docs/SPRINT-2-INSIGHTS.md):
//   - PERMITIDO: "faz X meses desde seu último exame, quer agendar?"
//   - PROIBIDO: qualquer sugestão baseada em RESULTADO/biomarcador
//     ("seu exame está alterado, marque consulta"). Isso é território
//     clínico e depende do motor de insights + governança aprovada.
//
// Linguagem sempre factual e opcional. Nunca prescritiva.
//
// REGRA OBRIGATÓRIA (fundadora 28/06/2026, RDC 657): toda sugestão de exame,
// consulta ou procedimento DEVE orientar a usuária a CONFIRMAR com o médico
// ("confira com seu médico se…"). A SINTERA organiza; quem orienta é o médico.
// ============================================================

/** Exame reduzido ao necessário para a sugestão de recência. */
export interface ExamLite {
  type: string | null
  /** Data efetiva 'YYYY-MM-DD' (exam_date, ou created_at truncado). */
  date: string
  status: string | null
}

export interface AgendaSuggestion {
  /** Chave estável (para dispensar). */
  id: string
  kind: 'exam_recency'
  monthsSince: number
  /** Texto factual e neutro, exibido à usuária. */
  message: string
  /** Pré-preenchimento sugerido ao abrir o modal. */
  suggestedTitle: string
  suggestedEventType: 'exame'
}

/** Limite de recência (meses) para sugerir um novo exame. */
export const EXAM_RECENCY_MONTHS = 6

/** Meses aproximados entre uma data 'YYYY-MM-DD' e agora. */
export function monthsSince(dateStr: string, now: Date = new Date()): number {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m) return 0
  const then = new Date(y, m - 1, d || 1)
  const days = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.floor(days / 30.44))
}

function monthsLabel(n: number): string {
  if (n < 12) return `${n} ${n === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(n / 12)
  const rest = n % 12
  const y = `${years} ${years === 1 ? 'ano' : 'anos'}`
  return rest === 0 ? y : `${y} e ${rest} ${rest === 1 ? 'mês' : 'meses'}`
}

/**
 * Sugere registrar um novo exame quando o mais recente (processado) passou
 * do limite de recência — e desde que não haja já um exame futuro na agenda.
 * Retorna null quando não há motivo temporal para sugerir.
 *
 * NÃO usa resultado de exame: olha só a DATA. Sem juízo clínico.
 */
export function buildExamRecencySuggestion(
  exams: ExamLite[],
  hasPendingExamEvent: boolean,
  now: Date = new Date(),
): AgendaSuggestion | null {
  if (hasPendingExamEvent) return null

  const processed = exams.filter(e => e.status === 'processed' && !!e.date)
  if (processed.length === 0) return null

  // Exame efetivamente mais recente por data.
  const latest = processed.reduce((a, b) => (a.date > b.date ? a : b))
  const months = monthsSince(latest.date, now)
  if (months < EXAM_RECENCY_MONTHS) return null

  return {
    id: `exam_recency_${latest.date}`,
    kind: 'exam_recency',
    monthsSince: months,
    message: `Percebi que seu último exame foi há ${monthsLabel(months)}. Confira com seu médico se seria interessante registrar um lembrete para um novo — a SINTERA apenas organiza; quem orienta é o seu médico.`,
    suggestedTitle: 'Novo exame',
    suggestedEventType: 'exame',
  }
}
