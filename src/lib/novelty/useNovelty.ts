'use client'

// NOV-001 — hook cliente: fonte ÚNICA de novidade para toda a UI (banner do Painel, selos "Novo", futuras
// notificações). No mount, busca o estado em /api/novelty (que também faz o refresh das fontes com throttle).
// - Superfície de AVISO (Painel Inicial): usa `countOf(stream)` para refletir a novidade. NÃO chama markSeen.
// - Superfície de CONSUMO (o módulo onde o conteúdo vive): usa `sinceOf(stream)` para destacar os novos e chama
//   `markSeen(stream)` ao abrir — reconhecimento natural. `sinceOf` continua com o valor desta visita (markSeen só
//   avança o estado no servidor), então os selos aparecem nesta visita e somem na próxima.
import { useCallback, useEffect, useRef, useState } from 'react'

interface NoveltyEntry { count: number; since: string | null }
type NoveltyState = Record<string, NoveltyEntry>

export interface UseNovelty {
  ready: boolean
  countOf: (stream: string) => number
  sinceOf: (stream: string) => string | null
  markSeen: (stream: string) => void
}

/**
 * @param onRefreshed  chamado após a leitura (as fontes automáticas já sincronizaram) — a superfície pode recarregar
 *                     seus próprios dados para exibir o que acabou de chegar.
 */
export function useNovelty(onRefreshed?: () => void): UseNovelty {
  const [state, setState] = useState<NoveltyState>({})
  const [ready, setReady] = useState(false)
  const onRefreshedRef = useRef(onRefreshed)
  onRefreshedRef.current = onRefreshed

  useEffect(() => {
    let active = true
    fetch('/api/novelty', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { streams?: NoveltyState } | null) => {
        if (!active) return
        setState(res?.streams ?? {})
        setReady(true)
        onRefreshedRef.current?.()
      })
      .catch(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  const countOf = useCallback((stream: string) => state[stream]?.count ?? 0, [state])
  const sinceOf = useCallback((stream: string) => state[stream]?.since ?? null, [state])
  const markSeen = useCallback((stream: string) => {
    fetch('/api/novelty/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stream }),
    }).catch(() => { /* best-effort: reconhecimento nunca bloqueia a navegação */ })
  }, [])

  return { ready, countOf, sinceOf, markSeen }
}
