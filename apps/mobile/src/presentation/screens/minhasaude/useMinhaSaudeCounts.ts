// Hook de INJEÇÃO dos indicadores de conteúdo (§5d) do menu Minha Saúde. Busca as contagens por domínio
// (best-effort) e as entrega ao menu, que só as APRESENTA — a camada de navegação segue sem regra de negócio.
// Falha é silenciosa: sem contagem, o menu simplesmente não mostra o número (indicador é OPCIONAL).
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { MinhaSaudeCounts } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'

export function useMinhaSaudeCounts(): MinhaSaudeCounts | null {
  const [counts, setCounts] = useState<MinhaSaudeCounts | null>(null)
  const alive = useRef(true)

  const load = useCallback(() => {
    apiClient.summary.getMinhaSaudeCounts()
      .then(c => { if (alive.current) setCounts(c) })
      .catch(() => { /* best-effort: indicador é opcional */ })
  }, [])

  useEffect(() => { alive.current = true; load(); return () => { alive.current = false } }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  return counts
}
