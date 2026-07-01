// ============================================================
// SituationCard — modelo de apresentação (sem domínio/Estado 2)
// ============================================================
// NÃO é um "card de atenção": é um card de SITUAÇÃO. O MESMO componente
// suporta vários tons (atenção/informação/sucesso/processamento/pendência),
// via prop `tone` — nunca variantes diferentes do componente.
// Sempre tem uma AÇÃO (nunca só informação). Tom de organização, não alarme.
// ============================================================

export type SituationTone =
  | 'attention'
  | 'information'
  | 'success'
  | 'processing'
  | 'pending'

export interface SituationToneSpec {
  tone: SituationTone
  /** classes da paleta para o nó do ícone */
  node: string
  /** mostra spinner em vez de ícone */
  busy: boolean
  /** ícone lucide sugerido (o componente resolve o render) */
  icon: string
}

export const SITUATION_TONE: Record<SituationTone, SituationToneSpec> = {
  attention:   { tone: 'attention',   node: 'bg-warm text-gold',            busy: false, icon: 'alert-circle' },
  information: { tone: 'information', node: 'bg-lavender-light text-lavender', busy: false, icon: 'info' },
  success:     { tone: 'success',     node: 'bg-sage-light text-sage',      busy: false, icon: 'circle-check' },
  processing:  { tone: 'processing',  node: 'bg-lavender-light text-lavender', busy: true,  icon: 'loader' },
  pending:     { tone: 'pending',     node: 'bg-ivory text-mauve',          busy: false, icon: 'clock' },
}

export const ALL_SITUATION_TONES = Object.keys(SITUATION_TONE) as SituationTone[]
