// ============================================================
// SINTERA — Ingestão: feature flags
// ============================================================
// Portão de ativação da PÓS-INGESTÃO (geração de insights após a ingestão de
// dados). DESLIGADO por padrão — em produção, com o flag ausente, o pipeline é
// um no-op e o comportamento das rotas atuais permanece BYTE-IDÊNTICO.
//
// Escolha deliberada de um env flag (e não do dispatcher de rollout via banco,
// tipo `canonical_route`): esta etapa é "preparada, porém desabilitada". Um env
// flag default-off não toca o banco de produção e é trivial de revisar/reverter.
// Quando a ativação for aprovada, pode-se evoluir para o mesmo padrão de rollout
// controlado (allowlist/percent) já usado na escrita canônica — ver docs.
//
// Valores aceitos como "ligado": 'on', '1', 'true' (case-insensitive). Qualquer
// outra coisa (inclusive ausência) = DESLIGADO.
// ============================================================

const TRUTHY = new Set(['on', '1', 'true'])

/** Interpreta um valor de env como flag booleano (default OFF). Puro/testável. */
export function isFlagOn(raw: string | undefined | null): boolean {
  return raw != null && TRUTHY.has(raw.trim().toLowerCase())
}

/**
 * Geração de insights como etapa de pós-ingestão. DEFAULT OFF.
 * Ligar só em ambiente de teste/homologação até a revisão arquitetural e a
 * aprovação clínica das regras/templates.
 */
export function isPostIngestionInsightsEnabled(): boolean {
  return isFlagOn(process.env.INSIGHTS_POST_INGESTION)
}
