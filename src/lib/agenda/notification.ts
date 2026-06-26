// Agenda — montagem da NOTIFICAÇÃO de evento (REQ-NOTIF-001).
// Fonte ÚNICA de verdade do conteúdo da notificação: consumida pela tela e pelos
// templates de e-mail/WhatsApp, evitando duas listas independentes de campos.
// Função PURA + testada. Organização factual, sem juízo clínico (RDC 657/2022).

export type EventModality = 'presencial' | 'telemedicina'

/** Campos do evento relevantes para a notificação (já formatados para exibição). */
export interface EventNotificationInput {
  typeLabel: string                 // "Consulta", "Exame", "Vacina"…
  title: string                     // "Consulta de Cardiologia"
  dateLabel: string                 // "18/07/2026" (data já formatada)
  timeLabel?: string | null         // "14:30"
  professional?: string | null      // "Dr. João Silva"
  establishment?: string | null     // "Clínica ABC"
  location?: string | null          // endereço/sala
  modality?: EventModality | null
  preparation?: string | null       // orientações de preparo (ex.: "Jejum de 8h")
}

export interface NotificationLine { icon: string; text: string }

export interface EventNotification {
  heading: string                   // título do evento
  typeLabel: string                 // para assunto/cabeçalho
  lines: NotificationLine[]         // somente os campos presentes, em ordem
}

const ICON = { date: '📅', time: '🕒', tele: '💻', prof: '👨‍⚕️', place: '📍', prep: '📋' } as const

/**
 * Monta a notificação a partir do objeto de domínio. Inclui SEMPRE que disponível:
 * data, horário, modalidade (quando telemedicina), profissional, estabelecimento/
 * local, preparo. Campos ausentes simplesmente não geram linha — nada é inventado.
 */
export function buildEventNotification(ev: EventNotificationInput): EventNotification {
  const lines: NotificationLine[] = []
  const push = (icon: string, text?: string | null) => {
    const t = text?.trim()
    if (t) lines.push({ icon, text: t })
  }

  push(ICON.date, ev.dateLabel)
  push(ICON.time, ev.timeLabel)
  if (ev.modality === 'telemedicina') lines.push({ icon: ICON.tele, text: 'Telemedicina' })
  push(ICON.prof, ev.professional)
  const place = [ev.establishment, ev.location].map(s => s?.trim()).filter(Boolean).join(' · ')
  push(ICON.place, place)
  push(ICON.prep, ev.preparation)

  return { heading: ev.title, typeLabel: ev.typeLabel, lines }
}

/** Linha única factual: "📅 18/07/2026 · 🕒 14:30 · 👨‍⚕️ Dr. João Silva · 📍 Clínica ABC". */
export function notificationToInline(n: EventNotification): string {
  return n.lines.map(l => `${l.icon} ${l.text}`).join(' · ')
}
