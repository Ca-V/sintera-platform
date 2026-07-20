// NOTIF-001 — Preferências de notificação (infraestrutura ÚNICA e transversal).
//
// Fundadora (14/07/2026): uma SÓ infraestrutura de notificações para TODA a plataforma. O usuário
// configura, POR CATEGORIA de evento, o canal: e-mail · WhatsApp · ambos · nenhum. Reutilizada por
// todos os módulos — proibido implementação específica por funcionalidade.
//
// Esta é a camada de DOMÍNIO (pura, sem IO): o CONTRATO de preferências e a resolução de canais.
// O orquestrador (worker de lembretes) e a UI consomem estas funções; os "gateways" de envio
// (e-mail via Resend, WhatsApp via Meta) permanecem como adapters de canal já existentes.
//
// Modelo Aberto: `category` é string aberta. Uma categoria nova/desconhecida NUNCA quebra — cai no
// default. Recorrências e lembretes são MODOS de entrega transversais (não categorias): seguem a
// preferência da categoria do evento subjacente.

/** Escolha de canal por categoria — as 4 opções da fundadora. */
export type NotificationChannel = 'email' | 'whatsapp' | 'both' | 'none'

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['email', 'whatsapp', 'both', 'none']

/** Default de canal quando não há preferência explícita nem opt-in legado. */
export const DEFAULT_CHANNEL: NotificationChannel = 'email'

/** Categorias configuráveis (abertas/escaláveis). Alinhadas às categorias de evento agendável. */
export interface NotificationCategory {
  key: string
  label: string
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  { key: 'consulta',     label: 'Consultas' },
  { key: 'exame',        label: 'Exames' },
  { key: 'procedimento', label: 'Procedimentos' },
  { key: 'vacina',       label: 'Vacinas' },
  { key: 'medicamento',  label: 'Medicamentos' },
  { key: 'suplemento',   label: 'Suplementos' },
  // FB-016-4 (re-validação): removidas "Dispositivos" e "Planejamento" — categorias MORTAS (nenhum tipo de evento
  // roteia para elas) e SEM item na Sidebar. A nomenclatura visível deve casar com a navegação real (troca de
  // dispositivo cai em "Outros"; o domínio Planejamento entra quando for construído na Sidebar).
  { key: 'avaliacao',    label: 'Composição Corporal' },       // FB-016-4 — nomenclatura idêntica à Sidebar
  { key: 'outro',        label: 'Outros eventos assistenciais' },
]

// NOTIF-001 (FB-011) — PRIORIDADE. Notificações OBRIGATÓRIAS (críticas) são SEMPRE enviadas e NÃO entram nas
// preferências (a usuária não desliga). Distinguem-se das CONFIGURÁVEIS (as categorias acima, que obedecem à
// preferência). Aqui só a lista para exibição transparente ("sempre enviadas"); o disparo dessas é do sistema.
export const MANDATORY_NOTIFICATIONS: { key: string; label: string }[] = [
  { key: 'cadastro',        label: 'Confirmação de cadastro' },
  { key: 'senha',           label: 'Alteração de senha' },
  { key: 'compartilhamento', label: 'Compartilhamento aceito' },
]

/** Preferências RECOMENDADAS (default) para todas as categorias configuráveis. Base do "Restaurar recomendadas". */
export function recommendedChannels(): Record<string, NotificationChannel> {
  const out: Record<string, NotificationChannel> = {}
  for (const c of NOTIFICATION_CATEGORIES) out[c.key] = DEFAULT_CHANNEL
  return out
}

// Mapa ABERTO tipo-de-evento → categoria de notificação. Tipos não mapeados caem em 'outro'
// (nunca quebra). 'cirurgia'→procedimento, 'retorno'→consulta, 'atividade'/'estetico'→avaliacao,
// 'omica'/'protocolo'→exame: mantém a config coerente com o que o usuário reconhece.
const EVENT_TYPE_TO_CATEGORY: Record<string, string> = {
  consulta: 'consulta', retorno: 'consulta',
  exame: 'exame', omica: 'exame', protocolo: 'exame',
  procedimento: 'procedimento', cirurgia: 'procedimento',
  vacina: 'vacina',
  medicamento: 'medicamento', medicacao: 'medicamento',
  suplemento: 'suplemento',
  avaliacao: 'avaliacao', atividade: 'avaliacao', estetico: 'avaliacao',
  outro: 'outro', evento: 'outro', plano: 'outro',
}

const FALLBACK_CATEGORY = 'outro'

/** Categoria de notificação de um tipo de evento. Determinística; nunca lança. */
export function categoryForEventType(eventType: string | null | undefined): string {
  const t = (eventType ?? '').trim().toLowerCase()
  return EVENT_TYPE_TO_CATEGORY[t] ?? FALLBACK_CATEGORY
}

/** Decompõe a escolha de canal nos canais efetivos. */
export function resolveChannels(channel: NotificationChannel): { email: boolean; whatsapp: boolean } {
  return {
    email:    channel === 'email' || channel === 'both',
    whatsapp: channel === 'whatsapp' || channel === 'both',
  }
}

/**
 * Resolve os canais para um evento, dado:
 *  - as preferências do usuário por categoria (linhas de notification_preferences);
 *  - o tipo do evento (→ categoria);
 *  - o opt-in LEGADO de WhatsApp (profiles.pref_whatsapp_reminder), para continuidade.
 *
 * Regra: se há preferência explícita para a categoria, ela MANDA. Sem preferência, mantém o
 * comportamento atual (e-mail sempre; WhatsApp só com opt-in legado) — nada regride até o usuário
 * configurar. Puro e determinístico.
 */
export function resolveChannelsForEvent(args: {
  prefsByCategory: Map<string, NotificationChannel>
  eventType: string | null | undefined
  legacyWhatsAppOptIn: boolean
}): { email: boolean; whatsapp: boolean; channel: NotificationChannel } {
  const category = categoryForEventType(args.eventType)
  const explicit = args.prefsByCategory.get(category)
  const channel: NotificationChannel = explicit ?? (args.legacyWhatsAppOptIn ? 'both' : DEFAULT_CHANNEL)
  return { ...resolveChannels(channel), channel }
}
