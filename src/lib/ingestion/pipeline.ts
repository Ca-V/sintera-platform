// ============================================================
// SINTERA — Ingestão: pipeline de PÓS-INGESTÃO (INFRAESTRUTURA PERMANENTE)
// ============================================================
// Hook único chamado por QUALQUER origem (exame hoje; wearables/Apple Health/
// Google Health Connect/WHOOP/dispositivos amanhã) após a ingestão persistir
// seus dados. O produtor NÃO importa: todos emitem o mesmo IngestionEvent. O
// dispatch por origem é interno (união discriminada) — novas integrações plugam
// sem reescrever chamadores.
//
// GARANTIAS (críticas para "zero mudança de comportamento em produção"):
//   1. AUTOMÁTICO desligado por padrão (flags.ts). Flag off → retorna na hora,
//      sem I/O, com outcome='flag_off'. A flag desliga SÓ o disparo automático:
//      execução manual (rota /insights chama o orquestrador direto) e testes
//      (que injetam isEnabled) NÃO são afetados.
//   2. BEST-EFFORT: NUNCA lança. Todo erro é capturado e devolvido — a ingestão
//      do chamador jamais quebra por causa daqui.
//   3. IDEMPOTÊNCIA: garantida pela persistência (dedup por (exam_id,
//      content_hash) via upsert ignoreDuplicates + índice único
//      ai_insights_exam_hash_uidx sobre content_hash determinístico). Disparar
//      o hook N vezes para o mesmo recurso NÃO cria insights duplicados.
//   4. OBSERVABILIDADE: cada execução emite um PostIngestionResult completo
//      (quem, origem, tempo, contagem, desfecho) — não apenas erros.
//
// Ver docs/INGESTAO-PIPELINE.md.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateRuleBasedInsights } from '@/lib/ai/insights/orchestrator'
import { isPostIngestionInsightsEnabled } from './flags'
import type {
  IngestionEvent,
  IngestionSource,
  PostIngestionResult,
} from './types'

/** Saída mínima que o gerador precisa devolver (subconjunto de GenerateResult). */
export interface GenerationOutput {
  rulesActive: number
  candidates: number
  upserted: number
}

/** Dependências injetáveis (teste). Em produção todas usam o default real. */
export interface PostIngestionDeps {
  /** Sobrepõe o flag automático (teste/manual). Default: env INSIGHTS_POST_INGESTION. */
  isEnabled?: () => boolean
  /** Gera insights de um exame (teste). Default: orchestrator.generateRuleBasedInsights. */
  generateForExam?: (
    supabase: SupabaseClient,
    params: { examId: string; userId: string },
  ) => Promise<GenerationOutput>
  /** Sink de telemetria (teste). Default: log estruturado. */
  telemetry?: (result: PostIngestionResult) => void
  /** Relógio injetável (teste determinístico). Default: Date.now. */
  now?: () => number
}

/** Referência textual da origem (quem foi processado), para a telemetria. */
function sourceRefOf(source: IngestionSource): string {
  switch (source.kind) {
    case 'exam':     return source.examId
    case 'wearable': return source.provider
  }
}

/**
 * Telemetria default: linha estruturada e greppável. Nunca lança.
 * Silencia o estado estacionário `flag_off` — em produção (flag desligada) o
 * hook fica com FOOTPRINT ZERO (sem banco, sem resposta, sem log). Todos os
 * demais desfechos são observáveis. Um sink injetado (teste/observabilidade)
 * recebe TODOS os desfechos, inclusive flag_off.
 */
function defaultTelemetry(result: PostIngestionResult): void {
  if (result.outcome === 'flag_off') return
  try {
    console.log('[ingestion:telemetry]', JSON.stringify(result))
  } catch {
    /* telemetria nunca pode quebrar o fluxo */
  }
}

/**
 * Executa a pós-ingestão de um evento. Sempre resolve com um PostIngestionResult
 * observável (nunca rejeita). O chamador pode ignorar o retorno quando só quiser
 * o efeito.
 */
export async function runPostIngestion(
  supabase: SupabaseClient,
  event: IngestionEvent,
  deps: PostIngestionDeps = {},
): Promise<PostIngestionResult> {
  const isEnabled = deps.isEnabled ?? isPostIngestionInsightsEnabled
  const telemetry = deps.telemetry ?? defaultTelemetry
  const now = deps.now ?? Date.now
  const startedAt = now()

  const base = {
    source: event.source.kind,
    sourceRef: sourceRefOf(event.source),
    userId: event.userId,
  }
  const emit = (partial: Omit<PostIngestionResult, keyof typeof base | 'durationMs'>): PostIngestionResult => {
    const result: PostIngestionResult = { ...base, durationMs: now() - startedAt, ...partial }
    telemetry(result)
    return result
  }

  // 1. Portão automático default-off — em produção sai aqui, sem tocar o banco.
  if (!isEnabled()) {
    return emit({ outcome: 'flag_off', ran: false, insightsGenerated: 0, rulesActive: 0, candidates: 0 })
  }

  // 2. Dispatch por origem — best-effort.
  try {
    if (event.source.kind === 'exam') {
      const generate = deps.generateForExam ?? generateRuleBasedInsights
      const res = await generate(supabase, { examId: event.source.examId, userId: event.userId })
      return emit({
        outcome: res.rulesActive === 0 ? 'no_active_rules' : 'generated',
        ran: true,
        insightsGenerated: res.upserted,
        rulesActive: res.rulesActive,
        candidates: res.candidates,
      })
    }

    // Origens ainda não mapeadas a insights (ex.: wearables — Fase 2).
    return emit({ outcome: 'unsupported_source', ran: false, insightsGenerated: 0, rulesActive: 0, candidates: 0 })
  } catch (err) {
    return emit({
      outcome: 'error',
      ran: false,
      insightsGenerated: 0,
      rulesActive: 0,
      candidates: 0,
      error: (err instanceof Error ? err.message : String(err)).slice(0, 300),
    })
  }
}
