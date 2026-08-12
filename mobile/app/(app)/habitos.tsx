import { CrudList, type CrudConfig } from '@/components/CrudList'

interface Habit {
  id: string
  category: string
  description: string
  frequency: string | null
  notes: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  atividade_fisica: 'Atividade física',
  sono: 'Sono',
  tabagismo: 'Tabagismo',
  alcool: 'Álcool',
  alimentacao: 'Alimentação',
  hidratacao: 'Hidratação',
  outro: 'Outro',
}

const config: CrudConfig<Habit> = {
  title: 'Hábitos',
  endpoint: '/api/habitos',
  listKey: 'habits',
  editMethod: 'PATCH',
  addLabel: 'Adicionar hábito',
  emptyText: 'Nenhum hábito registrado.',
  fields: [
    { key: 'category', label: 'Categoria', options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'description', label: 'Descrição', placeholder: 'Ex.: Caminhada 30min' },
    { key: 'frequency', label: 'Frequência', placeholder: 'Ex.: 3x por semana' },
    { key: 'notes', label: 'Observações', multiline: true },
  ],
  idOf: (h) => h.id,
  toForm: (h) => ({
    category: h.category,
    description: h.description,
    frequency: h.frequency ?? '',
    notes: h.notes ?? '',
  }),
  renderItem: (h) => ({
    title: h.description,
    subtitle: [CATEGORY_LABEL[h.category], h.frequency].filter(Boolean).join(' · '),
  }),
}

export default function HabitosScreen() {
  return <CrudList config={config} />
}
