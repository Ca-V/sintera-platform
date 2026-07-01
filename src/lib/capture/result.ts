// ============================================================
// Centro de Entrada — RESULTADO/ERRO unificados
// ============================================================
// Traduz qualquer falha de pipeline para um motivo NORMALIZADO e monta o
// CaptureResult. O Hub renderiza sempre igual, não importa qual módulo processou.
// ============================================================

import type { CaptureErrorReason, CaptureResult, DocumentKind, DocumentProcessor } from './types'

export const CAPTURE_ERROR_LABEL: Record<CaptureErrorReason, string> = {
  unreadable:   'O arquivo parece ilegível. Tente uma imagem mais nítida ou um PDF com texto.',
  protected:    'O arquivo está protegido por senha. Remova a proteção e tente de novo.',
  incompatible: 'Tipo de arquivo incompatível para este documento.',
  temporary:    'Falha temporária no processamento. Tente novamente em instantes.',
  unknown:      'Ocorreu um erro inesperado ao processar o documento.',
}

/** Normaliza a mensagem crua de qualquer pipeline num motivo único. */
export function classifyCaptureError(raw: string): CaptureErrorReason {
  const m = (raw ?? '').toLowerCase()
  if (/senha|password|protect|encrypt/.test(m)) return 'protected'
  if (/ileg|corromp|corrupt|no[_ ]?text|sem texto|escane/.test(m)) return 'unreadable'
  if (/formato|format|unsupported|mime|inv[áa]lid|invalid|too large|muito grande|limite/.test(m)) return 'incompatible'
  if (/timeout|network|rede|temporar|503|429|overload|indispon|rate/.test(m)) return 'temporary'
  return 'unknown'
}

export function captureError(kind: DocumentKind, raw: string): CaptureResult {
  const reason = classifyCaptureError(raw)
  return { status: 'error', kind, title: 'Não foi possível processar', message: CAPTURE_ERROR_LABEL[reason], errorReason: reason }
}

/** Encaminhado ao módulo (pipeline com formulário próprio) — resultado UNIFICADO. */
export function captureForwarded(proc: DocumentProcessor): CaptureResult {
  return {
    status: 'forwarded', kind: proc.kind,
    title: 'Documento encaminhado',
    message: `Vamos abrir ${proc.label.toLowerCase()} para você concluir o cadastro.`,
    nextActionLabel: 'Continuar', nextHref: proc.target,
  }
}
