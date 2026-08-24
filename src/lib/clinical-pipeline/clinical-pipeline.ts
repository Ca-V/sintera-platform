// Clinical Pipeline — ORQUESTRAÇÃO. Chama cada camada e produz a entidade oficial CLINICAL IDENTITY + o PIPELINE
// AUDIT (Decision Log estruturado, versões, confiança global). As DECISÕES pertencem AQUI (orquestração), não ao
// DUE nem à Terminologia. Ordem: DUE (observa) → Terminology Service (oficial) → Internal Clinical Catalog (lacuna)
// → Clinical Identity. Contratos CONGELADOS (ADR-CP-001) — toda a plataforma consome sem alterar.
import type { DocumentUnderstanding } from '@/lib/capture/document-understanding'
import { PIPELINE_VERSIONS } from '@/lib/capture/pipeline-versions'
import { resolveClinicalMapping, confidenceScore } from './clinical-mapping-service'
import { consolidateLaterality } from './laterality'
import { lookupOfficialTerminology } from '@/lib/terminology/terminology-service'
import { toEvidence, directEvidence, resolveFact, DATE_RESOLUTION, toIso } from './resolution-engine'
import type { ClinicalIdentity, PipelineAudit, DecisionStep, ConfidenceProfile, NameSource } from './contracts'

const round2 = (n: number) => Math.round(n * 100) / 100

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
    resolutions: [],
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

  // DATA — motor GENÉRICO de resolução (Resolved Fact Engine) sobre EVIDENCE. O DUE só observa; a decisão vive
  // aqui e é independente da origem. Evidências: observações de data do DUE + leitura direta (extração) como fallback.
  const dateObs = (du.report.observations ?? []).filter(o => o.type === 'date')
  const fallbackDate = ctx.resolved?.examDate ?? du.report.examDate.value ?? null
  const dateEvidence = [
    ...toEvidence(dateObs, toIso),
    ...(fallbackDate ? [directEvidence('ev-direct-date', 'extractor', 'date', fallbackDate, toIso)] : []),
  ]
  const dateFact = resolveFact(dateEvidence, DATE_RESOLUTION)
  const resolvedDate = dateFact.value
  const resolvedPatient = ctx.resolved?.patientName ?? du.report.patientName.value ?? null
  decisionLog.push({ step: 'mapping', detector: 'date',
    status: resolvedDate ? 'ok' : dateFact.outcome,
    output: resolvedDate ?? undefined,
    reason: dateFact.reason ?? `${dateFact.outcome} — rejeitadas: ${dateFact.rejected.map(r => `${r.evidenceId}:${r.reasonCode}`).join(', ') || 'nenhuma'}` })
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

  // Consolidação de LATERALIDADE (H-10) — REPRESENTAÇÃO estrutural sobre as OBSERVAÇÕES do próprio documento.
  // O modelo da DUE colapsa procedimentos repetidos ao "texto comum" (mantém "unilateral", descarta os lados);
  // aqui a orquestração RE-INFERE a lateralidade da evidência: Esquerdo + Direito ⇒ bilateral. As observações
  // (obs-N) permanecem a fonte rastreável. Nunca é replace textual; inerte quando não há lados complementares.
  const laterality = consolidateLaterality(mapping.name, du.report.observations)
  const resolvedName = laterality?.name ?? mapping.name
  if (laterality) {
    decisionLog.push({
      step: 'mapping', detector: 'laterality', status: 'consolidated',
      input: mapping.name ?? undefined, output: laterality.name, confidence: 0.9,
      reason: `procedimento com lados complementares (${laterality.sides.join(' + ')})`
        + ` · chave ${laterality.key} → lateralidade "${laterality.laterality}"`
        + ` · lados preservados nas observações [${laterality.observationIds.join(', ')}]`,
    })
  }

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
    name: resolvedName,
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
    resolutions: [dateFact],   // motor genérico: hoje a data; amanhã paciente/médico/lab… (mesmo mecanismo)
    knowledge: { status: 'pending' },
    evidence: { status: 'pending' },
  }

  return { identity, audit }
}
