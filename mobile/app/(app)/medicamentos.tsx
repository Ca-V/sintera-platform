import { CrudList, type CrudConfig } from '@/components/CrudList'

interface Medication {
  id: string
  name: string
  kind: string
  brand: string | null
  dose: string | null
  frequency: string | null
  startedOn: string | null
  untilOn: string | null
  status: string
  notes: string | null
  repurchaseReminder: boolean
  repurchaseFreq: string | null
  purchasedOn: string | null
  amountCents: number | null
}

const KIND_LABEL: Record<string, string> = {
  medicamento: 'Medicamento',
  suplemento: 'Suplemento',
  produto: 'Produto',
  dispositivo: 'Dispositivo',
  outro: 'Outro',
}
const STATUS_LABEL: Record<string, string> = {
  em_uso: 'Em uso', programado: 'Programado', suspenso: 'Suspenso', encerrado: 'Encerrado',
}

const config: CrudConfig<Medication> = {
  title: 'Medicamentos',
  endpoint: '/api/medicamentos',
  listKey: 'meds',
  editMethod: 'POST',
  addLabel: 'Adicionar medicamento',
  emptyText: 'Nenhum medicamento registrado.',
  fields: [
    { key: 'name', label: 'Nome', placeholder: 'Ex.: Losartana' },
    { key: 'kind', label: 'Tipo', options: Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'dose', label: 'Dose', placeholder: 'Ex.: 50mg' },
    { key: 'frequency', label: 'Frequência', placeholder: 'Ex.: 1x ao dia' },
    { key: 'brand', label: 'Marca' },
    { key: 'status', label: 'Status', options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'startedOn', label: 'Início', placeholder: 'AAAA-MM-DD' },
    { key: 'untilOn', label: 'Até', placeholder: 'AAAA-MM-DD' },
    { key: 'notes', label: 'Observações', multiline: true },
    { key: 'repurchase', label: 'Lembrete de recompra', bool: true },
    { key: 'repurchaseFreq', label: 'A cada (recompra)', placeholder: 'Ex.: 30 dias' },
    { key: 'purchasedOn', label: 'Data da compra', placeholder: 'AAAA-MM-DD (vira gasto)' },
    { key: 'amount', label: 'Valor pago', placeholder: 'Ex.: 45,90', keyboardType: 'numeric' },
  ],
  idOf: (m) => m.id,
  toForm: (m) => ({
    name: m.name,
    kind: m.kind,
    dose: m.dose ?? '',
    frequency: m.frequency ?? '',
    brand: m.brand ?? '',
    status: m.status,
    startedOn: m.startedOn ?? '',
    untilOn: m.untilOn ?? '',
    notes: m.notes ?? '',
    repurchase: m.repurchaseReminder ? 'true' : 'false',
    repurchaseFreq: m.repurchaseFreq ?? '',
    purchasedOn: m.purchasedOn ?? '',
    amount: m.amountCents != null ? (m.amountCents / 100).toFixed(2) : '',
  }),
  renderItem: (m) => ({
    title: [m.name, m.dose].filter(Boolean).join(' · '),
    subtitle: [KIND_LABEL[m.kind], m.frequency, STATUS_LABEL[m.status]].filter(Boolean).join(' · '),
  }),
}

export default function MedicamentosScreen() {
  return <CrudList config={config} />
}
