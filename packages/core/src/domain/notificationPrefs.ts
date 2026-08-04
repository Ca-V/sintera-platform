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

/**
 * Categorias configuráveis. **FB-017 (princípio permanente): a Central de Notificações NÃO tem taxonomia própria —
 * ela ESPELHA os domínios da Sidebar.** Cada categoria = um domínio real que EFETIVAMENTE gera notificações; a
 * `section` é a mesma seção da Sidebar. Domínios sem eventos que notifiquem NÃO entram (nada de categoria vazia);
 * entram quando passarem a gerar eventos. A Sidebar é a referência oficial de taxonomia (sem taxonomias paralelas).
 */
export interface NotificationCategory {
  key: string
  label: string
  section: string   // seção da Sidebar (Acompanhamento · Minha Saúde)
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  // Acompanhamento
  { key: 'agenda',      label: 'Agenda',               section: 'Acompanhamento' },  // consultas, exames, procedimentos, vacinas, retornos…
  // Minha Saúde
  { key: 'medicamento', label: 'Medicamentos',         section: 'Minha Saúde' },     // recompra
  { key: 'suplemento',  label: 'Suplementos',          section: 'Minha Saúde' },     // recompra
  { key: 'recurso',     label: 'Recursos de Saúde',    section: 'Minha Saúde' },     // troca/manutenção
  { key: 'ciclo',       label: 'Ciclo e Contracepção', section: 'Minha Saúde' },     // troca/reaplicação
  { key: 'habito',      label: 'Hábitos',              section: 'Minha Saúde' },     // lembrete recorrente de hábito
  { key: 'outro',       label: 'Outros',               section: 'Minha Saúde' },     // fallback: evento sem domínio
  // Fora por ora (sem eventos que notifiquem): Composição Corporal, Exames/Documentos, Monitoramento,
  // Condições, Históricos, Despesas, Relatórios. Entram quando gerarem lembretes/notificações próprios.
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

// Mapa ABERTO tipo-de-evento → DOMÍNIO da Sidebar (FB-017). Tipos não mapeados caem em 'outro' (nunca quebra).
// Todos os eventos AGENDADOS (consulta/exame/procedimento/vacina/retorno/cirurgia/plano/…) → 'agenda' (a Sidebar
// tem "Agenda", não os tipos separados). Domínios específicos vêm da ORIGEM: 'medicacao'→medicamento,
// 'suplemento'→suplemento, 'contracepcao'→ciclo. Recursos são roteados por VÍNCULO (ver categoryForEvent).
const EVENT_TYPE_TO_CATEGORY: Record<string, string> = {
  consulta: 'agenda', retorno: 'agenda',
  exame: 'agenda', omica: 'agenda', protocolo: 'agenda',
  procedimento: 'agenda', cirurgia: 'agenda',
  vacina: 'agenda',
  plano: 'agenda', evento: 'agenda', outro: 'agenda',
  avaliacao: 'agenda', atividade: 'agenda', estetico: 'agenda',
  medicamento: 'medicamento', medicacao: 'medicamento',
  suplemento: 'suplemento',
  contracepcao: 'ciclo',
}

const FALLBACK_CATEGORY = 'outro'

/** Categoria (domínio) de um tipo de evento. Determinística; nunca lança. */
export function categoryForEventType(eventType: string | null | undefined): string {
  const t = (eventType ?? '').trim().toLowerCase()
  return EVENT_TYPE_TO_CATEGORY[t] ?? FALLBACK_CATEGORY
}

/**
 * Categoria (domínio) de um EVENTO, considerando tipo E vínculos. O domínio de origem prevalece: um lembrete
 * vinculado a um RECURSO cai em "Recursos de Saúde" mesmo tendo tipo genérico ('outro'). Determinística.
 */
export function categoryForEvent(ev: { type?: string | null; links?: { type: string }[] | null }): string {
  if (ev.links?.some(l => l.type === 'resource')) return 'recurso'
  if (ev.links?.some(l => l.type === 'habit')) return 'habito'
  return categoryForEventType(ev.type)
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
  /** Vínculos do evento — permitem rotear pelo DOMÍNIO de origem (ex.: recurso). Opcional (retrocompat). */
  links?: { type: string }[] | null
  legacyWhatsAppOptIn: boolean
}): { email: boolean; whatsapp: boolean; channel: NotificationChannel } {
  const category = categoryForEvent({ type: args.eventType, links: args.links })
  const explicit = args.prefsByCategory.get(category)
  const channel: NotificationChannel = explicit ?? (args.legacyWhatsAppOptIn ? 'both' : DEFAULT_CHANNEL)
  return { ...resolveChannels(channel), channel }
}
