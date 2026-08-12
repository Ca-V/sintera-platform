// FUNC — parsing puro do EventDraft (corpo HTTP não-confiável → domínio).
import { describe, it, expect } from 'vitest'
import { parseEventDraft } from '@/lib/agenda/draft'
import { ValidationError } from '@/lib/api/errors'

describe('parseEventDraft', () => {
  it('exige type, title e date (lança ValidationError)', () => {
    expect(() => parseEventDraft({ title: 'x', date: '2026-01-01' })).toThrow(ValidationError)
    expect(() => parseEventDraft({ type: 'consulta', date: '2026-01-01' })).toThrow(ValidationError)
    expect(() => parseEventDraft({ type: 'consulta', title: 'x' })).toThrow(ValidationError)
    expect(() => parseEventDraft({})).toThrow('Campos obrigatórios')
  })

  it('trata strings só-espaço como ausentes', () => {
    expect(() => parseEventDraft({ type: '  ', title: 'x', date: '2026-01-01' })).toThrow(ValidationError)
  })

  it('monta o draft mínimo com status default planejado', () => {
    const d = parseEventDraft({ type: 'consulta', title: 'Cardio', date: '2026-03-10' })
    expect(d).toMatchObject({ type: 'consulta', title: 'Cardio', date: '2026-03-10', status: 'planejado' })
    expect(d.time).toBeNull()
    expect(d.modality).toBeNull()
    expect(d.directExpense).toBe(false)
    expect(d.amountCents).toBeNull()
  })

  it('normaliza status inválido para planejado e aceita status válido', () => {
    expect(parseEventDraft({ type: 'exame', title: 't', date: '2026-01-01', status: 'zzz' }).status).toBe('planejado')
    expect(parseEventDraft({ type: 'exame', title: 't', date: '2026-01-01', status: 'realizado' }).status).toBe('realizado')
  })

  it('normaliza modality inválida para null e aceita válida', () => {
    expect(parseEventDraft({ type: 'consulta', title: 't', date: '2026-01-01', modality: 'zoom' }).modality).toBeNull()
    expect(parseEventDraft({ type: 'consulta', title: 't', date: '2026-01-01', modality: 'telemedicina' }).modality).toBe('telemedicina')
  })

  it('preserva amountCents numérico e directExpense booleano; trima textos', () => {
    const d = parseEventDraft({
      type: 'procedimento', title: '  Sessão  ', date: '2026-02-02',
      amountCents: 15000, directExpense: true, establishment: '  Clínica  ', time: '14:30',
    })
    expect(d.title).toBe('Sessão')
    expect(d.establishment).toBe('Clínica')
    expect(d.time).toBe('14:30')
    expect(d.amountCents).toBe(15000)
    expect(d.directExpense).toBe(true)
  })

  it('ignora amountCents não-numérico', () => {
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01', amountCents: '15000' }).amountCents).toBeNull()
  })

  it('aceita attachmentUrl (anexo do evento) e trima; vazio vira null', () => {
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01', attachmentUrl: '  https://u/f.jpg ' }).attachmentUrl).toBe('https://u/f.jpg')
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01' }).attachmentUrl).toBeNull()
  })

  it('inclui id só quando presente (edição = upsert)', () => {
    expect('id' in parseEventDraft({ type: 'x', title: 't', date: '2026-01-01' })).toBe(false)
    expect(parseEventDraft({ id: 'ev-1', type: 'x', title: 't', date: '2026-01-01' }).id).toBe('ev-1')
  })

  it('lembrete liga por padrão e só desliga com reminderEnabled:false', () => {
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01' }).reminderEnabled).toBe(true)
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01', reminderEnabled: true }).reminderEnabled).toBe(true)
    expect(parseEventDraft({ type: 'x', title: 't', date: '2026-01-01', reminderEnabled: false }).reminderEnabled).toBe(false)
  })
})
