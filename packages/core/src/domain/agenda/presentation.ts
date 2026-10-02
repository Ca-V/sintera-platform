// @sintera/core — APRESENTAÇÃO dos eventos (rótulos, formatação). Fonte ÚNICA (Web + Mobile). Mantém o
// domínio (event.ts) livre de texto/formato visual. A projeção para notificação (eventToNotificationInput)
// permanece na Web (depende do módulo notification); tudo o mais é puro e vive aqui.
import { EVENT_PRIORITIES, EVENT_MODALITIES } from './event'
import type { EventStatus, EventModality, EventPriority, Outcome } from './event'

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

// Rótulo da CATEGORIA CLÍNICA de uma entrada do Histórico (TimelineEntry.category) — FONTE ÚNICA Web+Mobile.
// Cobre os tipos de evento (via typeLabel) + categorias de outros domínios projetados (exame/ômica/contracepção).
// Fallback SEMPRE 'Outro' — NUNCA a palavra estrutural "Evento" (colírio, p.ex., aparece na categoria real).
const TIMELINE_CATEGORY_LABELS: Record<string, string> = { exame: 'Exame', omica: 'Ômica', contraceptivo: 'Contracepção' }
export function timelineCategoryLabel(category: string): string {
  return TIMELINE_CATEGORY_LABELS[category] ?? typeLabel(category)
}
export function statusLabel(status: EventStatus): string { return EVENT_STATUS_LABELS[status] ?? status }

// Formatação pura (sem Date/locale → determinística e testável).
/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. Entrada inesperada retorna a própria string. */
export function formatDateBR(iso: Date | string): string {
  // `Date` usa a data LOCAL, e não os dez primeiros caracteres do ISO: para um INSTANTE, recortar o ISO
  // mostraria a data em UTC — 22h de terça em Brasília viraria quarta.
  if (iso instanceof Date) {
    return Number.isNaN(iso.getTime()) ? '' : `${dois(iso.getDate())}/${dois(iso.getMonth() + 1)}/${iso.getFullYear()}`
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? '')
}

/**
 * Normaliza a entrada dos formatadores de DATA CIVIL.
 *
 * Aceitar `Date` além de string entrou em 01/10/2026, ao fechar a dívida dos 18 arquivos: muitas telas já
 * tinham um `Date` em mãos, e obrigá-las a passar por `toISOString()` reintroduziria o deslocamento de fuso
 * que `parseDateOnly` existe para impedir — a correção criaria o bug que ela veio corrigir.
 */
