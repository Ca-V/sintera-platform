// @sintera/api-client — PORT de seleção de documento (device). ABSTRAÇÃO genérica: o app NÃO conhece a
// biblioteca escolhida (expo-document-picker / expo-image-picker). Cada plataforma injeta um adaptador que
// implementa esta interface; trocar a lib no futuro muda SÓ o adaptador (decisão de arquitetura, fundadora 31/07).
// Consistente com StorageAdapter (também um port injetado por plataforma).

/** Arquivo escolhido pelo usuário. `name` é só para EXIBIÇÃO — NUNCA usado como identificador (o id é gerado
 *  pelo backend/Storage). `mimeType` pode ser null quando a origem não informa (validação trata como inválido). */
export interface PickedFile {
  uri: string
  name: string
  sizeBytes: number
  mimeType: string | null
}

/** Port de seleção. Retorna `null` quando o usuário CANCELA (não é erro). LANÇA só em falha real do device. */
export interface DocumentPickerPort {
  pickDocument(): Promise<PickedFile | null>
  captureImage(): Promise<PickedFile | null>
}
