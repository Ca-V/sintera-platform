// ============================================================
// SINTERA — DEMONSTRAÇÃO factual (NÃO-CLÍNICO)
// ============================================================
// Gera insights apenas a partir do FATO ARITMÉTICO: a posição do valor em
// relação à faixa de referência IMPRESSA no próprio laudo (abaixo/acima).
// NÃO autora juízo clínico: `clinical_flag` fica NULL, o texto é factual e
// não-diagnóstico, e tudo é marcado `synthetic = true`, `source = 'demo_factual'`.
//
// Propósito: permitir VER a plataforma funcionando de ponta a ponta para teste/
// apresentação, sem cruzar a fronteira clínica. Estes insights NÃO devem ser
// exibidos a usuárias reais (a página só os mostra em modo demonstração).
// O `CLINICAL_RULESET` real permanece vazio até aprovação do Responsável Clínico.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { assembleInsightContext } from './assembler'
import type { AssembledBiomarker } from './types'

export const DEMO_SOURCE = 'demo_factual'

/** Formata a faixa impressa no laudo de forma legível (sem inferir nada). */
function formatRange(b: AssembledBiomarker): string {
  const u = b.unit ? ` ${b.unit}` : ''
  if (b.referenceMin !== null && b.referenceMax !== null) return `${b.referenceMin} a ${b.referenceMax}${u}`
  if (b.referenceMin !== null) return `≥ ${b.referenceMin}${u}`
  if (b.referenceMax !== null) return `≤ ${b.referenceMax}${u}`
  return '—'
}

/**
 * Texto factual e não-diagnóstico para um biomarcador fora da faixa do laudo.
 * Pura/testável. Reporta apenas a posição aritmética do número — nunca "alto/
 * baixo é ruim", nunca diagnóstico, nunca conduta.
 */
export function factualDemoText(b: AssembledBiomarker): string {
  const name = b.displayName ?? b.name
  const u = b.unit ? ` ${b.unit}` : ''
  const dir = b.rangeStatus === 'below' ? 'abaixo' : 'acima'
  return (
    `DEMONSTRAÇÃO (sem validação clínica): ${name} = ${b.value ?? ''}${u} está ${dir} ` +
    `da faixa de referência impressa no seu laudo (${formatRange(b)}). ` +
    `Esta é uma observação factual sobre a posição do número, não um diagnóstico ` +
    `nem avaliação clínica. Converse com seu médico.`
  )
}

function contentHash(examId: string, biomarkerId: string): string {
  return createHash('sha256').update(`${DEMO_SOURCE}|${examId}|${biomarkerId}`).digest('hex')
}

/**
 * Gera (idempotente, via upsert) insights de demonstração factual para um exame.
 * Só cobre biomarcadores fora da faixa impressa. Retorna a quantidade gerada.
 */
export async function generateFactualDemoInsights(
  supabase: SupabaseClient,
  params: { examId: string; userId: string },
): Promise<{ generated: number }> {
  const { examId, userId } = params
  const ctx = await assembleInsightContext(supabase, { examId, userId })
  const candidates = ctx.outOfPrintedRange
  if (candidates.length === 0) return { generated: 0 }

  const rows = candidates.map(b => ({
    user_id: userId,
    exam_id: examId,
    insight: factualDemoText(b),
    category: b.category,
    insight_type: 'biomarker',
    biomarker_ids: [b.id],
    clinical_flag: null,          // demo NÃO classifica clinicamente
    source: DEMO_SOURCE,
    synthetic: true,              // walled off — nunca exibido a usuárias reais
    content_hash: contentHash(examId, b.id),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ai_insights')
    .upsert(rows, { onConflict: 'exam_id,content_hash' })
  if (error) throw new Error(`Falha ao gravar demonstração: ${error.message}`)

  return { generated: rows.length }
}
