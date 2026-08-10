// HomeContainer — raiz da aba "Início". FICA FORA de presentation/home/ (por isso PODE acessar dados): busca os
// próximos compromissos da Agenda e o NOME do perfil, e os INJETA na HomeShell por prop. Mantém a Home como
// apresentação pura (INV-HOME-001). Padrão para QUALQUER dado de outro módulo que a Home precise exibir (ADR-021/UX-002).
import { useEffect, useRef, useState } from 'react'
import { isClosedStatus, typeLabel, formatDateLongBR, type HealthEvent } from '@sintera/core'
import { HomeShell } from '../../home/HomeShell'
import type { UpcomingItem } from '../../home/slots/ProximosCompromissosSlot'
import { apiClient } from '../../../infrastructure/apiClient'

/** Próximo = evento ABERTO (não fechado) com data de hoje em diante, o MAIS próximo (paridade Web: um só). */
function toUpcoming(events: HealthEvent[]): UpcomingItem[] {
  const today = new Date().toISOString().slice(0, 10)
  return events
    .filter((e) => !isClosedStatus(e.status) && (e.date ?? '') >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 1)
    .map((e) => ({ id: e.id, title: e.title || typeLabel(e.type), dateLabel: formatDateLongBR(e.date), typeLabel: typeLabel(e.type) }))
}

export function HomeContainer() {
  const [data, setData] = useState<{ upcoming: UpcomingItem[]; name: string | null }>({ upcoming: [], name: null })
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    Promise.all([
      apiClient.agenda.listEvents().catch(() => [] as HealthEvent[]),
      apiClient.profile.getProfile().catch(() => null),
    ]).then(([evs, prof]) => {
      if (alive.current) setData({ upcoming: toUpcoming(evs), name: prof?.name ?? null })
    })
    return () => { alive.current = false }
  }, [])
  return <HomeShell upcoming={data.upcoming} name={data.name} />
}
