// Mobile — ADAPTADOR do port `DocumentPickerPort` (@sintera/api-client). ISOLA as libs nativas
// (expo-document-picker / expo-image-picker): o resto do app não as conhece; trocar a lib muda SÓ este arquivo
// (decisão de arquitetura, fundadora 31/07). Cancelamento → `null` (não é erro). Nome do arquivo é só exibição.
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import type { DocumentPickerPort, PickedFile, PickedImage } from '@sintera/api-client'

/** Normaliza o mime de uma imagem escolhida (default JPEG). */
function imageMime(m: string | null | undefined): string {
  return m === 'image/png' ? 'image/png' : 'image/jpeg'
}

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

  async pickImages(): Promise<PickedImage[] | null> {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, base64: true, quality: 0.8,
    })
    if (res.canceled) return null
    const pages = res.assets
      .filter(a => a.base64)
      .map(a => ({ uri: a.uri, base64: a.base64 as string, mime: imageMime(a.mimeType) }))
    return pages.length ? pages : null
  },

  async captureImagePage(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.8 })
    if (res.canceled) return null
    const a = res.assets[0]
    if (!a?.base64) return null
    return { uri: a.uri, base64: a.base64, mime: imageMime(a.mimeType) }
  },
}
