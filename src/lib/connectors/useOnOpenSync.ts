'use client'

// WEA-001 / HIP-001 — V2 Aha: ao montar uma tela, dispara a sincronização ON-OPEN e obtém o estado PERSISTENTE
// de "novo desde a última visita" (calculado no servidor). A SINTERA sincroniza sozinha; o aviso/selo derivam do
// servidor (não de sessão), então aparecem de forma consistente em qualquer tela até serem reconhecidos.
import { useEffect } from 'react'

export interface OnOpenSyncResult {
  synced: string[]
  newRecords: number       // medições incorporadas nesta sincronização (on-open)
  newCount: number         // medições automáticas NOVAS desde a última visita (persistente — base do aviso)
  since: string | null     // instante da última visita (para destacar os registros novos — selo)
}

/**
 * Chama `/api/connectors/sync-open` ao montar (o próprio servidor faz o throttle da sincronização). Entrega o
 * estado atual via `onResult` — a tela decide mostrar o aviso (newCount > 0) e destacar os novos (created_at > since).
 */
export function useOnOpenSync(onResult?: (result: OnOpenSyncResult) => void) {
  useEffect(() => {
    let active = true
    fetch('/api/connectors/sync-open', { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then((res: Partial<OnOpenSyncResult> | null) => {
        if (!active || !res) return
        onResult?.({ synced: res.synced ?? [], newRecords: res.newRecords ?? 0, newCount: res.newCount ?? 0, since: res.since ?? null })
      })
      .catch(() => { /* silencioso: a sincronização automática nunca atrapalha a navegação */ })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Reconhece o aviso "sua história cresceu": marca a última visita AGORA (só então o dado já visto deixa de contar). */
export function acknowledgeSeen(): void {
  fetch('/api/connectors/seen', { method: 'POST' }).catch(() => { /* best-effort */ })
}
