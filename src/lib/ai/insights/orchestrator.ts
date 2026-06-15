// ============================================================
// SINTERA — Motor de Insights: Orquestração (o "fio")
// ============================================================
// Liga as peças do motor numa única chamada:
//   assembler → ruleset → engine → persistência (com render de template)
//
// ATENÇÃO — fronteira regulatória:
//   Usa o RuleSet aprovado (`CLINICAL_RULESET`) e a biblioteca de templates
//   (`TEMPLATE_LIBRARY`), ambos VAZIOS até aprovação clínica. Enquanto vazios,
//   esta função roda fim-a-fim e produz/grava ZERO insights — comportamento
//   seguro e intencional. Nada de saúde é classificado sem aprovação humana.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { assembleInsightContext } from './assembler'
import { evaluateRules, type RuleSet } from './engine'
import { CLINICAL_RULESET } from './rules.clinical'
import { persistRuleBasedInsights } from './persistence'
import { makeTemplateRenderer, TEMPLATE_LIBRARY } from './templates'

export interface GenerateResult {
  examId: string
  /** Quantidade de regras clínicas ativas (0 enquanto não houver aprovação). */
  rulesActive: number
  /** Candidatos produzidos pela engine. */
  candidates: number
  /** Linhas montadas para ai_insights. */
  built: number
  /** Linhas efetivamente persistidas (após dedup por content_hash). */
  upserted: number
}

/**
 * Gera (e persiste) insights rule-based de um exame, fim-a-fim.
 * `ruleset`/`library` são injetáveis para teste; em produção usam os artefatos
 * aprovados — hoje VAZIOS, logo o resultado é 0/0/0 (seguro).
 */
export async function generateRuleBasedInsights(
  supabase: SupabaseClient,
  params: {
    examId: string
    userId: string
    ruleset?: RuleSet
    library?: Record<string, string>
  },
): Promise<GenerateResult> {
  const ruleset = params.ruleset ?? CLINICAL_RULESET
  const library = params.library ?? TEMPLATE_LIBRARY

  const context = await assembleInsightContext(supabase, {
    examId: params.examId,
    userId: params.userId,
  })
  const candidates = evaluateRules(context, ruleset)
  const persisted = await persistRuleBasedInsights(supabase, {
    examId: params.examId,
    userId: params.userId,
    candidates,
    renderText: makeTemplateRenderer(library),
  })

  return {
    examId: params.examId,
    rulesActive: ruleset.length,
    candidates: candidates.length,
    built: persisted.built,
    upserted: persisted.upserted,
  }
}
