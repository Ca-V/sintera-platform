import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { CrudList, type CrudConfig } from '@/components/CrudList'
import { Button } from '@/components/ui'
import { api, ApiError } from '@/lib/api'

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
  headerExtra: (reload) => <ScanReceita reload={reload} />,
}

// Escaneia uma receita de óculos por foto: a IA transcreve (POST /api/vision/eyeglasses)
// e criamos um recurso 'correcao_visual' com a prescrição em `attributes` (POST /api/recursos).
// Paridade com dashboard/recursos da Web. Transcrição factual — a pessoa revê depois.
function ScanReceita({ reload }: { reload: () => Promise<void> }) {
  return (
    <Button
      label="Escanear receita de óculos"
      variant="ghost"
      onPress={async () => {
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images })
        if (res.canceled || !res.assets?.[0]?.base64) return
        const a = res.assets[0]
        try {
          const { result } = await api.post<{ result: Record<string, unknown> | null }>(
            '/api/vision/eyeglasses', { imageBase64: a.base64, mediaType: a.mimeType ?? 'image/jpeg' },
          )
          if (!result) { Alert.alert('Sem leitura', 'Não consegui ler a receita.'); return }
          const visionKind = (result.bc || result.dia) ? 'lentes_contato' : 'oculos'
          await api.post('/api/recursos', {
            resourceType: 'correcao_visual',
            name: visionKind === 'lentes_contato' ? 'Lentes de contato' : 'Óculos de grau',
            prescriber: (result.prescriber as string) ?? null,
            startedOn: (result.prescribed_on as string) ?? null,
            status: 'em_uso',
            attributes: {
              vision_kind: visionKind,
              od: result.od ?? null, oe: result.oe ?? null,
              dnp: result.dnp ?? null, bc: result.bc ?? null, dia: result.dia ?? null,
            },
          })
          await reload()
          Alert.alert('Pronto', 'Receita registrada a partir da foto.')
        } catch (e) {
          Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao escanear a receita.')
        }
      }}
    />
  )
}

export default function RecursosScreen() {
  return <CrudList config={config} />
}
