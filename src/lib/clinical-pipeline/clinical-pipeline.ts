// Clinical Pipeline — ORQUESTRAÇÃO. Chama cada camada e produz a entidade oficial CLINICAL IDENTITY + o PIPELINE
// AUDIT (Decision Log estruturado, versões, confiança global). As DECISÕES pertencem AQUI (orquestração), não ao
// DUE nem à Terminologia. Ordem: DUE (observa) → Terminology Service (oficial) → Internal Clinical Catalog (lacuna)
// → Clinical Identity. Contratos CONGELADOS (ADR-CP-001) — toda a plataforma consome sem alterar.
import type { DocumentUnderstanding, Observation } from '@/lib/capture/document-understanding'
import { PIPELINE_VERSIONS } from '@/lib/capture/pipeline-versions'
import { resolveClinicalMapping, confidenceScore } from './clinical-mapping-service'
import { lookupOfficialTerminology } from '@/lib/terminology/terminology-service'
import type { ClinicalIdentity, PipelineAudit, DecisionStep, ConfidenceProfile, NameSource, DateDecision, DateSemantics } from './contracts'

const round2 = (n: number) => Math.round(n * 100) / 100

// ── DECISÃO DE DATA — INTERPRETAÇÃO determinística (Pipeline), sobre as OBSERVAÇÕES do DUE. Classifica pelo
// RÓTULO/REGIÃO observados (regra, não IA); o DUE nunca diz o tipo. Separa falha de leitura de falha de decisão.
const pad2 = (n: number) => String(n).padStart(2, '0')
function toIso(text: string): string | null {
  const t = (text ?? '').trim()
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return `${m[1]}-${pad2(+m[2])}-${pad2(+m[3])}`
  m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/) // DD/MM/YYYY (pt-BR)
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${m[3]}-${pad2(+m[2])}-${pad2(+m[1])}`
  return null // incompleta (só mês/ano ou ano) ou não reconhecida → não serve como realização
}
/** Classifica o SIGNIFICADO da data pelo rótulo/região OBSERVADOS — determinístico, por regra (não IA). */
export function classifyDateByLabel(label: string | null, region: string | null): DateSemantics {
  const s = `${label ?? ''} ${region ?? ''}`.toLowerCase()
  if (/nascimento|\bbirth\b|\bdob\b|data de nasc/.test(s)) return 'birth'
  if (/impress|\bprint\b|emiss[aã]o|printed/.test(s)) return 'print'
  if (/calibra|firmware|fabrica|manufact/.test(s)) return 'calibration'
  if (/protocolo|\bprotocol\b/.test(s)) return 'protocol'
  if (/exam\s*date|data\s*do\s*exame|acquisition|aquisi|realiza|coleta|collection|study\s*date/.test(s)) return 'realization'
  return 'unknown'
}
const NON_REALIZATION = new Set<DateSemantics>(['birth', 'print', 'calibration', 'protocol'])

/** DECISÃO da data: sobre as observações de data do DUE, descarta nascimento/impressão/calibração/protocolo e
 *  incompletas; escolhe a de realização; `fallbackIso` (leitura direta) entra quando não há observação decisível. */
export function decideExamDate(dateObs: Observation[], fallbackIso: string | null): DateDecision {
  const considered = dateObs.map(o => ({ value: o.value, iso: toIso(o.value), label: o.label, region: o.region, semantics: classifyDateByLabel(o.label, o.region), confidence: o.confidence }))
  const fromFallback = (reason: string): DateDecision['chosen'] => fallbackIso ? { value: fallbackIso, iso: fallbackIso, reason } : null

  if (considered.length === 0) {
    const chosen = fromFallback('sem observações de data; usada a data resolvida por leitura direta')
    return { considered, chosen, discarded: [], outcome: chosen ? 'resolved' : 'no_date' }
  }
  const discarded: DateDecision['discarded'] = []
  const eligible = considered.filter(c => {
    if (NON_REALIZATION.has(c.semantics)) { discarded.push({ value: c.value, semantics: c.semantics, reason: `rótulo indica ${c.semantics} — não é data de realização` }); return false }
    if (!c.iso) { discarded.push({ value: c.value, semantics: c.semantics, reason: 'data incompleta/não parseável (ex.: só mês/ano)' }); return false }
    return true
  })
  if (eligible.length === 0) {
    const chosen = fromFallback('nenhuma observação classificável como realização; usada a data resolvida por leitura direta')
    return { considered, chosen, discarded, outcome: chosen ? 'resolved' : 'decision_ambiguous' }
  }
  const preferred = eligible.filter(c => c.semantics === 'realization')
  const pool = preferred.length ? preferred : eligible
  const ambiguous = pool.length > 1
  const chosen = pool[0]
  pool.slice(1).forEach(c => discarded.push({ value: c.value, semantics: c.semantics, reason: 'outra candidata de realização (ambígua) — não escolhida' }))
  return { considered, discarded, chosen: { value: chosen.value, iso: chosen.iso!, reason: `rótulo/região → ${chosen.semantics}${ambiguous ? ' (múltiplas; escolhida a 1ª)' : ''}` }, outcome: ambiguous ? 'decision_ambiguous' : 'resolved' }
}

/** Confiança GLOBAL a partir da confiança por atributo (0..1) — decide aceite automático × revisão. */
export function buildConfidenceProfile(du: DocumentUnderstanding, nameScore: number, resolvedDate: string | null, resolvedPatient: string | null): ConfidenceProfile {
  const r = du.report
  const score = (present: boolean, c: DocumentUnderstanding['confidence'] | null) => (present ? confidenceScore(c) : 0)
  // Data/paciente: usa a confiança do DUE quando ELE leu; se resolvido por outra leitura, confiança média (0.7).
  const attributes: Record<string, number> = {
    name: round2(nameScore),
    date: round2(resolvedDate ? (r.examDate.value ? confidenceScore(r.examDate.confidence) : 0.7) : 0),
    patient: round2(resolvedPatient ? (r.patientName.value ? confidenceScore(r.patientName.confidence) : 0.7) : 0),
    category: round2(du.examCategory ? 0.6 : 0),
    modality: round2(score(!!r.examModality.value, r.examModality.confidence)),
  }
  const overall = round2(0.45 * attributes.name + 0.2 * attributes.date + 0.15 * attributes.patient + 0.1 * attributes.category + 0.1 * attributes.modality)
  return { attributes, overall, autoAcceptable: !!nameScore && overall >= 0.8 }
}

/** Audit de FALHA — o DUE não produziu compreensão. O documento continua EXPLICÁVEL (registra a falha + versão),
 *  nunca fica sem audit nem regride ao caminho estruturado. finalStatus 'pending' → aguarda re-processamento. */
export function buildFailedAudit(ctx: { resolutionId: string; startedAt: string; finishedAt: string }, reason: string): PipelineAudit {
  return {
    pipeline: {
      resolutionId: ctx.resolutionId, startedAt: ctx.startedAt, finishedAt: ctx.finishedAt, versions: PIPELINE_VERSIONS,
      decisionLog: [{ step: 'due', status: 'failed', reason }],
      finalStatus: 'pending',
    },
    due: null,
    terminology: { official: null },
    mapping: { matched: false, equipment: null },
    dateDecision: { considered: [], chosen: null, discarded: [], outcome: 'no_date' },
    knowledge: { status: 'pending' },
    evidence: { status: 'pending' },
  }
}

export interface PipelineContext {
  resolutionId: string
  startedAt: string
  finishedAt: string
  /** Data/paciente EFETIVAMENTE resolvidos pela orquestração (podem vir de outra leitura além do DUE). O Audit
   *  deve refletir a REALIDADE persistida — não apenas a leitura independente do DUE. */
  resolved?: { examDate: string | null; patientName: string | null }
}

/** Executa o pipeline sobre a compreensão do DUE → Clinical Identity + Pipeline Audit. Puro/determinístico. */
export function resolveClinicalIdentity(du: DocumentUnderstanding, ctx: PipelineContext): { identity: ClinicalIdentity; audit: PipelineAudit } {
  const decisionLog: DecisionStep[] = []

  // DATA — DECISÃO determinística (Pipeline) sobre as OBSERVAÇÕES do DUE (o DUE não classifica). Separa
  // falha de leitura (nada observado) de falha de decisão (viu datas, nenhuma classificável como realização).
  const dateObs = (du.report.observations ?? []).filter(o => o.type === 'date')
  const dateDecision = decideExamDate(dateObs, ctx.resolved?.examDate ?? du.report.examDate.value ?? null)
  const resolvedDate = dateDecision.chosen?.iso ?? null
  const resolvedPatient = ctx.resolved?.patientName ?? du.report.patientName.value ?? null
  decisionLog.push({ step: 'mapping', detector: 'date',
    status: resolvedDate ? 'ok' : dateDecision.outcome,
    output: resolvedDate ?? undefined,
    reason: dateDecision.chosen
      ? dateDecision.chosen.reason
      : `${dateDecision.outcome} — descartadas: ${dateDecision.discarded.map(x => `${x.value}(${x.semantics})`).join(', ') || 'nenhuma data observada'}` })
  const p = du.report.patientName
  const pNote = p.note ? ` (${p.note})` : ''
  decisionLog.push({ step: 'due', detector: 'patient',
    status: resolvedPatient ? 'ok' : (p.absenceReason ?? 'not_found'),
    output: resolvedPatient ?? undefined,
    reason: resolvedPatient
      ? (p.value ? (p.note ?? undefined) : `leitura do DUE: ${p.absenceReason ?? 'não lida'}${pNote}; resolvida por outra leitura`)
      : `${p.absenceReason ?? 'not_found'}${pNote}` })

  // Etapa Terminologia oficial (autoridade). Stub por ora → sem conceito oficial.
  const mapping = resolveClinicalMapping(du)
  const official = lookupOfficialTerminology({ name: mapping.name, category: mapping.category })
  decisionLog.push(official.step)

  // Etapa Clinical Mapping Service (resolve o conceito a partir das evidências) — nome provisório.
  decisionLog.push(...mapping.steps)

  // Etapas futuras (registradas como pendentes).
  decisionLog.push({ step: 'knowledge', status: 'pending' })
  decisionLog.push({ step: 'evidence', status: 'pending' })

  const nameSource: NameSource = official.ref ? 'terminology-official'
    : mapping.matched ? 'internal-mapping'
    : mapping.confidence === 'low' ? 'pending' : 'document'
  const provisional = official.ref === null
  const confidence = buildConfidenceProfile(du, confidenceScore(mapping.confidence), resolvedDate, resolvedPatient)
  const finalStatus: PipelineAudit['pipeline']['finalStatus'] = official.ref ? 'resolved' : (mapping.confidence === 'low' ? 'pending' : 'provisional')

  const identity: ClinicalIdentity = {
    resolutionId: ctx.resolutionId,
    name: mapping.name,
    category: mapping.category,
    modality: du.examModality,
    codes: official.ref ? [official.ref] : [],
    aliases: mapping.aliases,
    equipment: mapping.equipment,
    examDate: resolvedDate,
    patientName: resolvedPatient,
    issuer: du.issuer,
    provisional,
    nameSource,
    basis: mapping.basis,
    confidence,
  }

  const audit: PipelineAudit = {
    pipeline: { resolutionId: ctx.resolutionId, startedAt: ctx.startedAt, finishedAt: ctx.finishedAt, versions: PIPELINE_VERSIONS, decisionLog, finalStatus },
    due: du.report,
    terminology: { official: official.ref },
    mapping: { matched: mapping.matched, equipment: mapping.equipment },
    dateDecision,
    knowledge: { status: 'pending' },
    evidence: { status: 'pending' },
  }

  return { identity, audit }
}
