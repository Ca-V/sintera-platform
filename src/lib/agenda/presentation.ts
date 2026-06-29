// Camada de APRESENTAÇÃO dos eventos — rótulos, formatação e projeção de conteúdo
// para UI e notificações. Mantém o domínio (event.ts) livre de texto/formato visual.
// A notificação é uma projeção de CONTEÚDO do domínio (REQ-NOTIF-001).

import type { HealthEvent, EventStatus } from './event'
import type { EventNotificationInput } from './notification'

// ── FONTE ÚNICA dos tipos de evento (Agenda E Histórico falam a mesma língua) ──
// Lista canônica e ORDENADA para o seletor de tipo. "Retorno" não é tipo — é um
// atributo (is_return) da Consulta. Cirurgia/Suplemento entram aqui (migração 080).
export const EVENT_TYPE_DEFS = [
  { id: 'consulta',     label: 'Consulta',       emoji: '🩺' },
  { id: 'exame',        label: 'Exame',          emoji: '🧪' },
  { id: 'procedimento', label: 'Procedimento',   emoji: '🩹' },
  { id: 'vacina',       label: 'Vacina',         emoji: '💉' },
  { id: 'medicamento',  label: 'Medicamento',    emoji: '💊' },
  { id: 'plano',        label: 'Plano de saúde', emoji: '🏥' },
  { id: 'outro',        label: 'Outro',          emoji: '📌' },
] as const
// Subtipos/atributos (NÃO são tipos no seletor): Retorno = atributo da Consulta
// (is_return); Cirurgia = subtipo de Procedimento (gravado como event_type 'cirurgia').
// SELETOR LEGADO (híbrido): mistura AÇÃO (consulta/exame/procedimento/vacina) e
// OBJETO (medicamento/plano). DECISÃO PO 29/06: NÃO adicionar novos Objetos aqui —
// Suplemento/Produto/Dispositivo NÃO entram (um suplemento adicionado provisoriamente
// foi REVERTIDO). No T2-D2B este seletor é reconstruído como seletor de AÇÃO, e
// Medicamento/Plano saem da 1ª pergunta (modelo Ação→Objeto→Entidade). Suplemento
// volta a ser responsabilidade do T2-D2B (não há solução transitória de tipo).

// Superset de rótulos para RENDERIZAÇÃO (inclui tipos legados já gravados, para o
// Histórico nunca quebrar ao exibir dados antigos).
export const EVENT_TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta', exame: 'Exame', procedimento: 'Procedimento', cirurgia: 'Cirurgia',
  vacina: 'Vacina', medicamento: 'Medicamento', suplemento: 'Suplemento', plano: 'Plano de saúde',
  outro: 'Outro',
  // legados (não oferecidos no seletor, mas renderizáveis):
  retorno: 'Consulta', medicacao: 'Medicamento', atividade: 'Atividade física',
  estetico: 'Procedimento estético', omica: 'Ômica', protocolo: 'Protocolo',
}

// Rótulos de PROFISSIONAL (professional_kind) — FONTE ÚNICA (Histórico, Relatório,
// Relatório Público consomem isto; proibido mapa local). Sem fallback genérico:
// tipo desconhecido/ausente → '' (a UI simplesmente não exibe o profissional).
export const PROFESSIONAL_LABELS: Record<string, string> = {
  medico: 'Médico(a)', psicologo: 'Psicólogo(a)', nutricionista: 'Nutricionista',
  fisioterapeuta: 'Fisioterapeuta', dentista: 'Dentista', outro: 'Outro profissional',
}
export function professionalLabel(kind: string | null | undefined): string {
  return (kind && PROFESSIONAL_LABELS[kind]) || ''
}

// Status canônico do domínio (6) × status oferecidos na UI (3, decisão da fundadora:
// Agendado/Realizado/Cancelado). "Agendado" = planejado no domínio.
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planejado: 'Agendado', realizado: 'Realizado',
  cancelado: 'Cancelado', reagendado: 'Reagendado', perdido: 'Não compareceu',
}
export const EVENT_STATUS_UI: { id: EventStatus; label: string }[] = [
  { id: 'planejado', label: 'Agendado' },
  { id: 'realizado', label: 'Realizado' },
  { id: 'cancelado', label: 'Cancelado' },
]

export function typeLabel(type: string): string { return EVENT_TYPE_LABELS[type] ?? 'Outro' }
export function statusLabel(status: EventStatus): string { return EVENT_STATUS_LABELS[status] ?? status }

// Formatação pura (sem Date/locale → determinística e testável).
/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. Entrada inesperada retorna a própria string. */
export function formatDateBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? '')
}
/** 'HH:MM[:SS]' → 'HH:MM'. Vazio → null. */
export function formatTimeBR(time: string | null): string | null {
  if (!time) return null
  const m = /^(\d{2}):(\d{2})/.exec(time)
  return m ? `${m[1]}:${m[2]}` : null
}

/**
 * PROJEÇÃO do evento de domínio para o input do formatter de notificação.
 * A notificação nunca é origem de informação — só projeta o domínio consolidado.
 */
export function eventToNotificationInput(ev: HealthEvent): EventNotificationInput {
  return {
    typeLabel: typeLabel(ev.type),
    title: ev.title,
    dateLabel: formatDateBR(ev.date),
    timeLabel: formatTimeBR(ev.time),
    professional: ev.professionalName,
    establishment: ev.establishment,
    location: ev.location,
    modality: ev.modality,
    preparation: ev.preparation,
  }
}
