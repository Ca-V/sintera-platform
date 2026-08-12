import { CrudList, type CrudConfig } from '@/components/CrudList'

interface Condition {
  id: string
  scope: 'propria' | 'familiar'
  name: string
  relative: string | null
  sinceLabel: string | null
  notes: string | null
}

const config: CrudConfig<Condition> = {
  title: 'Condições',
  endpoint: '/api/condicoes',
  listKey: 'conditions',
  editMethod: 'PATCH',
  addLabel: 'Adicionar condição',
  emptyText: 'Nenhuma condição registrada.',
  fields: [
    { key: 'scope', label: 'Escopo', options: [
      { value: 'propria', label: 'Própria' },
      { value: 'familiar', label: 'Familiar' },
    ] },
    { key: 'name', label: 'Nome', placeholder: 'Ex.: Hipertensão' },
    { key: 'relative', label: 'Parentesco', placeholder: 'Se familiar' },
    { key: 'sinceLabel', label: 'Desde', placeholder: 'Ex.: 2019' },
    { key: 'notes', label: 'Observações', multiline: true },
  ],
  idOf: (c) => c.id,
  toForm: (c) => ({
    scope: c.scope,
    name: c.name,
    relative: c.relative ?? '',
    sinceLabel: c.sinceLabel ?? '',
    notes: c.notes ?? '',
  }),
  renderItem: (c) => ({
    title: c.name,
    subtitle: [c.scope === 'familiar' ? `Familiar${c.relative ? ` · ${c.relative}` : ''}` : 'Própria', c.sinceLabel && `desde ${c.sinceLabel}`]
      .filter(Boolean).join(' · '),
  }),
}

export default function CondicoesScreen() {
  return <CrudList config={config} />
}
