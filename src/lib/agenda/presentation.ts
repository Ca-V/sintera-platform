// Camada de APRESENTAÇÃO dos eventos — rótulos, formatação e projeção de conteúdo
// para UI e notificações. Mantém o domínio (event.ts) livre de texto/formato visual.
// A notificação é uma projeção de CONTEÚDO do domínio (REQ-NOTIF-001).

import type { HealthEvent, EventStatus, EventModality, EventPriority, Outcome } from './event'
import type { EventNotificationInput } from './notification'

// ── FONTE ÚNICA dos tipos de evento (Agenda E Histórico falam a mesma língua) ──
// Lista canônica e ORDENADA para o seletor de tipo. "Retorno" não é tipo — é um
// atributo (is_return) da Consulta. Cirurgia/Suplemento entram aqui (migração 080).
export const EVENT_TYPE_DEFS = [
  { id: 'consulta',     label: 'Consulta',       emoji: '🩺' },
  { id: 'exame',        label: 'Exame',          emoji: '🧪' },
  { id: 'procedimento', label: 'Procedimento',   emoji: '🩹' },
  { id: 'vacina',       label: 'Vacina',         emoji: '💉' },
  { id: 'plano',        label: 'Plano de saúde', emoji: '🏥' },
  { id: 'outro',        label: 'Outro',          emoji: '📌' },
] as const
// Subtipos/atributos (NÃO são tipos no seletor): Retorno = atributo da Consulta
// (is_return); Cirurgia = subtipo de Procedimento (gravado como event_type 'cirurgia').
// Medicamento/Suplemento NÃO são tipos do seletor da Agenda — o ponto de entrada é o
// módulo Medicamentos (com especificação), que PROJETA para a Agenda (recompra etc.).
// Eventos de medicamento já gravados continuam renderizáveis via EVENT_TYPE_LABELS.

// Superset de rótulos para RENDERIZAÇÃO (inclui tipos legados já gravados, para o
// Histórico nunca quebrar ao exibir dados antigos).
export const EVENT_TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta', exame: 'Exame', procedimento: 'Procedimento', cirurgia: 'Cirurgia',
  vacina: 'Vacina', medicamento: 'Medicamento', suplemento: 'Suplemento', plano: 'Plano de saúde',
  outro: 'Outro',
  // legados (não oferecidos no seletor, mas renderizáveis):
  retorno: 'Consulta', medicacao: 'Medicamento', atividade: 'Atividade física',
  estetico: 'Procedimento', omica: 'Ômica', protocolo: 'Protocolo',
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
/**
 * Interpreta uma DATA CIVIL ('YYYY-MM-DD', sem horário) como meia-noite LOCAL —
 * NÃO é uma conversão genérica de fuso. Evita o bug do "dia anterior": `new
 * Date('2026-07-03')` é lido como UTC e, em BR (UTC-3), vira 02/07 21h → exibe o dia
 * errado. Entradas que JÁ têm horário (timestamps completos, ex.: `created_at`) passam
 * DIRETO, sem alteração. Use em todo formatador que recebe datas do domínio
 * (event.date, exam_date, datas de biomarcador etc.).
 */
export function parseDateOnly(iso: string): Date {
  return new Date((iso ?? '').length <= 10 ? `${iso}T00:00:00` : iso)
}

/** Data por extenso pt-BR ('03 de jul. de 2026'), segura para date-only (UTC). */
export function formatDateLongBR(iso: string): string {
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
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

// ── EVT-C2 (NC-0007): surfacar preparo/desfecho/modalidade na Agenda/Histórico ─────────────────
// Antes só a notificação projetava estes campos; agora as telas os exibem a partir do MESMO domínio.

// Tipos de profissional de saúde — FONTE ÚNICA (seletor no modal + rótulos em Agenda/Histórico/Relatório/
// compartilhamento). Lista ABERTA: 'outro' cobre o que não está aqui; valor desconhecido degrada para null.
export const PROFESSIONAL_KIND_DEFS = [
  { id: 'medico',        label: 'Médico(a)' },
  { id: 'dentista',      label: 'Dentista' },
  { id: 'psicologo',     label: 'Psicólogo(a)' },
  { id: 'nutricionista', label: 'Nutricionista' },
  { id: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { id: 'outro',         label: 'Outro profissional' },
] as const

const PROFESSIONAL_KIND_LABELS: Record<string, string> =
  Object.fromEntries(PROFESSIONAL_KIND_DEFS.map(d => [d.id, d.label]))

/** Rótulo do tipo de profissional (null quando ausente/desconhecido). */
export function professionalKindLabel(kind: string | null | undefined): string | null {
  const k = (kind ?? '').trim()
  return k ? (PROFESSIONAL_KIND_LABELS[k] ?? null) : null
}

// EVT-C5 (NC-0017): prioridade (alta/média/baixa) — capturada mas nunca exibida/ordenada.
const PRIORITY_META: Record<EventPriority, { label: string; icon: string; rank: number }> = {
  alta:  { label: 'Alta',  icon: '🔴', rank: 0 },
  media: { label: 'Média', icon: '🟡', rank: 1 },
  baixa: { label: 'Baixa', icon: '🟢', rank: 2 },
}

/** Rótulo + ícone da prioridade (null quando ausente). */
export function priorityBadge(p: EventPriority | null): { label: string; icon: string } | null {
  const m = p ? PRIORITY_META[p] : null
  return m ? { label: m.label, icon: m.icon } : null
}

/** Peso ordinal p/ ORDENAR (alta=0 antes; ausência = último). Determinístico. */
export function priorityRank(p: EventPriority | null): number {
  return p ? PRIORITY_META[p].rank : 99
}

/** Comparador de desempate por prioridade (alta primeiro). Não altera a ordenação primária de quem chama. */
export function byPriority(a: { priority: EventPriority | null }, b: { priority: EventPriority | null }): number {
  return priorityRank(a.priority) - priorityRank(b.priority)
}

/** Rótulo curto da modalidade (só quando informada). */
export function modalityLabel(m: EventModality | null): string | null {
  return m === 'telemedicina' ? 'Telemedicina' : m === 'presencial' ? 'Presencial' : null
}

/** Resumo curto do DESFECHO para exibição (prioriza resumo › diagnóstico › conduta › observações). Null se vazio. */
export function outcomeSummary(o: Outcome | null): string | null {
  if (!o) return null
  const s = (o.summary ?? o.diagnosis ?? o.conduct ?? o.notes ?? '').trim()
  return s || null
}

/** Há algum conteúdo de desfecho preenchido? (para decidir exibir a marca "Desfecho registrado"). */
export function hasOutcome(o: Outcome | null): boolean {
  if (!o) return false
  return [o.summary, o.diagnosis, o.conduct, o.requestedExams, o.referrals, o.notes]
    .some(v => (v ?? '').trim().length > 0)
}
