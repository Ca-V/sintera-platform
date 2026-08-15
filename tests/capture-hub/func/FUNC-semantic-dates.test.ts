import { describe, it, expect } from 'vitest'
import { pickExamDate, isExamDateCorroborated } from '@/lib/capture/semantic-dates'

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

// Obs 10 — CORROBORAÇÃO: a data da IA só é FATO se aparecer na fonte. Formato válido ≠ evidência.
describe('Obs 10 · isExamDateCorroborated', () => {
  it('(1) RM do joelho: data corroborada no texto (07/02/2026) → aceita', () => {
    expect(isExamDateCorroborated('2026-02-07', 'Laudo Axial ... realizado em 07/02/2026 ...')).toBe(true)
  })

  it('(2) Urina Pardini: 2016-03-01 NÃO está na fonte (cabeçalho em imagem) → rejeitada', () => {
    const textoSemData = 'CLORETOS RESULTADO 48 mEq/24h POTASSIO 42 SODIO Pedido 5003524-SAVA'
    expect(isExamDateCorroborated('2016-03-01', textoSemData)).toBe(false)
  })

  it('(3) documento sem data identificável → permanece sem data', () => {
    expect(isExamDateCorroborated('2021-03-01', 'texto sem qualquer data')).toBe(false)
  })

  it('(4) data válida presente no texto (BR e ISO, com / . -) continua aceita', () => {
    expect(isExamDateCorroborated('2021-03-01', 'Data de Entrada: 01/03/2021')).toBe(true)
    expect(isExamDateCorroborated('2021-03-01', 'coleta 1/3/2021')).toBe(true)
    expect(isExamDateCorroborated('2021-03-01', 'ref 2021-03-01')).toBe(true)
    expect(isExamDateCorroborated('2009-05-11', 'Coleta: 11/05/09')).toBe(true) // ano 2 dígitos
  })

  it('(5) data INVENTADA pela IA, mesmo em formato perfeitamente válido, não passa', () => {
    // "2016-03-01" é uma data sintaticamente perfeita — mas sem evidência na fonte não é aceita.
    expect(isExamDateCorroborated('2016-03-01', 'Paciente GABRIELA. Resultado do exame de urina.')).toBe(false)
    expect(isExamDateCorroborated(null, 'qualquer')).toBe(false)
    expect(isExamDateCorroborated('2016-03-01', null)).toBe(false)
  })
})

// Granulação de PDF (byte-swap parcial do dígito '2' → U+3200; separador '/' → 'N'). A data CORRETA
// está na fonte, só ilegível para o casamento mecânico. O reparo pontual (normalizeSwappedDigits +
// 'N' como separador de data) recupera a leitura SEM tocar o exam_text. Caso real: urina 8ea769f9,
// "DATA DA COLETA : 01/03/2021" gravado como "01N03N㈀0㈀1". Ver semantic-dates.ts.
describe('Granulação de PDF · recuperação de data (byte-swap parcial + / → N)', () => {
  const D2 = String.fromCharCode(0x3200) // '2' byte-swapped (U+0032 → U+3200 '㈀')
  const garbled2021 = `01N03N${D2}0${D2}1`             // "01/03/2021" granulado
  const garbledNasc = `06N03N${D2}014`                 // "06/03/2014" (nascimento) granulado

  it('pickExamDate: recupera a DATA DA COLETA (01/03/2021) a partir do texto granulado', () => {
    const r = pickExamDate(`GABRIELA ${garbledNasc} (6 anos) [DATA DA COLETA : ${garbled2021} 10:08]`)
    expect(r.iso).toBe('2021-03-01')
    expect(r.kind).toBe('coleta')
    expect(r.confidence).toBe('high')
  })

  it('isExamDateCorroborated: a data da IA (2021-03-01) é corroborada no texto granulado', () => {
    expect(isExamDateCorroborated('2021-03-01', `[DATA DA COLETA : ${garbled2021} 10:08]`)).toBe(true)
  })

  it('não fabrica: a data ERRADA (2016-03-01) NÃO é corroborada nem no texto granulado', () => {
    expect(isExamDateCorroborated('2016-03-01', `[DATA DA COLETA : ${garbled2021} 10:08]`)).toBe(false)
  })

  it('normalização não cria datas onde não há (texto legítimo com "N" isolado)', () => {
    // "N" fora de contexto de data (URINA, NORMAL, Nome) não vira separador nem inventa data.
    expect(pickExamDate('URINA NORMAL Nome do paciente sem qualquer data').iso).toBeNull()
  })
})
