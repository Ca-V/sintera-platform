'use client'

// WEA-001 / HIP-001 — V2 Épico 3.1: dispara a sincronização ON-OPEN ao montar uma tela.
// A SINTERA sincroniza sozinha no retorno (sem o usuário clicar "Sincronizar agora"). Fire-and-forget:
// o servidor faz o throttle real (por última sync); aqui evitamos apenas repetir a chamada na mesma sessão.
import { useEffect } from 'react'

const SESSION_KEY = 'sintera:onopen-sync-at'
const CLIENT_THROTTLE_MS = 60_000 // no máximo uma chamada por minuto por sessão

/**
 * Chama `/api/connectors/sync-open` ao montar. Quando a sincronização termina (algo foi sincronizado),
 * invoca `onSynced` — usado pela tela para recarregar e mostrar o dado novo.
 */
export function useOnOpenSync(onSynced?: (synced: string[]) => void) {
  useEffect(() => {
    let active = true
    try {
      const last = Number(sessionStorage.getItem(SESSION_KEY) ?? 0)
      if (Date.now() - last < CLIENT_THROTTLE_MS) return
      sessionStorage.setItem(SESSION_KEY, String(Date.now()))
    } catch { /* sessionStorage indisponível → segue sem o throttle de sessão */ }

    fetch('/api/connectors/sync-open', { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then((res: { synced?: string[] } | null) => {
        if (active && res?.synced?.length) onSynced?.(res.synced)
      })
      .catch(() => { /* silencioso: sync automática nunca atrapalha a navegação */ })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
