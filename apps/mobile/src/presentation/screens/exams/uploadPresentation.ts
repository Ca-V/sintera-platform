// Apresentação PURA do fluxo de upload (Inc.6) — mapeia a fase do reducer para o texto de UX que a fundadora
// definiu (Selecionando → Enviando → Processando → Concluído · Erro). Centraliza a cópia num só lugar
// (revisável/consistente) e mantém a futura tela trivial: ela só consome `uploadPhaseLabel`/`isUploadBusy`.
// Sem React/RN — testável isoladamente. A mensagem específica do erro vem de `state.error` (não daqui).

import type { UploadPhase } from './uploadMachine'

const LABELS: Record<UploadPhase, string> = {
  idle: '',
  selecting: 'Selecionando…',
  uploading: 'Enviando…',
  processing: 'Processando…',
  done: 'Concluído',
  error: 'Erro',
}

/** Rótulo de status para a fase atual. `idle` não tem status (a tela mostra a ação de adicionar). */
export function uploadPhaseLabel(phase: UploadPhase): string {
  return LABELS[phase] ?? ''
}

/** Fases em andamento — a tela desabilita ações e mostra progresso enquanto verdadeiro. */
export function isUploadBusy(phase: UploadPhase): boolean {
  return phase === 'selecting' || phase === 'uploading' || phase === 'processing'
}
