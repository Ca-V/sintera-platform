// Mobile — ADAPTADOR do port `DocumentPickerPort` (@sintera/api-client). ISOLA as libs nativas
// (expo-document-picker / expo-image-picker): o resto do app não as conhece; trocar a lib muda SÓ este arquivo
// (decisão de arquitetura, fundadora 31/07). Cancelamento → `null` (não é erro). Nome do arquivo é só exibição.
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import type { DocumentPickerPort, PickedFile } from '@sintera/api-client'

export const documentPicker: DocumentPickerPort = {
  async pickDocument(): Promise<PickedFile | null> {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (res.canceled) return null
    const a = res.assets[0]
    if (!a) return null
    return { uri: a.uri, name: a.name, sizeBytes: a.size ?? 0, mimeType: a.mimeType ?? null }
  },

  async captureImage(): Promise<PickedFile | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
    if (res.canceled) return null
    const a = res.assets[0]
    if (!a) return null
    return {
      uri: a.uri,
      name: a.fileName ?? `foto-${a.assetId ?? 'exame'}.jpg`,
      sizeBytes: a.fileSize ?? 0,
      mimeType: a.mimeType ?? 'image/jpeg',
    }
  },
}
