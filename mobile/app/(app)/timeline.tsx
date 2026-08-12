import { EventList } from '@/components/EventList'

// Histórico — eventos passados da jornada (projeção 'historical' do domínio Agenda).
export default function TimelineScreen() {
  return <EventList title="Histórico" view="historical" emptyText="Nenhum evento no histórico." />
}
