import { EventList } from '@/components/EventList'

// Gastos — projeção 'financial' do domínio Agenda (eventos realizados com valor).
export default function GastosScreen() {
  return <EventList title="Gastos" view="financial" showAmount emptyText="Nenhum gasto registrado." />
}
