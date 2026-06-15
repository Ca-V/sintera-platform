// ============================================================
// SINTERA — Motor de Insights: Persistência em ai_insights (mecanismo)
// ============================================================
// Converte os candidatos produzidos pelo motor determinístico (engine.ts)
// em linhas de `ai_insights`, com proveniência e deduplicação.
//
// ATENÇÃO — fronteira regulatória:
//   Este módulo NÃO gera texto clínico. O texto educativo de cada insight
//   (`insight`) é produzido por um RENDERIZADOR DE TEMPLATE injetado de fora
//   (`renderText`) — a biblioteca de templates é conteúdo clínico/produto,
//   aprovado à parte, e não vive aqui.
//
//   Como o RuleSet em produção está VAZIO (sem aprovação clínica), não há
//   candidatos; logo `renderText` nunca é chamado e nada é gravado. O
//   mecanismo existe, é testável e é seguro desde já.
// ============================================================

import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClinicalFlag, InsightType } from './types'
import type { InsightCandidate } from './engine'

/** Linha pronta para inserir em `ai_insights` (subconjunto do schema). */
export interface InsightInsertRow {
  user_id: string
  exam_id: string
  insight: string
  insight_type: InsightType
  clinical_flag: ClinicalFlag
  template_key: string
  biomarker_ids: string[]
  priority: 'low' | 'medium' | 'high'
  source: 'rule_based'
  content_hash: string
  model_version: null
  synthetic: false
}

/** Renderizador de template: candidato → texto educativo. Conteúdo clínico, injetado de fora. */
export type TemplateRenderer = (candidate: InsightCandidate) => string

export interface BuildOptions {
  examId: string
  userId: string
  renderText: TemplateRenderer
}

/**
 * Hash estável para deduplicação por (exam_id, content_hash) — casa com o
 * índice único `ai_insights_exam_hash_uidx` (migração 022). Determinístico:
 * mesma origem clínica → mesmo hash, evitando insights duplicados em reanálise.
 */
export function contentHashFor(candidate: InsightCandidate): string {
  const ids = [...candidate.biomarkerIds].sort().join(',')
  const basis = `${candidate.templateKey} ${candidate.clinicalFlag} ${candidate.insightType} ${ids}`
  return createHash('sha256').update(basis, 'utf8').digest('hex')
}

/**
 * Mapeia candidatos → linhas de ai_insights. Puro (não toca o banco).
 * Com `candidates` vazio retorna [] e nunca chama `renderText`.
 */
export function buildInsightRows(
  candidates: InsightCandidate[],
  opts: BuildOptions,
): InsightInsertRow[] {
  return candidates.map(c => {
    const insight = opts.renderText(c)
    if (!insight || insight.trim() === '') {
      throw new Error(`Template vazio para template_key="${c.templateKey}" — renderizador deve produzir texto.`)
    }
    return {
      user_id: opts.userId,
      exam_id: opts.examId,
      insight,
      insight_type: c.insightType,
      clinical_flag: c.clinicalFlag,
      template_key: c.templateKey,
      biomarker_ids: c.biomarkerIds,
      priority: c.priority,
      source: 'rule_based',
      content_hash: contentHashFor(c),
      model_version: null,
      synthetic: false,
    }
  })
}

export interface PersistResult {
  built: number
  /** linhas efetivamente enviadas ao banco (após dedup local por content_hash). */
  upserted: number
}

/**
 * Persiste candidatos rule-based em `ai_insights`, de forma idempotente.
 * Deduplica por (exam_id, content_hash) via upsert com ignoreDuplicates —
 * reanalisar o mesmo exame não cria insights repetidos.
 * Com `candidates` vazio é um no-op (não escreve nada).
 */
export async function persistRuleBasedInsights(
  supabase: SupabaseClient,
  params: { examId: string; userId: string; candidates: InsightCandidate[]; renderText: TemplateRenderer },
): Promise<PersistResult> {
  const rows = buildInsightRows(params.candidates, {
    examId: params.examId,
    userId: params.userId,
    renderText: params.renderText,
  })
  if (rows.length === 0) return { built: 0, upserted: 0 }

  // Dedup local: mesma content_hash pode repetir se duas regras convergirem.
  const seen = new Set<string>()
  const unique = rows.filter(r => (seen.has(r.content_hash) ? false : (seen.add(r.content_hash), true)))

  const { error } = await supabase
    .from('ai_insights')
    .upsert(unique as unknown as never[], { onConflict: 'exam_id,content_hash', ignoreDuplicates: true })

  if (error) throw new Error(`Falha ao persistir insights: ${error.message}`)
  return { built: rows.length, upserted: unique.length }
}
