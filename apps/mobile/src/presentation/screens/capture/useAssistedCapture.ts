// Captura assistida (T1) — HOOK TRANSVERSAL. Uma única capacidade da plataforma: escolher a fonte (foto/arquivo)
// → converter em base64 → chamar o serviço de OCR/IA via `apiClient.vision.*` → devolver os campos LIDOS.
//
// REGRA DE PLATAFORMA (decisão da fundadora): a IA NUNCA grava diretamente. Toda captura assistida gera uma
// PROPOSTA de preenchimento — este hook só DEVOLVE os campos lidos; a tela consumidora pré-preenche o formulário
// e o usuário revisa e confirma no Salvar. Nenhum módulo implementa OCR próprio; todos consomem este hook.
import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import type { CaptureInput } from '@sintera/api-client'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'
import { readFileBase64 } from '../../../infrastructure/fileToBase64'

/** Resultado tipado de uma leitura (data) + o convite ao usuário para revisar/confirmar (implícito na tela). */
type Reader<T> = (input: CaptureInput) => Promise<{ data: T | null; error: Error | null }>

/** Pergunta a fonte (foto/arquivo) — protocolo único "Adicionar" (PS-2 / HUB-001). */
function chooseSource(): Promise<'file' | 'photo' | null> {
  return new Promise((resolve) => {
    Alert.alert('Preencher a partir de um documento', 'A leitura é uma proposta — você revisa antes de salvar.', [
      { text: 'Tirar foto', onPress: () => resolve('photo') },
      { text: 'Escolher arquivo', onPress: () => resolve('file') },
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) })
  })
}

export function useAssistedCapture() {
  const [busy, setBusy] = useState(false)

  /** Executa a captura com o `reader` do módulo (ex.: apiClient.vision.readCondition). Devolve os campos lidos
   *  ou null (cancelou / nada reconhecido / erro — já avisado ao usuário). NÃO persiste nada. */
  const run = useCallback(async function <T>(reader: Reader<T>): Promise<T | null> {
    const source = await chooseSource()
    if (!source) return null
    const picked = source === 'photo' ? await documentPicker.captureImage() : await documentPicker.pickDocument()
    if (!picked) return null
    setBusy(true)
    try {
      const fileBase64 = await readFileBase64(picked.uri)
      const { data, error } = await reader({ fileBase64, mediaType: picked.mimeType ?? 'image/jpeg' })
      if (error) { Alert.alert('Não foi possível ler', error.message); return null }
      if (data == null || (Array.isArray(data) && data.length === 0)) {
        Alert.alert('Nada reconhecido', 'Não consegui ler dados deste documento. Você pode preencher manualmente.')
        return null
      }
      return data
    } catch (e) {
      Alert.alert('Não foi possível ler', e instanceof Error ? e.message : 'Tente novamente.')
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  return { run, busy }
}
