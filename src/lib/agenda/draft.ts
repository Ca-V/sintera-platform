// Parsing PURO de um EventDraft a partir de um corpo HTTP não-confiável (Mobile/Web).
// Vive no domínio (não na rota) porque é regra de negócio: quais campos entram, o que é
// obrigatório e como enums inválidos são normalizados. A rota /api/agenda é só a casca.
import { ValidationError } from '@/lib/api/errors'
import {
  EVENT_STATUSES, EVENT_MODALITIES, type EventStatus, type EventModality,
} from './event'
import type { EventDraft } from './service'

const STATUS_SET = new Set<string>(EVENT_STATUSES)
const MODALITY_SET = new Set<string>(EVENT_MODALITIES)

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/**
 * Valida e normaliza o corpo em um EventDraft.
 * - `type`, `title`, `date` são OBRIGATÓRIOS (lança ValidationError → 422).
 * - `status` inválido/ausente → 'planejado'; `modality` inválida/ausente → null.
 * - strings vazias viram null; `amountCents` só entra se for número; `directExpense` booleano.
 */
export function parseEventDraft(body: unknown): EventDraft {
  const b = (body ?? {}) as Record<string, unknown>
  const type = str(b.type)
  const title = str(b.title)
  const date = str(b.date)
  if (!type || !title || !date) {
    throw new ValidationError('Campos obrigatórios: type, title, date.')
  }
  const statusRaw = str(b.status)
  const status: EventStatus = statusRaw && STATUS_SET.has(statusRaw) ? (statusRaw as EventStatus) : 'planejado'
  const modalityRaw = str(b.modality)
  const modality: EventModality | null = modalityRaw && MODALITY_SET.has(modalityRaw) ? (modalityRaw as EventModality) : null

  return {
    type, title, date,
    time: str(b.time),
    status,
    modality,
    notes: str(b.notes),
    professionalName: str(b.professionalName),
    professionalKind: str(b.professionalKind),
    establishment: str(b.establishment),
    location: str(b.location),
    amountCents: typeof b.amountCents === 'number' ? b.amountCents : null,
    directExpense: b.directExpense === true,
  }
}
