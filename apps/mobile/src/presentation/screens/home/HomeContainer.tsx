// HomeContainer — raiz da aba "Início". FICA FORA de presentation/home/ (por isso PODE acessar dados): busca o
// NOME do perfil e o injeta na HomeShell por prop, mantendo a Home como apresentação pura (INV-HOME-001).
// Padrão para QUALQUER dado de outro módulo que a Home venha a exibir (ADR-021/UX-002).
//
// A busca dos próximos compromissos saiu junto com o cartão que os mostrava (28/08): a Home deixou de exibir
// dado de agenda, então deixou também de ir buscá-lo. Manter a consulta serviria só para gastar rede numa tela
// que não mostra o resultado — e sugeriria, a quem lesse depois, que a Home ainda depende da Agenda.
import { useEffect, useRef, useState } from 'react'
import { HomeShell } from '../../home/HomeShell'
import { apiClient } from '../../../infrastructure/apiClient'

export function HomeContainer() {
  const [name, setName] = useState<string | null>(null)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    apiClient.profile.getProfile()
      .then((prof) => { if (alive.current) setName(prof?.name ?? null) })
      .catch(() => { /* a saudação degrada para o texto sem nome; não derruba a tela */ })
    return () => { alive.current = false }
  }, [])
  return <HomeShell name={name} />
}
