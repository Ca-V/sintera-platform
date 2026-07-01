// ============================================================
// renderVersion — decisão legacy × v2 por página (config central)
// ============================================================
// Sem feature flag genérica espalhada: um OBJETO central (RENDER_CONFIG) é a
// fonte única de qual versão cada página renderiza. A env NEXT_PUBLIC_<PAGE>_V2
// pode SOBREPOR em runtime (flip instantâneo no Vercel, sem deploy) para
// promoção/rollback. Default de tudo = legacy (produção intocada no monitoramento).
//
// ── CRITÉRIO DE REMOÇÃO DA CAMADA DE TRANSIÇÃO (não deixar virar permanente) ──
// Quando uma página estiver em 'v2' por N dias sem rollback (sugestão: 14 dias
// estáveis em produção), COLAPSAR o Entry:
//   1. a rota passa a renderizar o container New diretamente;
//   2. apaga-se o *Entry, o corpo Legacy e a entrada em RENDER_CONFIG/ENV.
// Assim `Route → PageEntry → (Legacy | New)` vira `Route → New`. O Entry existe
// só durante a migração — não é arquitetura definitiva.
// ============================================================

export type RenderVersion = 'legacy' | 'v2'
export type EntryPage = 'dashboard' | 'timeline' | 'indicator' | 'report'

/** Config CENTRAL (baseline no código). Editar aqui promove uma página. */
export const RENDER_CONFIG: Record<EntryPage, RenderVersion> = {
  dashboard: 'legacy',
  timeline: 'legacy',
  indicator: 'legacy',
  report: 'legacy',
}

// NEXT_PUBLIC_* são inlinados no build → referenciados estaticamente.
const ENV: Record<EntryPage, string | undefined> = {
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_V2,
  timeline: process.env.NEXT_PUBLIC_TIMELINE_V2,
  indicator: process.env.NEXT_PUBLIC_INDICATOR_V2,
  report: process.env.NEXT_PUBLIC_REPORT_V2,
}

/**
 * Versão a renderizar. Precedência: env explícita > RENDER_CONFIG.
 * 'true' → v2 · 'false' → legacy · ausente → baseline da config.
 * `override` só para teste (simula o valor da env).
 */
export function pageVersion(page: EntryPage, override?: string): RenderVersion {
  const env = override ?? ENV[page]
  if (env === 'true') return 'v2'
  if (env === 'false') return 'legacy'
  return RENDER_CONFIG[page]
}
