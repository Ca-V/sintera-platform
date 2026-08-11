// ============================================================
// SINTERA — Ingestão: contratos source-agnostic (INFRAESTRUTURA PERMANENTE)
// ============================================================
// Este contrato NÃO pertence ao Sprint 2 — é infraestrutura permanente da
// plataforma. Representa o evento "uma nova informação clínica estruturada foi
// incorporada à SINTERA", independente de QUEM a produziu.
//
// A origem muda; o pipeline permanece o mesmo. O mesmo evento serve exame,
// wearables (Oura/Garmin/Strava), Apple Health, Google Health Connect, WHOOP,
// dispositivos médicos e integrações futuras. Quem dispara o hook NÃO importa:
// todos emitem exatamente este IngestionEvent.
//
// Fronteira regulatória: nada aqui emite juízo clínico. A geração de insights só
// produz conteúdo quando houver regras/templates clínicos aprovados (hoje vazios)
// E o flag automático estiver ligado (hoje desligado). Ver docs/INGESTAO-PIPELINE.md.
// ============================================================

/**
 * Origem de uma ingestão. União discriminada extensível: adicionar uma nova
 * integração é acrescentar um membro — sem tocar o pipeline nem os consumidores.
 */
export type IngestionSource =
  | { kind: 'exam'; examId: string }
  | { kind: 'wearable'; provider: string; readingBatchId?: string } // Fase 2 — ainda não mapeada a insights

export type IngestionSourceKind = IngestionSource['kind']

/**
 * Evento de ingestão: informação clínica estruturada incorporada para uma pessoa,
 * vinda de uma origem. É a ÚNICA coisa que qualquer produtor precisa emitir.
 */
export interface IngestionEvent {
  userId: string
  source: IngestionSource
}

/**
 * Desfecho classificado da pós-ingestão — a espinha da observabilidade.
 * Responde objetivamente "por que (não) gerou insights":
 *   - generated          → rodou com regras ativas (ver insightsGenerated)
 *   - no_active_rules     → rodou, mas o ruleset clínico está vazio (esperado hoje)
 *   - flag_off            → geração automática desligada (default de produção)
 *   - unsupported_source  → origem ainda não mapeada a insights (ex.: wearable)
 *   - error               → falha capturada (best-effort; nunca propaga)
 */
export type PostIngestionOutcome =
  | 'generated'
  | 'no_active_rules'
  | 'flag_off'
  | 'unsupported_source'
  | 'error'

/**
 * Resultado observável da pós-ingestão. SEMPRE retornado (o hook nunca lança) e
 * SEMPRE emitido na telemetria. Permite responder depois: quem disparou, qual a
 * origem, quanto tempo levou, quantos insights saíram e por que não saíram.
 */
export interface PostIngestionResult {
  /** Origem (exam | wearable | ...). */
  source: IngestionSourceKind
  /** Referência da origem: examId, provider, etc. (quem foi processado). */
  sourceRef: string | null
  /** Dona dos dados (quem). */
  userId: string
  /** Desfecho classificado (por que gerou/não gerou). */
  outcome: PostIngestionOutcome
  /** O gerador executou de fato? (false em flag_off/unsupported_source). */
  ran: boolean
  /** Insights efetivamente persistidos (0 enquanto regras/templates vazios). */
  insightsGenerated: number
  /** Regras clínicas ATIVAS no momento (0 até aprovação clínica). */
  rulesActive: number
  /** Candidatos produzidos pela engine antes da persistência. */
  candidates: number
  /** Tempo de execução do hook, ms. */
  durationMs: number
  /** Mensagem de erro (best-effort), quando outcome === 'error'. */
  error?: string
}
