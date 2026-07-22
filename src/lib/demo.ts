// Gating de FUNCIONALIDADES DE DEMONSTRAÇÃO (fundadora 21/07): nada de demo/mock/seed acessível a usuários de
// produção. Demo só liga (a) em desenvolvimento, ou (b) em produção com AÇÃO EXPLÍCITA do desenvolvedor via env.
//
// Cobre: o CONECTOR mock (Conexões) e a geração de INSIGHTS de demonstração (?demo=1 / /api/insights/demo).
// Server lê `ENABLE_DEMO_FEATURES`; client lê `NEXT_PUBLIC_ENABLE_DEMO_FEATURES` (ambos ausentes em produção = OFF).
export function demoFeaturesEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ENABLE_DEMO_FEATURES === 'true' || process.env.NEXT_PUBLIC_ENABLE_DEMO_FEATURES === 'true'
}
