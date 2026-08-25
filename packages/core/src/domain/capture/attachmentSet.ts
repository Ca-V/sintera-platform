// @sintera/core — ANEXO-001: CONJUNTO de anexos de um registro. Puro, sem IO, sem React.
//
// POR QUE ISTO EXISTE: a política ANEXO-001 declarava as regras (múltiplos, formatos mistos, inclusão
// posterior, PDF não encerra) e NINGUÉM as aplicava — cada tela abria um `<input type="file">` de um arquivo
// só e inventava sua própria validação. Este módulo é a REGRA; os componentes de cada plataforma são só a
// aparência dela.
//
// A pessoa escolhe arquivos; a plataforma decide quais aceita e por quê. Nenhuma tela repete essa decisão.
import { isSupportedNow, withinAttachmentLimit, MAX_ATTACHMENT_MB, ATTACHMENT_CARDINALITY } from './attachmentPolicy'

/** Um anexo do conjunto. `url` só existe depois que a plataforma sobe o arquivo. */
export interface AttachedFile {
  /** Identificador local do item na lista. Quem chama fornece — o domínio é determinístico e não gera ids. */
  id: string
  name: string
  mime: string
  sizeBytes: number
  url?: string | null
}

/** Arquivo escolhido pela pessoa, antes de a plataforma decidir se aceita. */
export type IncomingFile = Omit<AttachedFile, 'url'>

export type RejectionReason = 'formato' | 'tamanho'
export interface AttachmentRejection { name: string; reason: RejectionReason }

export interface AcceptResult {
  /** O conjunto RESULTANTE — os que já estavam mais os novos aceitos. */
  files: AttachedFile[]
  /** O que ficou de fora, com o motivo. A tela precisa DIZER; recusar em silêncio é o pior caso. */
  rejected: AttachmentRejection[]
}

/**
 * Acrescenta arquivos ao conjunto, aplicando a política.
 *
 * ANEXO-001, aplicado aqui e em lugar nenhum mais:
 *  • `multiple` — vários arquivos de uma vez;
 *  • `mixedFormats` — PDF e imagem juntos, sem restrição de mistura;
 *  • `addLater` — acrescentar a um conjunto que já tem itens é normal, não exceção;
 *  • `pdfEndsFlow: false` — um PDF NÃO encerra o fluxo. Era o comportamento antigo do Capture Center e
 *    impedia juntar o laudo em PDF com a foto do pedido, que é caso real.
 *
 * NÃO remove duplicados: descartar em silêncio um arquivo que a pessoa escolheu é pior do que aceitá-lo
 * duas vezes, e remover é um toque.
 */
export function acceptFiles(
  current: readonly AttachedFile[],
  incoming: readonly IncomingFile[],
): AcceptResult {
  const files: AttachedFile[] = [...current]
  const rejected: AttachmentRejection[] = []

  for (const f of incoming) {
    if (!isSupportedNow(f.mime)) { rejected.push({ name: f.name, reason: 'formato' }); continue }
    if (!withinAttachmentLimit(f.sizeBytes)) { rejected.push({ name: f.name, reason: 'tamanho' }); continue }
    files.push({ ...f, url: null })
    // `multiple`/`mixedFormats`/`addLater` são permissivos: não há caso em que o conjunto se feche.
    if (!ATTACHMENT_CARDINALITY.multiple) break
  }
  return { files, rejected }
}

/** Remove um item pelo id. */
export function removeFile(current: readonly AttachedFile[], id: string): AttachedFile[] {
  return current.filter(f => f.id !== id)
}

/** Marca o item como enviado, guardando a URL. */
export function withUploadedUrl(current: readonly AttachedFile[], id: string, url: string): AttachedFile[] {
  return current.map(f => (f.id === id ? { ...f, url } : f))
}

/** Os que ainda não subiram. */
export function pendingUpload(current: readonly AttachedFile[]): AttachedFile[] {
  return current.filter(f => !f.url)
}

/** Todos subiram e há pelo menos um — é quando o registro pode ser salvo. */
export function isReadyToSave(current: readonly AttachedFile[]): boolean {
  return current.length > 0 && current.every(f => !!f.url)
}

/**
 * A frase que a pessoa lê quando algo foi recusado. Dono único do texto: se cada tela escrevesse a sua,
 * a mesma recusa apareceria com palavras diferentes dependendo de onde ela está.
 */
export function rejectionMessage(rejected: readonly AttachmentRejection[]): string | null {
  if (rejected.length === 0) return null
  const formato = rejected.filter(r => r.reason === 'formato').map(r => r.name)
  const tamanho = rejected.filter(r => r.reason === 'tamanho').map(r => r.name)
  const partes: string[] = []
  if (formato.length > 0) {
    partes.push(
      formato.length === 1
        ? `${formato[0]} não é um formato aceito. Envie PDF ou imagem.`
        : `${formato.length} arquivos não são de formato aceito. Envie PDF ou imagem.`,
    )
  }
  if (tamanho.length > 0) {
    partes.push(
      tamanho.length === 1
        ? `${tamanho[0]} passa de ${MAX_ATTACHMENT_MB} MB.`
        : `${tamanho.length} arquivos passam de ${MAX_ATTACHMENT_MB} MB.`,
    )
  }
  return partes.join(' ')
}

/** "1 documento" / "3 documentos" — o contador do conjunto, com uma redação só. */
export function attachmentCountLabel(n: number): string {
  return n === 1 ? '1 documento' : `${n} documentos`
}
