import { CrudList, type CrudConfig } from '@/components/CrudList'

interface Resource {
  id: string
  resourceType: string
  name: string
  brand: string | null
  prescriber: string | null
  startedOn: string | null
  untilDate: string | null
  status: string
  notes: string | null
}

const TYPE_LABEL: Record<string, string> = {
  correcao_visual: 'Correção visual',
  dispositivo_medico: 'Dispositivo médico',
  protese_ortese: 'Prótese/órtese',
  auxilio: 'Auxílio',
  compressao_suporte: 'Compressão/suporte',
}
const STATUS_LABEL: Record<string, string> = {
  em_uso: 'Em uso', suspenso: 'Suspenso', encerrado: 'Encerrado',
}

const config: CrudConfig<Resource> = {
  title: 'Recursos',
  endpoint: '/api/recursos',
  listKey: 'resources',
  editMethod: 'PATCH',
  addLabel: 'Adicionar recurso',
  emptyText: 'Nenhum recurso registrado.',
  fields: [
    { key: 'resourceType', label: 'Tipo', options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'name', label: 'Nome', placeholder: 'Ex.: Óculos de grau' },
    { key: 'brand', label: 'Marca' },
    { key: 'prescriber', label: 'Prescritor' },
    { key: 'status', label: 'Status', options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
    { key: 'startedOn', label: 'Início', placeholder: 'AAAA-MM-DD' },
    { key: 'untilDate', label: 'Até', placeholder: 'AAAA-MM-DD' },
    { key: 'notes', label: 'Observações', multiline: true },
  ],
  idOf: (r) => r.id,
  toForm: (r) => ({
    resourceType: r.resourceType,
    name: r.name,
    brand: r.brand ?? '',
    prescriber: r.prescriber ?? '',
    status: r.status,
    startedOn: r.startedOn ?? '',
    untilDate: r.untilDate ?? '',
    notes: r.notes ?? '',
  }),
  renderItem: (r) => ({
    title: r.name,
    subtitle: [TYPE_LABEL[r.resourceType], STATUS_LABEL[r.status]].filter(Boolean).join(' · '),
  }),
}

export default function RecursosScreen() {
  return <CrudList config={config} />
}
