// Telefone com código de país — invariantes do domínio (SSOT Web↔Mobile).
// Regressão central: o DDI NUNCA é adivinhado. A regra antiga ("se não começa com
// 55, prefixa 55") quebrava usuárias fora do Brasil e números do DDD 55.
import { describe, it, expect } from 'vitest'
import {
  DIAL_COUNTRIES, DEFAULT_DIAL_ISO, dialCountryByIso,
  splitPhone, joinPhone, toDialDigits,
} from '@sintera/core'

describe('ANEXO/PERFIL · catálogo de países', () => {
  it('tem Brasil como padrão e primeiro da lista', () => {
    expect(DEFAULT_DIAL_ISO).toBe('BR')
    expect(DIAL_COUNTRIES[0].iso).toBe('BR')
    expect(DIAL_COUNTRIES[0].dial).toBe('55')
  })

  it('não tem ISO repetido', () => {
    const isos = DIAL_COUNTRIES.map(c => c.iso)
    expect(new Set(isos).size).toBe(isos.length)
  })

  it('todo DDI é só dígitos', () => {
    for (const c of DIAL_COUNTRIES) expect(c.dial).toMatch(/^\d+$/)
  })

  it('busca por ISO é insensível a caixa e devolve undefined para desconhecido', () => {
    expect(dialCountryByIso('br')?.dial).toBe('55')
    expect(dialCountryByIso('XX')).toBeUndefined()
  })
})

describe('PERFIL · separar o telefone gravado', () => {
  it('E.164 devolve o país do próprio valor', () => {
    expect(splitPhone('+5511999999999')).toEqual({ iso: 'BR', national: '11999999999' })
    expect(splitPhone('+351912345678')).toEqual({ iso: 'PT', national: '912345678' })
  })

  it('DDI longo não é confundido com o curto (351 ≠ 35)', () => {
    // Portugal (351) tem de vencer qualquer prefixo mais curto da lista.
    expect(splitPhone('+351912345678').iso).toBe('PT')
  })

  it('valor legado (sem "+") é lido como Brasil — que é o que sempre foi', () => {
    expect(splitPhone('11999999999')).toEqual({ iso: 'BR', national: '11999999999' })
    expect(splitPhone('(11) 99999-9999')).toEqual({ iso: 'BR', national: '11999999999' })
  })

  it('REGRESSÃO — formato antigo COM ESPAÇO da tela de Configurações', () => {
    // Configurações gravava `${ddi} ${numero}` — "+55 11999999999". Perfil grava
    // E.164 sem espaço. Como as duas telas escrevem o MESMO campo, `splitPhone`
    // tem de entender os dois; do contrário salvar numa corrompe o que a outra lê.
    expect(splitPhone('+55 11999999999')).toEqual({ iso: 'BR', national: '11999999999' })
    expect(splitPhone('+351 912345678')).toEqual({ iso: 'PT', national: '912345678' })
  })

  it('REGRESSÃO — DDI não é truncado por leitura gulosa', () => {
    // A regex antiga, `^(\+\d{1,3})\s*(.*)$`, lia "+5511999999999" como DDI
    // "+551" e número "1999999999" — e regravava o número corrompido.
    const s = splitPhone('+5511999999999')
    expect(s.iso).toBe('BR')
    expect(s.national).toBe('11999999999')
    expect(joinPhone(s.iso, s.national)).toBe('+5511999999999')  // ida e volta estável
  })

  it('vazio abre o formulário no país padrão', () => {
    expect(splitPhone(null)).toEqual({ iso: 'BR', national: '' })
    expect(splitPhone('')).toEqual({ iso: 'BR', national: '' })
  })
})

describe('PERFIL · montar o telefone para gravar', () => {
  it('monta E.164 com o DDI do país escolhido', () => {
    expect(joinPhone('BR', '11999999999')).toBe('+5511999999999')
    expect(joinPhone('PT', '912345678')).toBe('+351912345678')
  })

  it('descarta máscara e mantém só dígitos', () => {
    expect(joinPhone('BR', '(11) 99999-9999')).toBe('+5511999999999')
  })

  it('número vazio limpa o campo (opcional)', () => {
    expect(joinPhone('BR', '')).toBeNull()
    expect(joinPhone('BR', null)).toBeNull()
  })

  it('país desconhecido cai no padrão em vez de gravar lixo', () => {
    expect(joinPhone('XX', '11999999999')).toBe('+5511999999999')
  })

  it('ida e volta preserva o par país+número', () => {
    for (const iso of ['BR', 'PT', 'US', 'AO']) {
      const stored = joinPhone(iso, '912345678')!
      const back = splitPhone(stored)
      expect(back.national).toBe('912345678')
      expect(dialCountryByIso(back.iso)!.dial).toBe(dialCountryByIso(iso)!.dial)
    }
  })
})

describe('WHATSAPP · destinatário sem adivinhação de país', () => {
  it('REGRESSÃO — número do DDD 55 não perde o DDD', () => {
    // Santa Maria/RS: 55 99999-9999. A regra antiga via "começa com 55", não
    // prefixava nada, e enviava "5599999999" — Brasil + número SEM DDD.
    // Com o país explícito, o DDD 55 é preservado.
    expect(toDialDigits('+5555999999999')).toBe('5555999999999')
  })

  it('REGRESSÃO — número estrangeiro não recebe DDI brasileiro', () => {
    // A regra antiga transformaria um número português em brasileiro.
    expect(toDialDigits('+351912345678')).toBe('351912345678')
    expect(toDialDigits('+351912345678')).not.toMatch(/^55/)
  })

  it('valor legado continua sendo tratado como Brasil', () => {
    expect(toDialDigits('11999999999')).toBe('5511999999999')
  })

  it('curto demais é recusado em vez de virar destinatário inválido', () => {
    expect(toDialDigits('999')).toBeNull()
    expect(toDialDigits('+55999')).toBeNull()
    expect(toDialDigits(null)).toBeNull()
    expect(toDialDigits('')).toBeNull()
  })
})
