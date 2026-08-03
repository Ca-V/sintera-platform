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
    // O nome do device p/ foto costuma ser IMG_xxxx ou um UUID (sem valor p/ o usuário). Usamos um nome
    // AMIGÁVEL e genérico (com extensão válida p/ a validação/Storage); a extração define o nome real depois.
    const mimeType = a.mimeType ?? 'image/jpeg'
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/heic' ? 'heic' : 'jpg'
    return {
      uri: a.uri,
      name: `Exame (foto).${ext}`,
      sizeBytes: a.fileSize ?? 0,
      mimeType,
    }
  },
}
