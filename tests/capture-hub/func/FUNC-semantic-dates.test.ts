import { describe, it, expect } from 'vitest'
import { pickExamDate } from '@/lib/capture/semantic-dates'

// FUNC — Datas semânticas (CEF §5). Escolhe a data de REALIZAÇÃO, nunca nascimento/impressão/protocolo.
// Casos reais: laudo 2009 (coleta 11/05/2009, impresso 13/07/26, nascimento 23/05/1980) e EEG "2002".

describe('FUNC · pickExamDate', () => {
  it('laudo 2009: escolhe a DATA DA COLETA (11/05/2009), não impressão nem nascimento', () => {
    const r = pickExamDate(
      `Dt Nasc: 23/05/1980  [DATA DA COLETA : 11/05/2009 10:04]  Liberado: 11/05/2009  Data Impresso: 13/07/26`,
    )
    expect(r.iso).toBe('2009-05-11')
    expect(r.kind).toBe('coleta')
    expect(r.confidence).toBe('high')
  })

  it('NUNCA escolhe data de nascimento, mesmo sendo a 1ª data', () => {
    const r = pickExamDate(`Data de nascimento: 23/05/1980. Data da coleta: 27/02/2026.`)
    expect(r.iso).toBe('2026-02-27')
    expect(r.kind).toBe('coleta')
  })

  it('EEG: ignora protocolo/atendimento e usa a data de realização', () => {
    const r = pickExamDate(`Atend.: 014-0438250  Protocolo 2002  Realizado em 27/02/2026.`)
    expect(r.iso).toBe('2026-02-27')
    expect(r.kind).toBe('realizacao')
  })

  it('ano de 2 dígitos: 09 → 2009, 80 → 1980', () => {
    const r = pickExamDate(`Data da coleta: 11/05/09`)
    expect(r.iso).toBe('2009-05-11')
  })

  it('só data de impressão/nascimento (sem realização) → null (não inventa)', () => {
    const r = pickExamDate(`Data Impresso: 13/07/2026  Nascimento: 23/05/1980`)
    expect(r.iso).toBeNull()
    expect(r.confidence).toBe('low')
  })

  it('é DETERMINÍSTICA', () => {
    const txt = `Coleta: 11/05/2009  Impresso: 13/07/2026`
    expect(JSON.stringify(pickExamDate(txt))).toBe(JSON.stringify(pickExamDate(txt)))
  })
})
