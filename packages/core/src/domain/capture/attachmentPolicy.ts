// @sintera/core — ANEXO-001 · POLÍTICA TRANSVERSAL DE ANEXOS (SSOT única, pura, sem React/rotas).
//
// Fonte de verdade: docs/HOMOLOG-SPECS_C1_C2_C3.md (ANEXO-001). Decisão da fundadora (homologação): TODO ponto
// da plataforma que aceite documento/arquivo usa ESTA política — formatos, cardinalidade e métodos de entrada
// CONSISTENTES entre Web e Mobile. Nada de restringir pelo 1º formato ("PDF encerra o fluxo" é PROIBIDO).
//
// Esta camada declara a política; a ADOÇÃO em cada ponto (inputs, capture, storage) é o rollout estrutural
// (com B1/Fase 0). Consumir daqui evita allowlists/limites divergentes por tela.

export type AttachmentFormat = 'pdf' | 'jpeg' | 'png' | 'heic' | 'word'

// DIFERENCIAÇÃO EXPLÍCITA (decisão da fundadora):
//  • 'supported'  = SUPORTADO HOJE (ponta a ponta: aceito no upload + lido pelo pipeline atual).
//  • 'capability' = CAPACIDADE ARQUITETURAL de incorporar o formato — declarado aqui, mas NÃO habilitado nos
//    inputs até a dependência de pipeline existir (`enabler`). Não expor ao usuário como "aceito" antes disso.
// Assim, adicionar um formato novo é mudar UM registro aqui (status/enabler), sem espalhar allowlists.
export type FormatStatus = 'supported' | 'capability'

/** Catálogo ÚNICO de formatos. `extractable` = extração lê direto; `needsConversion` = requer normalização
 *  (HEIC→JPEG; DOCX→PDF/texto); `enabler` = o que falta no pipeline para promover 'capability' → 'supported'. */
export const ATTACHMENT_FORMATS: {
  format: AttachmentFormat; status: FormatStatus; mimes: string[]; exts: string[]; extractable: boolean; needsConversion: boolean; enabler?: string
}[] = [
  { format: 'pdf',  status: 'supported',  mimes: ['application/pdf'], exts: ['pdf'],        extractable: true,  needsConversion: false },
  { format: 'jpeg', status: 'supported',  mimes: ['image/jpeg'],      exts: ['jpg', 'jpeg'], extractable: true,  needsConversion: false },
  { format: 'png',  status: 'supported',  mimes: ['image/png'],       exts: ['png'],        extractable: true,  needsConversion: false },
  // CAPACIDADE arquitetural (declarada; habilitar só após o enabler de pipeline):
  { format: 'heic', status: 'capability', mimes: ['image/heic', 'image/heif'], exts: ['heic', 'heif'], extractable: true,  needsConversion: true, enabler: 'decode/normalização HEIC→JPEG (cliente/servidor)' },
  { format: 'word', status: 'capability', mimes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], exts: ['doc', 'docx'], extractable: false, needsConversion: true, enabler: 'conversão DOCX→PDF/texto (ou armazenar como documento não-extraído)' },
]

const byStatus = (s: FormatStatus) => ATTACHMENT_FORMATS.filter(f => f.status === s)

/** MIME/extensões SUPORTADOS HOJE (ponta a ponta) — é o que os inputs devem oferecer AGORA. */
export const SUPPORTED_NOW_MIME_TYPES: string[] = byStatus('supported').flatMap(f => f.mimes)
export const SUPPORTED_NOW_EXTENSIONS: string[] = byStatus('supported').flatMap(f => f.exts)
/** MIME/extensões DECLARADOS (suportados hoje + capacidade arquitetural). Não usar em input antes do enabler. */
export const ATTACHMENT_MIME_TYPES: string[] = ATTACHMENT_FORMATS.flatMap(f => f.mimes)
export const ATTACHMENT_EXTENSIONS: string[] = ATTACHMENT_FORMATS.flatMap(f => f.exts)
/** Formatos que são CAPACIDADE (ainda não habilitados) + o enabler que falta. */
export const CAPABILITY_FORMATS = byStatus('capability').map(f => ({ format: f.format, enabler: f.enabler }))

/** Está suportado HOJE (ponta a ponta)? — regra que os inputs devem usar. */
export function isSupportedNow(mime: string): boolean { return SUPPORTED_NOW_MIME_TYPES.includes(mime) }
/** Está DECLARADO na arquitetura (suportado hoje OU capacidade)? */
export function isDeclaredFormat(mime: string): boolean { return ATTACHMENT_MIME_TYPES.includes(mime) }
/** `accept` de <input type=file> para o que é oferecido HOJE (não expõe capacidade não habilitada). */
export function supportedNowAcceptAttr(): string { return SUPPORTED_NOW_MIME_TYPES.join(',') }

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

/** Formato DECLARADO por MIME? (suportado hoje OU capacidade arquitetural). Para validar hoje, use `isSupportedNow`. */
export function isAcceptedMime(mime: string): boolean { return ATTACHMENT_MIME_TYPES.includes(mime) }
/** Formato DECLARADO pela extensão da URL/arquivo? */
export function isAcceptedExtension(nameOrUrl: string): boolean {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(nameOrUrl.toLowerCase())
  return !!m && ATTACHMENT_EXTENSIONS.includes(m[1])
}
/** `accept` de <input type=file> com a allowlist DECLARADA (arquitetura). Para inputs de HOJE, use
 *  `supportedNowAcceptAttr()` — não expor capacidade ainda não habilitada (HEIC/Word) ao usuário. */
export function attachmentAcceptAttr(): string { return ATTACHMENT_MIME_TYPES.join(',') }
/** Um arquivo cabe no limite único? */
export function withinAttachmentLimit(sizeBytes: number): boolean { return sizeBytes <= MAX_ATTACHMENT_BYTES }
/** O formato precisa de conversão/normalização antes da extração (HEIC→JPEG; DOCX→PDF/texto)? */
export function needsConversion(mime: string): boolean {
  return ATTACHMENT_FORMATS.some(f => f.mimes.includes(mime) && f.needsConversion)
}
