import { CrudList, type CrudConfig } from '@/components/CrudList'

interface VitalEntry {
  id: string
  metric: string
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
}

const METRIC_LABEL: Record<string, string> = {
  pressao_arterial: 'Pressão arterial',
  frequencia_cardiaca: 'Freq. cardíaca',
  glicemia: 'Glicemia',
  saturacao: 'Saturação',
  temperatura: 'Temperatura',
  outro_sinal: 'Outro',
}

const config: CrudConfig<VitalEntry> = {
  title: 'Sinais vitais',
  endpoint: '/api/sinais-vitais',
  listKey: 'vitals',
  editMethod: 'POST',
  noEdit: true, // a rota não expõe edição (paridade com a Web) — só criação/remoção
  addLabel: 'Registrar medição',
  emptyText: 'Nenhuma medição registrada.',
  fields: [
    { key: 'metric', label: 'Sinal', options: Object.entries(METRIC_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'value', label: 'Valor', placeholder: 'Ex.: 120/80' },
    { key: 'unit', label: 'Unidade', placeholder: 'Ex.: mmHg' },
    { key: 'label', label: 'Rótulo', placeholder: 'Se "Outro"' },
    { key: 'measuredOn', label: 'Data', placeholder: 'AAAA-MM-DD' },
    { key: 'notes', label: 'Observações', multiline: true },
  ],
  idOf: (v) => v.id,
  toForm: (v) => ({
    metric: v.metric,
    value: v.valueText,
    unit: v.unit ?? '',
    label: v.label ?? '',
    measuredOn: v.measuredOn ?? '',
    notes: v.notes ?? '',
  }),
  renderItem: (v) => ({
    title: `${v.label || METRIC_LABEL[v.metric] || v.metric}: ${v.valueText}${v.unit ? ` ${v.unit}` : ''}`,
    subtitle: v.measuredOn,
  }),
}

export default function SinaisVitaisScreen() {
  return <CrudList config={config} />
}
