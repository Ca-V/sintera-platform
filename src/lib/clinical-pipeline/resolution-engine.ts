// Resolved Fact Engine — motor GENÉRICO de resolução de fatos clínicos (Pipeline). NÃO é específico de data:
// o MESMO mecanismo resolve data, paciente, médico, laboratório, modalidade, lateralidade, equipamento… — muda só
// a CONFIG por atributo. Consome EVIDENCE (camada intermediária), nunca a observação crua → independente da origem
// (DUE/OCR/DICOM/PDF/HL7/manual). Registra ACEITA e REJEITADAS (com CÓDIGO determinístico). Puro/determinístico.
import type { Observation } from '@/lib/capture/document-understanding'
import type { Evidence, ResolvedFact, RejectedEvidence, RejectionCode } from './contracts'

/** Observações (de qualquer detector) → EVIDENCE normalizada. `normalize` transforma o valor bruto (ex.: data→ISO). */
export function toEvidence(observations: Observation[], normalize: (raw: string) => string | null): Evidence[] {
  return observations.map(o => ({
    id: `ev-${o.id}`, observationId: o.id, source: o.detector || 'due', type: o.type,
    raw: o.value, normalized: normalize(o.value), label: o.label, region: o.region, confidence: o.confidence,
  }))
}

/** Evidence DIRETA — não veio de observação (ex.: data por extração/leitura direta, ou entrada manual). */
export function directEvidence(id: string, source: string, type: string, raw: string, normalize: (r: string) => string | null): Evidence {
  return { id, observationId: null, source, type, raw, normalized: normalize(raw), label: null, region: null, confidence: null }
}

/** CONFIG do ATRIBUTO — elegibilidade/normalização/preferência (o QUE resolver). Interno ao engine (evolutivo). */
export interface ResolutionConfig {
  attribute: string
  /** Desqualifica uma evidência (com CÓDIGO) — ex.: rótulo "impressão" → PRINT_DATE; incompleta → INCOMPLETE_DATE. */
  reject: (ev: Evidence) => { code: RejectionCode; reason: string } | null
  /** Preferida entre as elegíveis (ex.: rótulo "Exam Date"). */
  prefer: (ev: Evidence) => boolean
}

/** EVIDENCE BUNDLE — múltiplas observações compõem UMA evidência lógica ANTES da resolução (ex.: '18/03' + '2026').
 *  Interno ao engine. Por ora: identidade (cada evidência é seu bundle); a fusão evolui guiada por exames reais. */
export interface EvidenceBundle { evidenceIds: string[]; combined: Evidence }
export function bundleEvidence(evidence: Evidence[]): Evidence[] {
  return evidence // seam de fusão — sem duplicar lógica quando políticas de bundle forem adicionadas
}

/** POLICY — estratégia REUTILIZÁVEL de escolha, SEPARADA da config (o COMO resolver). Sem duplicar lógica entre
 *  atributos: SingleChoice (uma), MultiChoice (várias), RankedChoice (ordenada), Merge (combina)… */
export type ResolutionPolicy = (eligible: Evidence[], cfg: ResolutionConfig) => { chosen: Evidence | null; ambiguous: boolean; extraRejected: RejectedEvidence[] }

/** SingleChoice — escolhe UMA (preferida, senão a 1ª); marca as demais como AMBIGUOUS. */
export const SingleChoice: ResolutionPolicy = (eligible, cfg) => {
  const preferred = eligible.filter(cfg.prefer)
  const pool = preferred.length ? preferred : eligible
  const chosen = pool[0] ?? null
  const extraRejected = pool.slice(1).map(ev => ({ evidenceId: ev.id, reasonCode: 'AMBIGUOUS' as RejectionCode, reason: 'outra candidata elegível — SingleChoice escolheu a 1ª' }))
  return { chosen, ambiguous: pool.length > 1, extraRejected }
}
/** RankedChoice — preferidas primeiro; determinística. (MultiChoice/Merge evoluem por extensão, mesma assinatura.) */
export const RankedChoice: ResolutionPolicy = (eligible, cfg) => SingleChoice([...eligible].sort((a, b) => Number(cfg.prefer(b)) - Number(cfg.prefer(a))), cfg)

/** MOTOR GENÉRICO: Evidence → bundle → config (elegibilidade) → policy (escolha) → ResolvedFact. Registra tudo. */
export function resolveFact(rawEvidence: Evidence[], cfg: ResolutionConfig, policy: ResolutionPolicy = SingleChoice): ResolvedFact {
  const evidence = bundleEvidence(rawEvidence)
  const rejected: RejectedEvidence[] = []
  const base = (outcome: ResolvedFact['outcome'], value: string | null, chosenEvidenceId: string | null, reason: string | null): ResolvedFact =>
    ({ attribute: cfg.attribute, value, chosenEvidenceId, considered: evidence, rejected, outcome, reason })

  if (evidence.length === 0) return base('no_evidence', null, null, 'nenhuma evidência observada')
  const eligible = evidence.filter(ev => {
    const r = cfg.reject(ev)
    if (r) { rejected.push({ evidenceId: ev.id, reasonCode: r.code, reason: r.reason }); return false }
    return true
  })
  if (eligible.length === 0) return base('decision_ambiguous', null, null, 'evidências observadas, nenhuma elegível')

  const { chosen, ambiguous, extraRejected } = policy(eligible, cfg)
  rejected.push(...extraRejected)
  if (!chosen) return base('decision_ambiguous', null, null, 'nenhuma evidência escolhida pela política')
  return base(ambiguous ? 'decision_ambiguous' : 'resolved', chosen.normalized, chosen.id,
    `escolhida "${chosen.raw}"${chosen.label ? ` (rótulo "${chosen.label}")` : ''}${ambiguous ? ' — ambíguo, escolhida a 1ª' : ''}`)
}

// ── Config de DATA (uma entre muitas — o motor não conhece "data") ────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
/** Normaliza texto de data → YYYY-MM-DD. Incompleta (só mês/ano ou ano) → null. */
export function toIso(text: string): string | null {
  const t = (text ?? '').trim()
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return `${m[1]}-${pad2(+m[2])}-${pad2(+m[3])}`
  m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/) // DD/MM/YYYY
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${m[3]}-${pad2(+m[2])}-${pad2(+m[1])}`
  return null
}
export const DATE_RESOLUTION: ResolutionConfig = {
  attribute: 'examDate',
  reject: (ev) => {
    if (!ev.normalized) return { code: 'INCOMPLETE_DATE', reason: `data incompleta/não parseável: "${ev.raw}"` }
    const s = `${ev.label ?? ''} ${ev.region ?? ''}`.toLowerCase()
    if (/nascimento|\bbirth\b|\bdob\b|data de nasc/.test(s)) return { code: 'BIRTH_DATE', reason: 'rótulo indica nascimento' }
    if (/impress|\bprint\b|emiss[aã]o|printed/.test(s)) return { code: 'PRINT_DATE', reason: 'rótulo indica impressão' }
    if (/calibra|firmware|fabrica|manufact/.test(s)) return { code: 'CALIBRATION_DATE', reason: 'rótulo indica calibração' }
    if (/protocolo|\bprotocol\b/.test(s)) return { code: 'PROTOCOL_DATE', reason: 'rótulo indica protocolo' }
    return null
  },
  prefer: (ev) => /exam\s*date|data\s*do\s*exame|acquisition|aquisi|realiza|coleta|collection|study\s*date/i.test(`${ev.label ?? ''} ${ev.region ?? ''}`),
}
