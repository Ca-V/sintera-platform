// ============================================================
// Biblioteca de Estados — contrato ÚNICO de estados de UI
// ============================================================
// Toda tela usa o mesmo conjunto de estados, com o mesmo tom e comportamento.
// Elimina dezenas de comportamentos inconsistentes (cada tela inventando o seu).
// Apenas APRESENTAÇÃO (Trilha B) — não toca domínio/Estado 2.
// Texto/ações são contextuais (passados pelo consumidor); aqui ficam tom,
// papel e comportamento padrão de cada estado.
// ============================================================

export type UIStateKind =
  | 'empty'
  | 'loading'
  | 'processing'
  | 'success'
  | 'error'
  | 'pending'
  | 'interrupted'
  | 'finished'

/** Tom visual — mapeado à paleta no componente (StateView), não aqui. */
export type StateTone = 'neutral' | 'success' | 'danger' | 'info'

export interface UIStateSpec {
  kind: UIStateKind
  tone: StateTone
  /** mostra animação de progresso/spinner */
  busy: boolean
  /** ícone Tabler/lucide sugerido (o componente resolve o render) */
  icon: string
  /** comportamento resumido — documenta a intenção do estado */
  behavior: string
}

export const UI_STATES: Record<UIStateKind, UIStateSpec> = {
  empty:       { kind: 'empty',       tone: 'neutral', busy: false, icon: 'inbox',        behavior: 'convite, não desculpa — sempre oferece uma ação' },
  loading:     { kind: 'loading',     tone: 'neutral', busy: true,  icon: 'loader',       behavior: 'skeleton/spinner; não bloqueia o resto da tela' },
  processing:  { kind: 'processing',  tone: 'info',    busy: true,  icon: 'progress',     behavior: 'sistema trabalhando, com progresso visível; sem suspense' },
  success:     { kind: 'success',     tone: 'success', busy: false, icon: 'circle-check', behavior: 'confirma o que aconteceu + efeito; oferece próximo passo' },
  error:       { kind: 'error',       tone: 'danger',  busy: false, icon: 'alert-circle', behavior: 'diz o que houve e o que fazer; sempre há saída' },
  pending:     { kind: 'pending',     tone: 'neutral', busy: false, icon: 'clock',        behavior: 'aguardando sistema/terceiro; ação de confirmar disponível' },
  interrupted: { kind: 'interrupted', tone: 'info',    busy: false, icon: 'player-pause', behavior: 'fluxo incompleto retomável; aparece só quando há algo a continuar' },
  finished:    { kind: 'finished',    tone: 'neutral', busy: false, icon: 'flag-check',   behavior: 'jornada concluída/arquivada; recuperável' },
}

export function stateSpec(kind: UIStateKind): UIStateSpec {
  return UI_STATES[kind]
}

export const ALL_STATE_KINDS = Object.keys(UI_STATES) as UIStateKind[]
