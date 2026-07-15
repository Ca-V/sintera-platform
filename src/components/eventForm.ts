'use client'

// Lógica ÚNICA de formulário de evento — reutilizada por Agenda, Histórico e Gastos.
// Garante que existe UM só caminho para criar/editar um "evento de saúde":
// AgendarModal (UI) + este módulo (mapeamento + persistência via domínio).

import { useMemo } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { eventServicesFor, formatTimeBR, type HealthEvent } from '@/lib/agenda'
import { parseRule, serializeRule } from '@/lib/recurrence'
import type { AgendaEventInput, EventType } from './AgendarModal'

// ── Mapeamento de tipos (fonte única) ────────────────────────────────────────
export const MODAL_TYPES: EventType[] = ['consulta', 'exame', 'procedimento', 'vacina', 'plano', 'outro']
// Não-tipos/legados → tipo do seletor (+ atributo): retorno→consulta(isReturn),
// cirurgia→procedimento(isSurgery). Medicamento/suplemento/medicação não têm tipo
// próprio na Agenda (entrada = módulo Medicamentos) → 'outro' ao abrir no modal.
// A exibição na lista mantém o ícone 💊 (mapa de ícones da Agenda / EVENT_TYPE_LABELS).
const LEGACY_TYPE_MAP: Record<string, EventType> = {
  retorno: 'consulta', cirurgia: 'procedimento', suplemento: 'outro',
  medicamento: 'outro', medicacao: 'outro', estetico: 'procedimento', atividade: 'outro', omica: 'outro',
}
export const toModalType = (t: string): EventType =>
  (MODAL_TYPES as string[]).includes(t) ? (t as EventType) : (LEGACY_TYPE_MAP[t] ?? 'outro')
const toModalStatus = (s: string): AgendaEventInput['status'] =>
  s === 'realizado' ? 'realizado' : s === 'cancelado' ? 'cancelado' : 'planejado'

// "150,00" | "R$ 1.500,00" | "150.5" → centavos. Vazio/inválido → null.
// Parsing financeiro movido para o domínio puro (testável): src/lib/agenda/money.ts.
import { parseAmountToCents, centsToAmount } from '@/lib/agenda/money'
export { parseAmountToCents }

/** Evento de domínio → valores iniciais do formulário (edição). */
export function eventToInput(ev: HealthEvent): Partial<AgendaEventInput> {
  const isPlano = ev.type === 'plano'
  const rule = parseRule(ev.recurrenceRule)
  return {
    eventType: toModalType(ev.type),
    isReturn: ev.isReturn || ev.type === 'retorno',
    isSurgery: ev.type === 'cirurgia',
    status: toModalStatus(ev.status),
    title: ev.title, date: ev.date,
    time: formatTimeBR(ev.time) ?? '', durationMin: ev.durationMin ?? 60,
    notes: ev.notes ?? '', reminderEnabled: ev.reminderEnabled,
    modality: ev.modality ?? '', professionalName: ev.professionalName ?? '',
    establishment: isPlano ? '' : (ev.establishment ?? ''),
    location: isPlano ? '' : (ev.location ?? ''),
    preparation: ev.preparation ?? '', amount: centsToAmount(ev.amountCents),
    recurrenceFrequency: rule.frequency, recurrenceUntil: rule.until ?? '',
    priority: ev.priority ?? '', directExpense: ev.directExpense,
    outcome: ev.outcome?.summary ?? '',
    operadora: isPlano ? (ev.establishment ?? '') : '',
    carteirinha: isPlano ? (ev.location ?? '') : '',
    attachmentUrl: ev.attachmentUrl ?? undefined,
  }
}

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

/** Hook com o ÚNICO caminho de gravação de evento (criar/editar) via domínio. */
export function useEventForm() {
  const supabase = useMemo(() => createClient() as unknown as SupabaseClient, [])
  const services = useMemo(() => eventServicesFor(supabase), [supabase])

  async function uploadAttachment(userId: string, file: File): Promise<string | null> {
    if (!ACCEPTED.includes(file.type)) throw new Error('Anexo deve ser PDF, JPG ou PNG.')
    if (file.size > MAX_BYTES) throw new Error('Anexo muito grande (máx. 10 MB).')
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error(`Falha no anexo: ${error.message}`)
    const { data } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
    return data?.signedUrl ?? null
  }

  // Salva (criar OU editar). Ao editar, PRESERVA campos fora do formulário
  // (links, lineage, série, completed_at, anexo atual) mesclando o evento existente.
  async function saveEvent(userId: string, input: AgendaEventInput, editing?: HealthEvent | null): Promise<void> {
    const isPlano = input.eventType === 'plano'
    const establishment = isPlano ? input.operadora : input.establishment
    const location = isPlano ? input.carteirinha : input.location
    const recurrenceRule = serializeRule({ frequency: input.recurrenceFrequency, interval: 1, until: input.recurrenceUntil || null, count: null })
    let attachmentUrl = editing?.attachmentUrl ?? null
    if (input.attachmentFile) attachmentUrl = await uploadAttachment(userId, input.attachmentFile)
    await services.command.create(userId, {
      ...(editing ?? {}),
      type: input.isSurgery ? 'cirurgia' : input.eventType,
      title: input.title, date: input.date,
      time: input.time || null, durationMin: input.durationMin, notes: input.notes || null,
      reminderEnabled: input.reminderEnabled, modality: input.modality || null,
      professionalName: input.professionalName || null,
      establishment: establishment || null, location: location || null,
      preparation: input.preparation || null, amountCents: parseAmountToCents(input.amount),
      attachmentUrl, recurrenceRule, priority: input.priority || null,
      outcome: input.outcome ? { summary: input.outcome } : null,
      directExpense: input.directExpense, isReturn: input.isReturn,
      status: input.status, source: editing?.source ?? 'manual',
    })
  }

  return { services, supabase, saveEvent }
}
