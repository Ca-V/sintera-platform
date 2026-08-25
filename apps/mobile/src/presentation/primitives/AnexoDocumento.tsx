// ANEXO-001 — FONTE ÚNICA da entrada de documento no Mobile. Contraparte de src/components/ui/AnexoDocumento
// da Web: a REGRA de aceitar/recusar é a MESMA (`attachmentSet`, no core); aqui é só a aparência dela.
//
// Princípio da fundadora (25/08/2026, PERMANENTE): toda entrada de documento segue o mesmo padrão, em 100%
// dos pontos que oferecem anexo. Antes disto cada tela abria seu próprio seletor de UM arquivo.
//   • vários arquivos de uma vez, formatos mistos   (pickDocuments)
//   • câmera                                        (captureImage — método do DISPOSITIVO, não da Web)
//   • acrescentar depois; PDF não encerra o fluxo
//   • recusa DITA, com nome e motivo
import { useCallback, useState } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import {
  acceptFiles, removeFile, rejectionMessage, attachmentCountLabel, entryMethodsFor,
  type AttachedFile, type IncomingFile,
} from '@sintera/core'
import type { PickedFile } from '@sintera/api-client'
import { Text } from './Text'
import { Button } from './Button'
import { useTheme } from '../theme'
import { documentPicker } from '../../infrastructure/documentPickerAdapter'

const TEM_CAMERA = entryMethodsFor('mobile').includes('camera')

export interface AnexoDocumentoProps {
  files: AttachedFile[]
  onChange: (files: AttachedFile[]) => void
  /** Sobe UM arquivo e devolve a URL. A tela decide o destino. */
  upload: (file: PickedFile) => Promise<string | null>
  label?: string
  disabled?: boolean
}

function tamanhoLegivel(bytes: number): string {
  if (bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnexoDocumento({
  files, onChange, upload, label = 'Documento', disabled = false,
}: AnexoDocumentoProps) {
  const t = useTheme()
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const receber = useCallback(async (escolhidos: PickedFile[]) => {
    setAviso(null)
    if (escolhidos.length === 0) return

    // A POLÍTICA decide o que entra — a mesma função que a Web chama.
    const entrando: IncomingFile[] = escolhidos.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      mime: f.mimeType ?? '',
      sizeBytes: f.sizeBytes,
    }))
    const { files: aceitos, rejected } = acceptFiles(files, entrando)
    setAviso(rejectionMessage(rejected))
    onChange(aceitos)

    const novos = aceitos.filter(a => entrando.some(e => e.id === a.id))
    if (novos.length === 0) return

    setEnviando(true)
    try {
      let atual = aceitos
      for (let i = 0; i < novos.length; i++) {
        const novo = novos[i]
        const original = escolhidos.find(f => f.name === novo.name && f.sizeBytes === novo.sizeBytes)
        if (!original) continue
        const url = await upload(original)
        if (url) {
          atual = atual.map(f => (f.id === novo.id ? { ...f, url } : f))
        } else {
          // Falha de envio remove o item: manter na lista um arquivo que não subiu faria a tela
          // prometer um anexo que não existe.
          atual = removeFile(atual, novo.id)
          setAviso(`Não foi possível enviar ${novo.name}. Tente de novo.`)
        }
        onChange(atual)
      }
    } finally {
      setEnviando(false)
    }
  }, [files, onChange, upload])

  const escolherArquivos = useCallback(async () => {
    const escolhidos = await documentPicker.pickDocuments()
    if (escolhidos) await receber(escolhidos)
  }, [receber])

  const fotografar = useCallback(async () => {
    const foto = await documentPicker.captureImage()
    if (foto) await receber([foto])
  }, [receber])

  return (
    <View style={{ gap: 8 }}>
      <View style={s.cabecalho}>
        <Text spec={text(t, { role: 'label', tone: 'muted' })}>{label}</Text>
        {files.length > 0 && (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{attachmentCountLabel(files.length)}</Text>
        )}
      </View>

      {files.map(f => (
        <View key={f.id} style={[s.item, { borderColor: t.color.border.default }]}>
          <View style={{ flex: 1 }}>
            <Text spec={text(t, { role: 'body' })} numberOfLines={1}>{f.name}</Text>
            {tamanhoLegivel(f.sizeBytes) !== '' && (
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{tamanhoLegivel(f.sizeBytes)}</Text>
            )}
          </View>
          {!f.url && <ActivityIndicator size="small" color={t.color.identity.primary} />}
          <Pressable
            onPress={() => onChange(removeFile(files, f.id))}
            disabled={disabled}
            hitSlop={10}
            accessibilityLabel={`Remover ${f.name}`}
          >
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Remover</Text>
          </Pressable>
        </View>
      ))}

      <Button
        label={files.length > 0 ? 'Adicionar mais páginas' : 'Anexar arquivos'}
        onPress={escolherArquivos}
        variant="secondary"
        loading={enviando}
        loadingLabel="Enviando…"
        disabled={disabled}
      />

      {TEM_CAMERA && (
        <Button
          label="Fotografar documento"
          onPress={fotografar}
          variant="ghost"
          disabled={disabled || enviando}
        />
      )}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>PDF ou imagem · vários arquivos</Text>

      {aviso && (
        <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{aviso}</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
})
