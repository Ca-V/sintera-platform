'use client'

// WEA-001 / HIP-001 — V2 Épico 3.1: dispara a sincronização ON-OPEN ao montar uma tela.
// A SINTERA sincroniza sozinha no retorno (sem o usuário clicar "Sincronizar agora"). Fire-and-forget:
// o servidor faz o throttle real (por última sync); aqui evitamos apenas repetir a chamada na mesma sessão.
import { useEffect } from 'react'

const SESSION_KEY = 'sintera:onopen-sync-at'
const CLIENT_THROTTLE_MS = 60_000 // no máximo uma chamada por minuto por sessão

export interface OnOpenSyncResult {
  synced: string[]
  newRecords: number       // medições NOVAS nesta sincronização (on-open)
  newSince: number         // V2 Aha-R2: novas DESDE A ÚLTIMA VISITA (mais fiel para "sua história cresceu")
  previousSeen: string | null // instante da última visita anterior (para destacar os registros novos — R3)
}

/**
 * Chama `/api/connectors/sync-open` ao montar. Quando a sincronização termina e algo foi sincronizado,
 * invoca `onSynced({ synced, newRecords })` — a tela recarrega e comunica o benefício ("a SINTERA trabalhou por você").
 */
export function useOnOpenSync(onSynced?: (result: OnOpenSyncResult) => void) {
  useEffect(() => {
    let active = true
    try {
      const last = Number(sessionStorage.getItem(SESSION_KEY) ?? 0)
      if (Date.now() - last < CLIENT_THROTTLE_MS) return
      sessionStorage.setItem(SESSION_KEY, String(Date.now()))
    } catch { /* sessionStorage indisponível → segue sem o throttle de sessão */ }

    fetch('/api/connectors/sync-open', { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then((res: { synced?: string[]; newRecords?: number; newSince?: number; previousSeen?: string | null } | null) => {
        if (!active || !res) return
        // Guarda a última visita anterior para o destaque "novo" (R3) nas telas de dados.
        try { if (res.previousSeen) sessionStorage.setItem('sintera:prev-visit', res.previousSeen) } catch { /* ignore */ }
        onSynced?.({ synced: res.synced ?? [], newRecords: res.newRecords ?? 0, newSince: res.newSince ?? 0, previousSeen: res.previousSeen ?? null })
      })
      .catch(() => { /* silencioso: sync automática nunca atrapalha a navegação */ })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
