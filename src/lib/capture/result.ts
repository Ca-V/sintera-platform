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

// 'forwarded' = a plataforma NÃO persistiu o documento; apenas ENCAMINHA a pessoa ao módulo para
// concluir o cadastro LÁ. NUNCA é confirmação de que algo foi salvo. A cópia deixa explícito que o
// documento ainda não foi salvo — impede a falsa confirmação de um cadastro concluído (Obs 6b:
// nunca apresentar sucesso sem persistência efetiva).
export function captureForwarded(proc: DocumentProcessor): CaptureResult {
  return {
    status: 'forwarded', kind: proc.kind,
    title: 'Continue o cadastro',
    message: `Este documento ainda não foi salvo. Abra ${proc.label.toLowerCase()} para concluir o cadastro.`,
    nextActionLabel: 'Continuar', nextHref: proc.target,
  }
}

/** Tom de EXIBIÇÃO do resultado. 'forwarded' (documento NÃO persistido) NUNCA é 'success' — impede a
 *  falsa confirmação (Obs 6b: só há confirmação de sucesso quando o objeto foi efetivamente persistido).
 *  A UI deriva ícone/cor/rótulos daqui; determinístico e testável sem componente. */
export type CaptureResultTone = 'success' | 'pending' | 'error'
export function captureResultTone(status: CaptureResult['status']): CaptureResultTone {
  return status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending'
}
