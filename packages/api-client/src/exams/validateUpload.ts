// @sintera/api-client — Validação PURA de upload (compartilhada Web/Mobile). Roda ANTES do upload físico
// (requisito não-funcional da fundadora 31/07: extensão · tamanho · MIME). Determinística e sem I/O — testável
// sem device/rede. NÃO decide segurança sozinha: o backend REVALIDA (defesa em profundidade + RLS).

import type { PickedFile } from '../device/documentPicker'
import type { UploadConstraints } from './write'

export type UploadValidation =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'extension' | 'size' | 'mime'; message: string }

/** Extrai a extensão (minúscula, sem ponto) do nome do arquivo. '' se não houver. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/** Lista de formatos aceitos, legível — derivada das restrições (sem hardcode). Ex.: "PDF, JPG, PNG, HEIC". */
export function acceptedFormatsHint(c: UploadConstraints): string {
  return c.allowedExtensions.map((e) => e.toUpperCase()).join(', ')
}

/** Valida um arquivo escolhido contra as restrições. Retorna o PRIMEIRO problema encontrado, com mensagem
 *  ACIONÁVEL (diz o que fazer). FACTUAL (REG-001): fala do arquivo, não do conteúdo clínico. */
export function validateUpload(file: PickedFile, c: UploadConstraints): UploadValidation {
  if (!file.sizeBytes || file.sizeBytes <= 0) {
    return { ok: false, reason: 'empty', message: 'Arquivo vazio ou ilegível. Selecione outro documento.' }
  }
  const ext = extensionOf(file.name)
  if (!c.allowedExtensions.includes(ext)) {
    return { ok: false, reason: 'extension', message: `Formato não aceito (.${ext || '?'}). Envie: ${acceptedFormatsHint(c)}.` }
  }
  if (file.sizeBytes > c.maxBytes) {
    const mb = Math.round(c.maxBytes / (1024 * 1024))
    return { ok: false, reason: 'size', message: `Arquivo acima do limite de ${mb} MB. Envie um arquivo menor.` }
  }
  if (!file.mimeType || !c.allowedMimeTypes.includes(file.mimeType)) {
    return { ok: false, reason: 'mime', message: `Conteúdo não suportado. Envie: ${acceptedFormatsHint(c)}.` }
  }
  return { ok: true }
}
