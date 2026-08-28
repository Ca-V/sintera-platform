// FUNC · fatos TRANSCRITOS de um documento (ANEXO-001 · RDC 657).
//
// A regra que estes testes protegem: **preencher errado é pior que não preencher**. Campo em branco a pessoa
// nota e completa; campo preenchido com palpite ela confirma sem ler — e o palpite vira fato no prontuário
// dela. Por isso tudo aqui recusa por padrão.
//
// A plataforma transcreve o que está ESCRITO. Deduzir emissor a partir de papel timbrado ambíguo, ou estimar
// uma data, seria produzir conteúdo — que é justamente o que ela não faz.
import { describe, it, expect } from 'vitest'
import { transcribedDate, transcribedIssuer } from '@sintera/core'

const HOJE = new Date('2026-08-26T12:00:00.000Z')

describe('data do documento', () => {
  it('aceita ISO completo e plausível', () => {
    expect(transcribedDate('2026-08-25', HOJE)).toBe('2026-08-25')
    expect(transcribedDate('1998-03-07', HOJE)).toBe('1998-03-07')
  })

  it('recusa formato que não seja ISO completo — data parcial não é data', () => {
    for (const v of ['25/08/2026', '2026-08', '26-08-2026', '2026/08/25', 'agosto de 2026']) {
      expect(transcribedDate(v, HOJE), `${v} não deveria passar`).toBeUndefined()
    }
  })

  it('O CASO CENTRAL: recusa data INEXISTENTE que o construtor "conserta" sozinho', () => {
    // new Date('2026-02-31') vira 03/03. Aceitar isso gravaria uma data que não estava no papel.
    expect(transcribedDate('2026-02-31', HOJE)).toBeUndefined()
    expect(transcribedDate('2026-13-01', HOJE)).toBeUndefined()
  })

  it('recusa fora de faixa — 1900 ou 2100 é erro de leitura, não fato', () => {
    expect(transcribedDate('1899-01-01', HOJE)).toBeUndefined()
    expect(transcribedDate('2100-01-01', HOJE)).toBeUndefined()
  })

  it('aceita até o ano que vem — documento pode ter data futura (validade, agendamento)', () => {
    expect(transcribedDate('2027-01-15', HOJE)).toBe('2027-01-15')
    expect(transcribedDate('2028-01-15', HOJE)).toBeUndefined()
  })

  it('é DETERMINÍSTICA: o relógio entra por parâmetro, não é lido de dentro', () => {
    const outroDia = new Date('2030-01-01T00:00:00.000Z')
    expect(transcribedDate('2029-05-05', HOJE)).toBeUndefined()
    expect(transcribedDate('2029-05-05', outroDia)).toBe('2029-05-05')
  })

  it('entrada não-texto não quebra', () => {
    for (const v of [null, undefined, 42, {}, []]) expect(transcribedDate(v, HOJE)).toBeUndefined()
  })
})

describe('emissor do documento', () => {
  it('aceita nome legível e normaliza o espaçamento', () => {
    expect(transcribedIssuer('  Dra.   Ana   Souza ')).toBe('Dra. Ana Souza')
    expect(transcribedIssuer('Laboratório Central')).toBe('Laboratório Central')
  })

  it('recusa curto demais — caractere solto é ruído de OCR, não nome', () => {
    expect(transcribedIssuer('A')).toBeUndefined()
    expect(transcribedIssuer('  ')).toBeUndefined()
    expect(transcribedIssuer('')).toBeUndefined()
  })

  it('recusa longo demais — parágrafo capturado por engano não é emissor', () => {
    expect(transcribedIssuer('x'.repeat(121))).toBeUndefined()
    expect(transcribedIssuer('x'.repeat(120))).toBe('x'.repeat(120))
  })

  it('entrada não-texto não quebra', () => {
    for (const v of [null, undefined, 42, {}]) expect(transcribedIssuer(v)).toBeUndefined()
  })
})
