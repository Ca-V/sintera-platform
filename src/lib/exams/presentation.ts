// Camada de APRESENTAÇÃO do domínio Exames — vocabulário do STATUS de processamento
// (rótulo + tokens de cor + ícone semântico). Espelha o gabarito de dono por domínio
// `lib/agenda/presentation.ts`: mantém `lib/` livre de React (o ícone é uma CHAVE
// semântica, resolvida para o componente lucide na camada de UI — ver ExamStatusChip).
//
// Antes deste dono, o mapa de status de exame estava duplicado verbatim em
// `dashboard/page.tsx` e `exams/page.tsx` (com drift no ícone de "processing"). Este é
// o dono único do vocabulário; qualquer superfície (painel, lista de exames, filtros,
// futuras integrações de laboratório/FHIR) fala a mesma língua a partir daqui.

export type ExamStatus = 'processed' | 'pending' | 'processing' | 'error'

/** Ícone SEMÂNTICO (chave). A UI mapeia chave → componente (lucide), mantendo lib React-free. */
export type ExamStatusIcon = 'check' | 'clock' | 'spinner' | 'alert'

export interface ExamStatusMeta {
  label: string
  /** classe Tailwind de cor do texto/ícone */
  color: string
  /** classe Tailwind de fundo do chip */
  bg: string
  icon: ExamStatusIcon
}

export const EXAM_STATUS_META: Record<ExamStatus, ExamStatusMeta> = {
  processed:  { label: 'Dados extraídos', color: 'text-petal',    bg: 'bg-blush',          icon: 'check' },
  pending:    { label: 'Aguardando',      color: 'text-gold',     bg: 'bg-warm',           icon: 'clock' },
  processing: { label: 'Processando',     color: 'text-lavender', bg: 'bg-lavender-light', icon: 'spinner' },
  error:      { label: 'Erro',            color: 'text-red-400',  bg: 'bg-red-50',         icon: 'alert' },
}

/** Meta do status, tolerante a valor inesperado (default: 'pending'). */
export function examStatusMeta(status: string): ExamStatusMeta {
  return EXAM_STATUS_META[status as ExamStatus] ?? EXAM_STATUS_META.pending
}
