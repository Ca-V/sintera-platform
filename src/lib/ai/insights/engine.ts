// ============================================================
// SINTERA — Motor de Insights: Motor Determinístico (mecanismo)
// ============================================================
// ATENÇÃO — separação mecanismo × política clínica:
//
//   Este arquivo é APENAS o MECANISMO. Ele avalia REGRAS fornecidas
//   externamente e não contém nenhum limiar clínico embutido.
//
//   As REGRAS (quais valores → qual clinical_flag) são DECISÃO CLÍNICA
//   e devem ser definidas e aprovadas por responsável clínico humano.
//   Ver docs/GOVERNANCA-CLINICA-SINTERA.md (§1, §7).
//
//   O conjunto padrão `EMPTY_RULESET` é VAZIO de propósito: sem regras
//   aprovadas, a engine não emite nenhum candidato. Isso é intencional —
//   nada de saúde é classificado até a clínica aprovar.
// ============================================================

import type {
  AssembledBiomarker,
  ClinicalFlag,
  InsightContext,
  InsightType,
  RangeStatus,
} from './types'

// ── Definição de regra (preenchida pela clínica, não pelo código) ─────────────

/** Condição sobre a observação de um biomarcador. */
export type RuleCondition =
  | { kind: 'rangeStatus'; status: RangeStatus[] }
  | { kind: 'numericThreshold'; op: '<' | '<=' | '>' | '>='; value: number }
  | { kind: 'always' }

/** Estado de uma regra no fluxo de governança científica (ver docs/clinical/GOVERNANCA-CIENTIFICA.md §3). */
export type RuleStatus = 'draft' | 'validated' | 'active'

/**
 * Proveniência de uma regra clínica — rastreabilidade obrigatória da fonte e
 * da aprovação. É METADADO de governança, não decisão clínica em si; mas
 * `approvedBy`/`approvalDate` só são preenchidos por um Responsável Clínico
 * humano (CRM). Sem eles, `status` não pode ser 'active'.
 * Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §2.
 */
export interface RuleProvenance {
  /** Identificador estável da regra. */
  ruleId: string
  /** Fonte da decisão (ex.: 'KDIGO 2024', 'ADA 2025', 'laudo'). */
  source: string
  /** Versão da fonte/diretriz. */
  version: string
  /** Data de publicação da fonte (ISO). */
  publicationDate?: string
  /** PMID do estudo de respaldo, quando houver. */
  pmid?: string
  /** Código LOINC do biomarcador, quando mapeado. */
  loincCode?: string
  /** CRM do Responsável Clínico que aprovou (obrigatório para status 'active'). */
  approvedBy?: string
  /** Data da aprovação (ISO; obrigatória para status 'active'). */
  approvalDate?: string
  /** A partir de quando a regra vale (ISO). */
  effectiveFrom?: string
  /** Estágio no fluxo draft → validated → active. */
  status: RuleStatus
}

/**
 * Uma regra clínica. `clinicalFlag`, `templateKey` e os limiares em `when`
 * são CONTEÚDO CLÍNICO — definidos e aprovados por um clínico, nunca inferidos
 * pelo código.
 */
export interface InsightRule {
  /** code do biomarker_catalog ao qual a regra se aplica (ex.: 'HEMOGLOBINA_SANGUE'). */
  catalogCode: string
  /** Condição que dispara a regra. */
  when: RuleCondition
  /** Classificação resultante — DECISÃO CLÍNICA. */
  clinicalFlag: ClinicalFlag
  /** Chave do template narrativo correspondente. */
  templateKey: string
  /** Tipo do insight gerado. */
  insightType: InsightType
  /** Prioridade opcional de exibição. */
  priority?: 'low' | 'medium' | 'high'
  /** Proveniência/rastreabilidade da regra (ver RuleProvenance). Opcional na estrutura; obrigatória para ativar em produção. */
  provenance?: RuleProvenance
}

export type RuleSet = InsightRule[]

/** Conjunto padrão VAZIO — sem regras clínicas aprovadas, nada é emitido. */
export const EMPTY_RULESET: RuleSet = []

/**
 * Invariante de governança (mecânica): uma regra só pode estar 'active' se tiver
 * proveniência com `approvedBy` e `approvalDate` preenchidos por um Responsável
 * Clínico. Pura — não decide nada clínico, apenas verifica o metadado.
 * Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §2 e §3.
 */
export function isRuleActivatable(rule: InsightRule): boolean {
  const p = rule.provenance
  return !!p && p.status === 'active' && !!p.approvedBy && !!p.approvalDate
}

/**
 * Filtra um ruleset para conter apenas regras ativáveis (active + aprovadas).
 * Com `EMPTY_RULESET`, retorna []. Útil para o orquestrador garantir que só
 * regras formalmente aprovadas alcancem a usuária.
 */
export function activeRulesOnly(ruleset: RuleSet): RuleSet {
  return ruleset.filter(isRuleActivatable)
}

// ── Candidato a insight produzido pela engine ─────────────────────────────────

/** Saída da engine: alinhada às colunas de ai_insights. Sem texto narrativo (vem depois). */
export interface InsightCandidate {
  insightType: InsightType
  clinicalFlag: ClinicalFlag
  templateKey: string
  /** IDs dos biomarcadores que originaram o candidato (ai_insights.biomarker_ids). */
  biomarkerIds: string[]
  priority: 'low' | 'medium' | 'high'
  /** Biomarcador que disparou a regra (conveniência para a etapa narrativa). */
  biomarker: AssembledBiomarker
}

// ── Avaliação de condições (puramente mecânica) ───────────────────────────────

function matchesCondition(b: AssembledBiomarker, cond: RuleCondition): boolean {
  switch (cond.kind) {
    case 'always':
      return true
    case 'rangeStatus':
      return cond.status.includes(b.rangeStatus)
    case 'numericThreshold': {
      if (b.value === null) return false
      switch (cond.op) {
        case '<':  return b.value <  cond.value
        case '<=': return b.value <= cond.value
        case '>':  return b.value >  cond.value
        case '>=': return b.value >= cond.value
      }
    }
  }
}

/**
 * Avalia o conjunto de regras contra o contexto de um exame e produz candidatos.
 * Mecânico: NÃO decide nada clínico — apenas aplica as regras fornecidas.
 * Com `EMPTY_RULESET` (padrão), retorna [] — comportamento esperado até a
 * clínica aprovar as regras.
 */
export function evaluateRules(
  context: InsightContext,
  ruleset: RuleSet = EMPTY_RULESET,
): InsightCandidate[] {
  if (ruleset.length === 0) return []

  // Indexa regras por catalogCode para evitar varredura O(n*m).
  const rulesByCode = new Map<string, InsightRule[]>()
  for (const rule of ruleset) {
    const list = rulesByCode.get(rule.catalogCode)
    if (list) list.push(rule)
    else rulesByCode.set(rule.catalogCode, [rule])
  }

  const candidates: InsightCandidate[] = []
  for (const b of context.biomarkers) {
    if (!b.catalogCode) continue
    const rules = rulesByCode.get(b.catalogCode)
    if (!rules) continue
    for (const rule of rules) {
      if (matchesCondition(b, rule.when)) {
        candidates.push({
          insightType: rule.insightType,
          clinicalFlag: rule.clinicalFlag,
          templateKey: rule.templateKey,
          biomarkerIds: [b.id],
          priority: rule.priority ?? 'medium',
          biomarker: b,
        })
      }
    }
  }
  return candidates
}