function comoData(v: Date | string | null | undefined): Date {
  return v instanceof Date ? v : parseDateOnly(String(v ?? ''))
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

/**
 * INSTANTE (timestamp com fuso) → data e hora LOCAIS: '01/08/2026 às 07:51'.
 *
 * Diferente de `formatDateBR`, que recorta os dez primeiros caracteres e por isso mostra a data em UTC. Para
 * uma data civil isso é certo; para um instante, é errado — uma atividade gravada às 22h de terça em Brasília
 * é gravada como quarta em UTC, e apareceria no dia seguinte.
 *
 * Existe aqui, e não em cada tela, porque o horário de um dado recebido é lido igual na Web e no aplicativo, e
 * duas implementações divergiriam exatamente neste ponto — que é invisível até o dia em que alguém treina à
 * noite. Entrada inutilizável devolve string vazia: data inventada é pior que data ausente.
 */
export function formatInstantBR(iso: string | null | undefined): string {
  if (!iso) return ''
  // Timestamp do Postgres vem com espaço no lugar do 'T' e fuso sem dois-pontos; os dois quebram o Date do
  // JavaScriptCore (o motor do aplicativo), que é mais estrito que o do navegador.
  const normalizado = iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  const d = new Date(normalizado)
  if (Number.isNaN(d.getTime())) return ''
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} às ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

/** Abreviação do mês, pt-BR. Construída à mão — ver `formatDateLongBR`. */
const MES_ABREV = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const dois = (n: number) => String(n).padStart(2, '0')

/**
 * Data por extenso pt-BR ('03 de jul. de 2026'), segura para date-only.
 *
 * SEM `Intl`, desde 30/09/2026. Ela chamava `toLocaleDateString('pt-BR', { month: 'short' })`, e o locale
 * explícito resolvia só metade do problema:
 *
 *  · no Hermes (o motor do aplicativo em Android), o `Intl` é reduzido e nem sempre traz os dados de pt-BR.
 *    Quando não traz, ele NÃO falha — degrada para outro formato. A mesma função devolvia "03 de jul. de
 *    2026" na Web e podia devolver "Jul 3, 2026" num celular, sem erro nenhum para acusar.
 *  · o resultado dependia da build do aparelho, então nem entre dois celulares havia garantia.
 *
 * Montada à mão, é idêntica em toda parte e não depende de dado de sistema. `parseDateOnly` continua
 * cuidando do fuso: sem ele, '2026-07-03' viraria 02/07 no Brasil.
 */
export function formatDateLongBR(iso: Date | string): string {
  const d = comoData(iso)
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : ''
  return `${dois(d.getDate())} de ${MES_ABREV[d.getMonth()]} de ${d.getFullYear()}`
}

/** 'HH:MM[:SS]' → 'HH:MM'. Vazio → null. */
export function formatTimeBR(time: string | null): string | null {
  if (!time) return null
  const m = /^(\d{2}):(\d{2})/.exec(time)
  return m ? `${m[1]}:${m[2]}` : null
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

/**
 * Opções de prioridade para o seletor, na ordem em que a pessoa as vê — alta primeiro.
 *
 * O Mobile mantinha esta lista escrita à mão, com os mesmos três rótulos que já viviam em `PRIORITY_META`.
 * Duplicação achada pela catraca de base única (27/08): renomear "Média" ou acrescentar um nível mexeria num
 * lado só, e o seletor de uma das telas ficaria falando um vocabulário que o outro não conhece.
 */
export function eventPriorityOptions(): { value: EventPriority; label: string }[] {
  return EVENT_PRIORITIES.map(p => ({ value: p, label: PRIORITY_META[p].label }))
}

/** Opções de modalidade para o seletor — mesmo motivo de `eventPriorityOptions`. */
export function eventModalityOptions(): { value: EventModality; label: string }[] {
  return EVENT_MODALITIES.map(m => ({ value: m, label: modalityLabel(m)! }))
}

/** Peso ordinal p/ ORDENAR (alta=0 antes; ausência = último). Determinístico. */
export function priorityRank(p: EventPriority | null): number {
  return p ? PRIORITY_META[p].rank : 99
}

/** Comparador de desempate por prioridade (alta primeiro). Não altera a ordenação primária de quem chama. */
export function byPriority(a: { priority: EventPriority | null }, b: { priority: EventPriority | null }): number {
  return priorityRank(a.priority) - priorityRank(b.priority)
}

const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
/** Rótulo "Mês de Ano" (pt-BR) DETERMINÍSTICO — sem toLocaleDateString (compat Hermes). Usado no agrupamento "Por data". */
export function monthLabel(date: string): string {
  const [y, m] = (date || '').slice(0, 10).split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return '—'
  const s = `${MONTHS_PT[m - 1]} de ${y}`
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const TYPE_GROUP_ORDER = ['Consulta', 'Exame', 'Procedimento', 'Cirurgia', 'Medicamento', 'Suplemento', 'Vacina', 'Ômica', 'Contracepção', 'Plano de saúde', 'Atividade física']
/** Rank do GRUPO por rótulo de tipo (ordena a visão "Por tipo"); fora da lista = último. Fonte única Web+Mobile. */
export function typeGroupRank(label: string): number {
  const i = TYPE_GROUP_ORDER.findIndex(o => label.startsWith(o))
  return i < 0 ? 99 : i
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

// ========================================================================================================
// DATE-001 — o conjunto completo de formatadores, SEM `Intl`.
// ========================================================================================================
// Acrescentados em 01/10/2026 para fechar a dívida dos 18 arquivos que ainda chamavam `toLocaleDateString`
// direto. O motivo é o mesmo que tirou o `Intl` de `formatDateLongBR`: no Hermes — o motor do aplicativo em
// Android — o `Intl` é reduzido e nem sempre traz pt-BR. Quando não traz, ele NÃO falha: degrada. A mesma
// data sai diferente no celular, e o resultado varia com a build do aparelho.
//
// MOEDA E NÚMERO FICAM DE FORA, de propósito: `toLocaleString(valor, { style: 'currency' })` formata número,
// não data. Não há risco de fuso, e a variação de separador entre motores é cosmética.

/** Nome do mês por extenso, pt-BR. Construído à mão — ver a nota acima. */
const MES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** 'julho de 2026' — cabeçalho de mês em listas agrupadas. Seguro para date-only. */
export function formatMonthLongBR(iso: Date | string): string {
  const d = comoData(iso)
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : ''
  return `${MES_EXTENSO[d.getMonth()]} de ${d.getFullYear()}`
}

/** 'set./26' — eixo de gráfico e rótulo curto, onde o ano inteiro não cabe. */
export function formatMonthShortBR(iso: Date | string): string {
  const d = comoData(iso)
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : ''
  return `${MES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`
}

/** '03 de julho de 2026' — a forma mais formal, para documento impresso e relatório. */
export function formatDateFullBR(iso: Date | string): string {
  const d = comoData(iso)
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : ''
  return `${dois(d.getDate())} de ${MES_EXTENSO[d.getMonth()]} de ${d.getFullYear()}`
}

/**
 * 'HH:MM' a partir de um INSTANTE (timestamp completo), no fuso de quem olha.
 *
 * Diferente de `formatTimeBR`, que recebe 'HH:MM:SS' já pronto. Aqui o horário é lido do `Date`, então o
 * fuso local é o certo: um registro feito às 14h deve aparecer como 14h para quem o fez.
 */
export function formatHourBR(instante: Date | string | null | undefined): string {
  if (!instante) return ''
  const d = instante instanceof Date ? instante : new Date(instante)
  if (Number.isNaN(d.getTime())) return ''
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`
}

/**
 * '03 de jul. de 2026, 14:05' — instante completo.
 *
 * Recebe TIMESTAMP, não data civil: a parte do horário só existe se houver horário. Por isso usa `new Date`
 * direto, e não `parseDateOnly` — aqui o deslocamento de fuso é desejado.
 */
export function formatDateTimeLongBR(instante: Date | string | null | undefined): string {
  if (!instante) return ''
  const d = instante instanceof Date ? instante : new Date(instante)
  if (Number.isNaN(d.getTime())) return ''
  return `${dois(d.getDate())} de ${MES_ABREV[d.getMonth()]} de ${d.getFullYear()}, ${dois(d.getHours())}:${dois(d.getMinutes())}`
}

/** '03 de jul., 14:05' — instante sem o ano, quando ele é óbvio pelo contexto. */
export function formatDayTimeBR(instante: Date | string | null | undefined): string {
  if (!instante) return ''
  const d = instante instanceof Date ? instante : new Date(instante)
  if (Number.isNaN(d.getTime())) return ''
  return `${dois(d.getDate())} de ${MES_ABREV[d.getMonth()]}, ${dois(d.getHours())}:${dois(d.getMinutes())}`
}

/** Dia da semana abreviado, pt-BR. Construído à mão, como os demais. */
const DIA_ABREV = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']

/**
 * 'qui., 03 de out.' — usado no texto do LEMBRETE, onde o dia da semana orienta mais do que o número.
 *
 * Roda no servidor, onde o `Intl` do Node é completo e o risco do Hermes não existe. Veio para cá mesmo
 * assim por dois motivos: o locale do servidor pode mudar com a hospedagem, e um lembrete que escreve "Thu"
 * para quem o lê em português é um defeito que ninguém testa até acontecer.
 */
export function formatWeekdayShortBR(data: Date | string): string {
  const d = comoData(data)
  if (Number.isNaN(d.getTime())) return typeof data === 'string' ? data : ''
  return `${DIA_ABREV[d.getDay()]}, ${dois(d.getDate())} de ${MES_ABREV[d.getMonth()]}`
}
