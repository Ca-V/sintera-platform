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
export function buildConfidenceProfile(du: DocumentUnderstanding, nameScore: number): ConfidenceProfile {
  const r = du.report
  const score = (present: boolean, c: DocumentUnderstanding['confidence'] | null) => (present ? confidenceScore(c) : 0)
  const attributes: Record<string, number> = {
    name: round2(nameScore),
    date: round2(score(!!r.examDate.value, r.examDate.confidence)),
    patient: round2(score(!!r.patientName.value, r.patientName.confidence)),
    category: round2(du.examCategory ? 0.6 : 0),
    modality: round2(score(!!r.examModality.value, r.examModality.confidence)),
  }
  const overall = round2(0.45 * attributes.name + 0.2 * attributes.date + 0.15 * attributes.patient + 0.1 * attributes.category + 0.1 * attributes.modality)
  return { attributes, overall, autoAcceptable: !!nameScore && overall >= 0.8 }
}

export interface PipelineContext { resolutionId: string; startedAt: string; finishedAt: string }

/** Executa o pipeline sobre a compreensão do DUE → Clinical Identity + Pipeline Audit. Puro/determinístico. */
export function resolveClinicalIdentity(du: DocumentUnderstanding, ctx: PipelineContext): { identity: ClinicalIdentity; audit: PipelineAudit } {
  const decisionLog: DecisionStep[] = []

  // Etapa DUE (observação) — registra os detectores-chave e razões de ausência (auditoria).
  const d = du.report.examDate
  decisionLog.push({ step: 'due', detector: 'date', status: d.value ? 'ok' : (d.absenceReason ?? 'not_found'), output: d.value ?? undefined, reason: d.value ? undefined : (d.absenceReason ?? undefined) })
  const p = du.report.patientName
  decisionLog.push({ step: 'due', detector: 'patient', status: p.value ? 'ok' : (p.absenceReason ?? 'not_found'), output: p.value ?? undefined })

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
  const confidence = buildConfidenceProfile(du, confidenceScore(mapping.confidence))
  const finalStatus: PipelineAudit['pipeline']['finalStatus'] = official.ref ? 'resolved' : (mapping.confidence === 'low' ? 'pending' : 'provisional')

  const identity: ClinicalIdentity = {
    resolutionId: ctx.resolutionId,
    name: mapping.name,
    category: mapping.category,
    modality: du.examModality,
    codes: official.ref ? [official.ref] : [],
    aliases: mapping.aliases,
    equipment: mapping.equipment,
    examDate: du.examDate,
    patientName: du.patientName,
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
