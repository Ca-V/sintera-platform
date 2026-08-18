// @sintera/core — ANEXO-001 · POLÍTICA TRANSVERSAL DE ANEXOS (SSOT única, pura, sem React/rotas).
//
// Fonte de verdade: docs/HOMOLOG-SPECS_C1_C2_C3.md (ANEXO-001). Decisão da fundadora (homologação): TODO ponto
// da plataforma que aceite documento/arquivo usa ESTA política — formatos, cardinalidade e métodos de entrada
// CONSISTENTES entre Web e Mobile. Nada de restringir pelo 1º formato ("PDF encerra o fluxo" é PROIBIDO).
//
// Esta camada declara a política; a ADOÇÃO em cada ponto (inputs, capture, storage) é o rollout estrutural
// (com B1/Fase 0). Consumir daqui evita allowlists/limites divergentes por tela.

export type AttachmentFormat = 'pdf' | 'jpeg' | 'png' | 'heic' | 'word'

/** Catálogo ÚNICO de formatos aceitos. `extractable` = a extração lê direto; `needsConversion` = requer
 *  normalização antes (HEIC→JPEG; DOCX→PDF/texto) — o arquivo é aceito, o pipeline trata a conversão. */
export const ATTACHMENT_FORMATS: {
  format: AttachmentFormat; mimes: string[]; exts: string[]; extractable: boolean; needsConversion: boolean
}[] = [
  { format: 'pdf',  mimes: ['application/pdf'],                                                     exts: ['pdf'],        extractable: true,  needsConversion: false },
  { format: 'jpeg', mimes: ['image/jpeg'],                                                          exts: ['jpg', 'jpeg'], extractable: true,  needsConversion: false },
  { format: 'png',  mimes: ['image/png'],                                                           exts: ['png'],        extractable: true,  needsConversion: false },
  { format: 'heic', mimes: ['image/heic', 'image/heif'],                                            exts: ['heic', 'heif'], extractable: true, needsConversion: true },
  { format: 'word', mimes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], exts: ['doc', 'docx'], extractable: false, needsConversion: true },
]

/** Todos os MIME types aceitos (allowlist única). */
export const ATTACHMENT_MIME_TYPES: string[] = ATTACHMENT_FORMATS.flatMap(f => f.mimes)
/** Todas as extensões aceitas (sem ponto, minúsculas). */
export const ATTACHMENT_EXTENSIONS: string[] = ATTACHMENT_FORMATS.flatMap(f => f.exts)

/**
 * Limite de tamanho ÚNICO da plataforma (Web = Mobile). Baseline unificado (alinhado ao menor já em uso);
 * o valor definitivo é decisão técnica (ANEXO-001) considerando upload/storage/processamento. É a FONTE ÚNICA:
 * os pontos que hoje divergem (Web 200MB, Mobile 20MB, Ômica 6/8MB) passam a consumir este valor no rollout.
 */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
export const MAX_ATTACHMENT_MB = Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))

/** Métodos de entrada de documento e onde se aplicam. Consistência = mesma política nos dois ambientes;
 *  a DISPONIBILIDADE por método respeita a plataforma (drag-and-drop = Web; câmera = Mobile; arquivo = ambos). */
export type AttachmentEntryMethod = 'file_select' | 'camera' | 'multiple_images' | 'multiple_files' | 'drag_drop' | 'voice'
export const ATTACHMENT_ENTRY_METHODS: { method: AttachmentEntryMethod; web: boolean; mobile: boolean }[] = [
  { method: 'file_select',     web: true,  mobile: true },
  { method: 'camera',          web: false, mobile: true },
  { method: 'multiple_images', web: true,  mobile: true },
  { method: 'multiple_files',  web: true,  mobile: true },
  { method: 'drag_drop',       web: true,  mobile: false },
  { method: 'voice',           web: true,  mobile: true },
]
export function entryMethodsFor(platform: 'web' | 'mobile'): AttachmentEntryMethod[] {
  return ATTACHMENT_ENTRY_METHODS.filter(m => m[platform]).map(m => m.method)
}

/**
 * Regras de CARDINALIDADE (transversais): 1 ou N arquivos; formatos mistos; inclusão posterior; e — quando os
 * documentos pertencem ao MESMO exame — N documentos → 1 exame/evento. NUNCA criar registro novo por arquivo
 * adicional, NUNCA encerrar o fluxo porque o 1º arquivo é PDF.
 */
export const ATTACHMENT_CARDINALITY = {
  multiple: true,
  mixedFormats: true,
  addLater: true,
  pdfEndsFlow: false as const,
  manyDocumentsToOneExam: true,
} as const

/** Formato suportado por MIME? (allowlist única). */
export function isAcceptedMime(mime: string): boolean { return ATTACHMENT_MIME_TYPES.includes(mime) }
/** Formato suportado pela extensão da URL/arquivo? */
export function isAcceptedExtension(nameOrUrl: string): boolean {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(nameOrUrl.toLowerCase())
  return !!m && ATTACHMENT_EXTENSIONS.includes(m[1])
}
/** String para o atributo `accept` de um <input type=file> (Web) — allowlist única. */
export function attachmentAcceptAttr(): string { return ATTACHMENT_MIME_TYPES.join(',') }
/** Um arquivo cabe no limite único? */
export function withinAttachmentLimit(sizeBytes: number): boolean { return sizeBytes <= MAX_ATTACHMENT_BYTES }
/** O formato precisa de conversão/normalização antes da extração (HEIC→JPEG; DOCX→PDF/texto)? */
export function needsConversion(mime: string): boolean {
  return ATTACHMENT_FORMATS.some(f => f.mimes.includes(mime) && f.needsConversion)
}
