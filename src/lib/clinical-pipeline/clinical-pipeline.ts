// Clinical Pipeline — ORQUESTRAÇÃO. Chama cada camada e produz a entidade oficial CLINICAL IDENTITY + o PIPELINE
// AUDIT (Decision Log estruturado, versões, confiança global). As DECISÕES pertencem AQUI (orquestração), não ao
// DUE nem à Terminologia. Ordem: DUE (observa) → Terminology Service (oficial) → Internal Clinical Catalog (lacuna)
// → Clinical Identity. Contratos CONGELADOS (ADR-CP-001) — toda a plataforma consome sem alterar.
import type { DocumentUnderstanding } from '@/lib/capture/document-understanding'
import { PIPELINE_VERSIONS } from '@/lib/capture/pipeline-versions'
import { resolveClinicalMapping, confidenceScore } from './clinical-mapping-service'
import { lookupOfficialTerminology } from '@/lib/terminology/terminology-service'
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

  // Etapa DUE (observação) — o Audit reflete a data/paciente EFETIVAMENTE resolvidos. Quando o DUE não leu mas a
  // resolução trouxe o valor (outra leitura), registra 'ok' e EXPLICA a divergência com a leitura do DUE (auditoria).
  const resolvedDate = ctx.resolved?.examDate ?? du.report.examDate.value ?? null
  const resolvedPatient = ctx.resolved?.patientName ?? du.report.patientName.value ?? null
  const d = du.report.examDate
  decisionLog.push({ step: 'due', detector: 'date',
    status: resolvedDate ? 'ok' : (d.absenceReason ?? 'not_found'),
    output: resolvedDate ?? undefined,
    reason: resolvedDate ? (d.value ? undefined : `leitura do DUE: ${d.absenceReason ?? 'não lida'}; resolvida por outra leitura`) : (d.absenceReason ?? undefined) })
  const p = du.report.patientName
  decisionLog.push({ step: 'due', detector: 'patient',
    status: resolvedPatient ? 'ok' : (p.absenceReason ?? 'not_found'),
    output: resolvedPatient ?? undefined,
    reason: resolvedPatient && !p.value ? `leitura do DUE: ${p.absenceReason ?? 'não lida'}; resolvida por outra leitura` : undefined })

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
    knowledge: { status: 'pending' },
    evidence: { status: 'pending' },
  }

  return { identity, audit }
}
