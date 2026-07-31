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

/** Valida um arquivo escolhido contra as restrições. Retorna o PRIMEIRO problema encontrado. */
export function validateUpload(file: PickedFile, c: UploadConstraints): UploadValidation {
  if (!file.sizeBytes || file.sizeBytes <= 0) {
    return { ok: false, reason: 'empty', message: 'Arquivo vazio ou ilegível.' }
  }
  const ext = extensionOf(file.name)
  if (!c.allowedExtensions.includes(ext)) {
    return { ok: false, reason: 'extension', message: `Tipo de arquivo não permitido (.${ext || '?'}).` }
  }
  if (file.sizeBytes > c.maxBytes) {
    const mb = Math.round(c.maxBytes / (1024 * 1024))
    return { ok: false, reason: 'size', message: `Arquivo excede o limite de ${mb} MB.` }
  }
  if (!file.mimeType || !c.allowedMimeTypes.includes(file.mimeType)) {
    return { ok: false, reason: 'mime', message: 'Formato de conteúdo não suportado.' }
  }
  return { ok: true }
}
