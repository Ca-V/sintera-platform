// ============================================================
// SINTERA — Motor de Insights: Loader CSV → RuleSet (mecanismo)
// ============================================================
// Transcreve o CSV de regras (docs/clinical/regras-clinicas-template.csv)
// para o RuleSet que o motor determinístico (engine.ts) consome.
//
// ATENÇÃO — fronteira regulatória:
//   Este módulo NÃO inventa nenhum critério clínico. Ele apenas LÊ o que a
//   clínica preencheu e ASSINOU. Uma linha só vira regra quando tem
//   `clinical_flag` válido, `template_key` preenchido E `approved_by`
//   preenchido (assinatura). Linhas em branco/sem assinatura são ignoradas.
//
//   Consequência: com o CSV atual (todas as colunas clínicas em branco), o
//   resultado é um RuleSet VAZIO — e o motor não emite nenhum insight. Esse é
//   o comportamento seguro e esperado até a aprovação clínica.
// ============================================================

import type { ClinicalFlag, InsightType, RangeStatus } from './types'
import type { InsightRule, RuleCondition, RuleSet } from './engine'

const CLINICAL_FLAGS = new Set<string>(['atencao_imediata', 'acompanhar', 'normal'])
const PRIORITIES = new Set<string>(['low', 'medium', 'high'])
const INSIGHT_TYPES = new Set<string>(['biomarker', 'cluster', 'longitudinal', 'priority'])
const RANGE_STATUSES = new Set<string>(['below', 'above', 'within', 'no_reference', 'non_numeric'])

/** Motivo pelo qual uma linha do CSV não virou regra. */
export type SkipReason =
  | 'pending'      // linha em branco — clínica ainda não preencheu (esperado)
  | 'incomplete'   // preenchida parcialmente (falta flag, template ou assinatura)

export interface SkippedRule {
  line: number
  catalogCode: string
  reason: SkipReason
}

export interface RuleParseError {
  line: number
  catalogCode: string
  message: string
}

export interface RulesetParseResult {
  /** Regras válidas, aprovadas e assinadas. VAZIO se o CSV não tem linhas aprovadas. */
  ruleset: RuleSet
  /** Linhas ignoradas (pendentes ou incompletas) — telemetria, não erro. */
  skipped: SkippedRule[]
  /** Linhas com valores inválidos (ex.: clinical_flag digitado errado). */
  errors: RuleParseError[]
}

// ── Parser CSV mínimo (RFC4180: aspas, vírgulas internas, CRLF) ───────────────

/** Converte texto CSV em matriz de campos. Lida com campos entre aspas. */
export function parseCsvRows(text: string): string[][] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text // remove BOM
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++ } // aspas escapada ""
        else inQuotes = false
      } else field += ch
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\r') { /* ignora */ }
    else if (ch === '\n') { row.push(field); rows.push(row); field = ''; row = [] }
    else field += ch
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  // descarta linhas totalmente vazias
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

// ── Mapeamento de condição ────────────────────────────────────────────────────

function parseCondition(kind: string, params: string): RuleCondition | { error: string } {
  const k = kind.trim()
  const p = params.trim()
  if (k === 'always') return { kind: 'always' }

  if (k === 'rangeStatus') {
    const tokens = p.split('|').map(t => t.trim()).filter(Boolean)
    if (tokens.length === 0) return { error: 'rangeStatus sem status em condition_params' }
    const bad = tokens.filter(t => !RANGE_STATUSES.has(t))
    if (bad.length) return { error: `rangeStatus inválido: ${bad.join(', ')}` }
    return { kind: 'rangeStatus', status: tokens as RangeStatus[] }
  }

  if (k === 'numericThreshold') {
    const m = /^(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/.exec(p)
    if (!m) return { error: `numericThreshold inválido: "${p}" (esperado ex.: ">=126")` }
    return { kind: 'numericThreshold', op: m[1] as '<' | '<=' | '>' | '>=', value: Number(m[2]) }
  }

  return { error: `condition_kind desconhecido: "${k}"` }
}

// ── Loader principal ──────────────────────────────────────────────────────────

/**
 * Transcreve o CSV de regras para um RuleSet. Só inclui linhas APROVADAS
 * (clinical_flag + template_key + approved_by preenchidos e válidos).
 * Nunca infere valores clínicos.
 */
export function parseRulesetCsv(csvText: string): RulesetParseResult {
  const rows = parseCsvRows(csvText)
  const result: RulesetParseResult = { ruleset: [], skipped: [], errors: [] }
  if (rows.length === 0) return result

  const header = rows[0].map(h => h.trim())
  const col = (name: string) => header.indexOf(name)
  const idx = {
    catalogCode: col('catalog_code'),
    conditionKind: col('condition_kind'),
    conditionParams: col('condition_params'),
    clinicalFlag: col('clinical_flag'),
    templateKey: col('template_key'),
    insightType: col('insight_type'),
    priority: col('priority'),
    approvedBy: col('approved_by'),
  }
  if (idx.catalogCode < 0) {
    result.errors.push({ line: 1, catalogCode: '', message: 'cabeçalho sem coluna catalog_code' })
    return result
  }

  const get = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : '')

  for (let n = 1; n < rows.length; n++) {
    const r = rows[n]
    const line = n + 1
    const catalogCode = get(r, idx.catalogCode)
    const clinicalFlag = get(r, idx.clinicalFlag)
    const templateKey = get(r, idx.templateKey)
    const approvedBy = get(r, idx.approvedBy)

    // Gate de aprovação: precisa de flag + template + assinatura.
    const hasFlag = clinicalFlag !== ''
    const hasTemplate = templateKey !== ''
    const hasSignature = approvedBy !== ''

    if (!hasFlag && !hasTemplate && !hasSignature) {
      result.skipped.push({ line, catalogCode, reason: 'pending' })
      continue
    }
    if (!hasFlag || !hasTemplate || !hasSignature) {
      result.skipped.push({ line, catalogCode, reason: 'incomplete' })
      continue
    }

    // A partir daqui a linha se declara aprovada — validamos rigorosamente.
    if (!CLINICAL_FLAGS.has(clinicalFlag)) {
      result.errors.push({ line, catalogCode, message: `clinical_flag inválido: "${clinicalFlag}"` })
      continue
    }
    const insightTypeRaw = get(r, idx.insightType) || 'biomarker'
    if (!INSIGHT_TYPES.has(insightTypeRaw)) {
      result.errors.push({ line, catalogCode, message: `insight_type inválido: "${insightTypeRaw}"` })
      continue
    }
    const priorityRaw = get(r, idx.priority) || 'medium'
    if (!PRIORITIES.has(priorityRaw)) {
      result.errors.push({ line, catalogCode, message: `priority inválido: "${priorityRaw}"` })
      continue
    }
    const cond = parseCondition(get(r, idx.conditionKind), get(r, idx.conditionParams))
    if ('error' in cond) {
      result.errors.push({ line, catalogCode, message: cond.error })
      continue
    }

    const rule: InsightRule = {
      catalogCode,
      when: cond,
      clinicalFlag: clinicalFlag as ClinicalFlag,
      templateKey,
      insightType: insightTypeRaw as InsightType,
      priority: priorityRaw as 'low' | 'medium' | 'high',
    }
    result.ruleset.push(rule)
  }

  return result
}
