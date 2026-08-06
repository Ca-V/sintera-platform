// HomeContainer — a raiz da aba "Início". FICA FORA de presentation/home/ (por isso PODE acessar dados): busca os
// próximos compromissos da Agenda e os INJETA na HomeShell por prop. Mantém a Home como camada de apresentação pura
// (INV-HOME-001). Este é o padrão para QUALQUER dado de outro módulo que a Home precise exibir (ADR-021/UX-002).
import { useEffect, useRef, useState } from 'react'
import { isClosedStatus, typeLabel, formatDateLongBR, type HealthEvent } from '@sintera/core'
import { HomeShell } from '../../home/HomeShell'
import type { UpcomingItem } from '../../home/slots/ProximosCompromissosSlot'
import { apiClient } from '../../../infrastructure/apiClient'

/** Próximos = eventos ABERTOS (não fechados) com data de hoje em diante, os 3 mais próximos. */
function toUpcoming(events: HealthEvent[]): UpcomingItem[] {
  const today = new Date().toISOString().slice(0, 10)
  return events
    .filter((e) => !isClosedStatus(e.status) && (e.date ?? '') >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 3)
    .map((e) => ({ id: e.id, title: e.title || typeLabel(e.type), dateLabel: formatDateLongBR(e.date), typeLabel: typeLabel(e.type) }))
}

export function HomeContainer() {
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([])
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    apiClient.agenda.listEvents().then((evs) => { if (alive.current) setUpcoming(toUpcoming(evs)) }).catch(() => { /* Home resiliente: sem compromissos se falhar */ })
    return () => { alive.current = false }
  }, [])
  return <HomeShell upcoming={upcoming} />
}
