import { EventList } from '@/components/EventList'

// Agenda — eventos futuros da jornada (projeção 'upcoming' do domínio Agenda).
export default function AgendaScreen() {
  return <EventList title="Agenda" view="upcoming" canCreate canAct emptyText="Nenhum evento futuro." />
}
