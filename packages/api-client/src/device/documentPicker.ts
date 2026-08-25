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

/** Uma PÁGINA de imagem para montar um documento de várias páginas (bundle). Carrega o base64 para a montagem
 *  do PDF no aparelho + o uri para a miniatura. Espelha o bundle da Web (imagens → 1 PDF → upload único). */
export interface PickedImage {
  uri: string
  base64: string
  mime: string
}

/** Port de seleção. Retorna `null` quando o usuário CANCELA (não é erro). LANÇA só em falha real do device. */
export interface DocumentPickerPort {
  pickDocument(): Promise<PickedFile | null>
  /**
   * ANEXO-001: seleciona VÁRIOS arquivos de uma vez, PDF e imagem misturados. `null` = cancelou.
   * A política declara `multiple` e `mixedFormats`; sem isto o Mobile não tinha como cumprir — só existia
   * seleção de um arquivo por vez.
   */
  pickDocuments(): Promise<PickedFile[] | null>
  captureImage(): Promise<PickedFile | null>
  /** Seleciona VÁRIAS imagens da galeria (com base64) para montar um documento multipágina. `null` = cancelou. */
  pickImages(): Promise<PickedImage[] | null>
  /** Captura UMA imagem pela câmera (com base64) como página do documento. `null` = cancelou. */
  captureImagePage(): Promise<PickedImage | null>
}
