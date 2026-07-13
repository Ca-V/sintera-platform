// Identity Validator — 4ª etapa do pipeline (após a Segmentação; antes do Analyze/CEF).
//
// Fundadora (13/07): não valida SÓ a identidade (título/data/emissor) — valida a CONSISTÊNCIA da
// Segmentação inteira (fronteiras, continuidade, coerência entre páginas, temporal e documental) e
// produz uma **CDU CERTIFICADA**. Só CDUs certificadas seguem para o Analyze/extratores do CEF → os
// extratores deixam de receber PDFs e passam a operar sobre um CONTRATO ÚNICO de entrada, qualquer que
// seja a modalidade. Fail-safe (nenhuma camada valida a si própria / sem falsa confiança): fronteira
// incerta → `needs_review`, nunca uma escolha silenciosa.

import { createHash } from 'node:crypto'
import type { StructuralRepresentation } from './structural-analysis'
import type { CDU, CDUKind, SegmentationResult } from './segmentation'

export type CDUStatus = 'certified' | 'needs_review'
export type Confidence = 'high' | 'medium' | 'low'
// Revisão TÉCNICA (ambiguidade ESTRUTURAL da CDU) → BLOQUEIA o processamento daquela CDU.
// Revisão CLÍNICA (estrutura correta, mas falta extrator da modalidade) → NÃO bloqueia (segue como
// document_only/partial, a jusante). O Identity Validator só produz revisão TÉCNICA (é documental).
export type ReviewType = 'technical' | 'clinical'

/** Versão do CONTRATO CertifiedCDU. Estável/versionado como API pública: evoluções → v2, sem quebrar
 *  os extratores existentes. Todo extrator declara a versão que consome. */
export const CERTIFIED_CDU_CONTRACT_VERSION = 'v1' as const

/** CONTRATO ÚNICO de entrada dos extratores do CEF (nunca mais um PDF). */
export interface CertifiedCDU {
  /** Versão do contrato (v1). */
  contractVersion: string
  index: number
  pages: number[]
  /** Modalidade DOCUMENTAL (results/narrative) — NÃO a clínica (essa é a etapa 5). */
  documentalModality: CDUKind
  title: string | null
  discoveredUnits: number
  date: string | null
  issuer: string | null
  fingerprint: string
  status: CDUStatus
  /** Presente quando `needs_review`. O Identity Validator só produz `technical` (ambiguidade estrutural
   *  → BLOQUEIA). `clinical` (falta extrator) é decidido a jusante e NÃO bloqueia. */
  reviewType?: ReviewType
  confidence: Confidence
  /** Motivos auditáveis (por que não certificou / ressalvas). */
  issues: string[]
  structure: StructuralRepresentation
}

export interface ValidatedSegmentation {
  cdus: CertifiedCDU[]
  allCertified: boolean
}

// Palavras de LATERALIDADE/segmento — um mesmo exame pode vir dividido por olho/lado/mama.
const LATERALITY_RE = /\b(olho\s+)?(direit[oa]|esquerd[oa]|bilateral|ambos|\bod\b|\boe\b|\bd\b|\be\b)\b/gi
function baseTitle(title: string | null): string {
  return (title ?? '')
    .toUpperCase()
    .replace(LATERALITY_RE, ' ')
    .replace(/[^A-ZÀ-Þ0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Caractere "corrompido" (mojibake / byte-swap não reparado / controle) fora dos ranges válidos.
function looksCorrupted(s: string): boolean {
  let bad = 0, total = 0
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp === 0x20) continue
    total++
    const ok = (cp >= 0x21 && cp <= 0x7e) || (cp >= 0x00a0 && cp <= 0x024f)
      || cp === 0x2013 || cp === 0x2014 || cp === 0x2022
    if (!ok) bad++
  }
  return total > 0 && bad / total >= 0.2
}

function contiguous(pages: number[]): boolean {
  const s = [...pages].sort((a, b) => a - b)
  return s.every((p, i) => i === 0 || p === s[i - 1] + 1)
}

function cduFingerprint(cdu: CDU): string {
  const canonical = JSON.stringify({
    pages: [...cdu.pages].sort((a, b) => a - b),
    kind: cdu.kind,
    title: (cdu.title ?? '').replace(/\s+/g, ' ').trim().toUpperCase(),
    discoveredUnits: cdu.discoveredUnits,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Valida a Segmentação e certifica cada CDU. Determinística.
 */
export function validateSegmentation(seg: SegmentationResult): ValidatedSegmentation {
  // Passo 1 — validação POR CDU (identidade + continuidade).
  const draft: CertifiedCDU[] = seg.cdus.map(cdu => {
    const issues: string[] = []
    const title = cdu.title
    if (!title || title.trim().length < 3) issues.push('título ausente ou muito curto')
    else if (title.length > 90) issues.push('título muito longo (possível mistura de linhas)')
    else if (looksCorrupted(title)) issues.push('título com corrupção/caracteres inválidos (OCR)')
    if (cdu.kind === 'unknown') issues.push('modalidade documental indeterminada')
    if (!contiguous(cdu.pages)) issues.push('páginas não contíguas na CDU')

    // Coerência temporal interna: 0 ou 1 data é coerente; várias datas → ressalva.
    const dates = cdu.structure.distinctDates
    if (dates.length > 1) issues.push(`datas divergentes na mesma CDU (${dates.length})`)

    const status: CDUStatus = issues.length === 0 ? 'certified' : 'needs_review'
    const confidence: Confidence = issues.length === 0 ? 'high' : issues.length === 1 ? 'medium' : 'low'

    return {
      contractVersion: CERTIFIED_CDU_CONTRACT_VERSION,
      index: cdu.index,
      pages: cdu.pages,
      // Toda revisão emitida aqui é TÉCNICA (ambiguidade estrutural) — bloqueia. Clínica é a jusante.
      ...(status === 'needs_review' ? { reviewType: 'technical' as const } : {}),
      documentalModality: cdu.kind,
      title,
      discoveredUnits: cdu.discoveredUnits,
      date: dates[0] ?? null,
      issuer: cdu.structure.distinctIssuers[0] ?? null,
      fingerprint: cduFingerprint(cdu),
      status,
      confidence,
      issues,
      structure: cdu.structure,
    }
  })

  // Passo 2 — consistência da SEGMENTAÇÃO (super-segmentação): CDUs adjacentes com o MESMO título-base
  // (após remover lateralidade) + mesma data + mesmo emissor podem ser UM exame só → needs_review
  // (não decide sozinho; devolve à governança). Ex.: Pentacam "olho direito" + "olho esquerdo".
  for (let i = 1; i < draft.length; i++) {
    const a = draft[i - 1], b = draft[i]
    const sameBase = baseTitle(a.title) !== '' && baseTitle(a.title) === baseTitle(b.title)
    const sameDate = !!a.date && a.date === b.date
    const sameIssuer = (a.issuer ?? null) === (b.issuer ?? null)
    if (sameBase && sameDate && sameIssuer) {
      for (const c of [a, b]) {
        if (!c.issues.includes('possível super-segmentação (mesmo exame dividido?)')) {
          c.issues.push('possível super-segmentação (mesmo exame dividido?)')
        }
        c.status = 'needs_review'
        c.reviewType = 'technical' // ambiguidade ESTRUTURAL → bloqueia
        c.confidence = 'low'
      }
    }
  }

  return { cdus: draft, allCertified: draft.every(c => c.status === 'certified') }
}
