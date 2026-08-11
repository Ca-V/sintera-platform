// ============================================================
// SINTERA — Fundação de API: acesso a tabelas ainda não tipadas
// ============================================================
// Muitas tabelas (health_conditions, body_metrics, …) ainda não estão nos tipos
// gerados do Supabase, o que espalhava `(supabase as any).from(...)` por serviços
// e páginas. O cast fica CONTIDO neste único ponto da plataforma: quando os tipos
// forem gerados, basta tipar aqui e a segurança propaga a todos os consumidores.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/** Query builder de uma tabela, com o cast não-tipado isolado neste ponto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(supabase: SupabaseClient, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table)
}
