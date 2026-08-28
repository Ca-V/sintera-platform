// HomeContainer — raiz da aba "Início". FICA FORA de presentation/home/ (por isso PODE acessar dados): busca o
// NOME do perfil e os RESULTADOS da busca, e os injeta na HomeShell por prop. A Home segue apresentação pura
// (INV-HOME-001), guardada por teste.
//
// A BUSCA MORA AQUI, e não no slot, por essa invariante. O slot recebe o texto, os achados e o "procurando";
// devolve só a intenção de digitar. É a mesma injeção que já traz o nome do perfil.
import { useCallback, useEffect, useRef, useState } from 'react'
import { shouldQuery, type SearchHit } from '@sintera/core'
import { HomeShell } from '../../home/HomeShell'
import { apiClient } from '../../../infrastructure/apiClient'

/**
 * Espera antes de consultar. Cada busca são onze consultas em paralelo; disparar a cada tecla digitada
 * multiplicaria isso por letra e deixaria a lista pulando enquanto a pessoa ainda escreve.
 */
const ESPERA_MS = 300

export function HomeContainer() {
  const [name, setName] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [procurando, setProcurando] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    apiClient.profile.getProfile()
      .then((prof) => { if (alive.current) setName(prof?.name ?? null) })
      .catch(() => { /* a saudação degrada para o texto sem nome; não derruba a tela */ })
    return () => { alive.current = false }
  }, [])

  useEffect(() => {
    // `shouldQuery` vem do core: as duas pontas param de buscar no MESMO ponto.
    if (!shouldQuery(busca)) { setHits([]); setProcurando(false); return }

    setProcurando(true)
    // Cada nova tecla cancela a consulta anterior AINDA NÃO DISPARADA. A que já saiu é descartada pelo
    // `cancelado` abaixo: sem isso, uma resposta lenta de "vit" chegaria depois de "vitamina" e sobrescreveria
    // a lista certa pela antiga.
    let cancelado = false
    const timer = setTimeout(() => {
      apiClient.search.searchRecords(busca)
        .then((r) => { if (!cancelado && alive.current) setHits(r) })
        .catch(() => { if (!cancelado && alive.current) setHits([]) })
        .finally(() => { if (!cancelado && alive.current) setProcurando(false) })
    }, ESPERA_MS)

    return () => { cancelado = true; clearTimeout(timer) }
  }, [busca])

  const limparBusca = useCallback(() => { setBusca(''); setHits([]) }, [])

  return (
    <HomeShell
      name={name}
      busca={busca}
      onBusca={setBusca}
      hits={hits}
      procurando={procurando}
      onLimparBusca={limparBusca}
    />
  )
}
