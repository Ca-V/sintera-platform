// FUNC · CARE-003 — o que a pessoa já compartilhou, e como ela desfaz.
//
// A CATRACA CENTRAL DAQUI: **nenhum rótulo diz que um link abre quando ele não abre**, e nenhum botão promete
// um efeito que não existe. É a mesma regra da tela de convites, pela mesma razão — um rótulo que mente sobre
// acesso a dado de saúde é pior do que não ter rótulo nenhum.
//
// A segunda: **a lista nunca mostra identificador interno**. Ela existe para a pessoa saber o que expôs, e
// `histexames` não responde isso.

import { describe, it, expect } from 'vitest'
import {
  estadoDoCompartilhamento, podeRevogar, estaAberto, rotuloDoCompartilhamento, resumoDoConteudo,
  secoesSemNome, urlDoCompartilhamento, secoesDeCompartilhamentos, compartilhamentosVazio,
  REPORT_GROUPS,
  type CompartilhamentoNaLista, type EstadoDoCompartilhamento,
} from '@sintera/core'

const AGORA = new Date('2026-09-27T12:00:00Z')
const dia = (n: number) => new Date(AGORA.getTime() + n * 24 * 60 * 60 * 1000)
const fmt = (d: Date) => d.toISOString().slice(0, 10)

const link = (p: Partial<CompartilhamentoNaLista> = {}): CompartilhamentoNaLista => ({
  id: 'a', token: 'tok', criadoEm: dia(-5), expiraEm: dia(25), revogado: false, secoes: [], ...p,
})

const ESTADOS: EstadoDoCompartilhamento[] = ['ativo', 'expirado', 'revogado']

describe('CARE-003 · o estado de um link', () => {
  it('link no prazo e não revogado está ativo', () => {
    expect(estadoDoCompartilhamento(link(), AGORA)).toBe('ativo')
  })

  it('link vencido está expirado', () => {
    expect(estadoDoCompartilhamento(link({ expiraEm: dia(-1) }), AGORA)).toBe('expirado')
  })

  it('REVOGADO vence EXPIRADO — ela precisa ver o próprio ato, não o relógio', () => {
    // Inverter isso apagaria da tela a decisão que ela tomou, substituindo-a por uma consequência do tempo.
    expect(estadoDoCompartilhamento(link({ revogado: true, expiraEm: dia(-30) }), AGORA)).toBe('revogado')
  })

  it('o instante exato do vencimento já está fora — o prazo é fechado no fim', () => {
    expect(estadoDoCompartilhamento(link({ expiraEm: AGORA }), AGORA)).toBe('expirado')
  })

  it('só link ativo abre, e só link ativo pode ser encerrado', () => {
    for (const e of ESTADOS) {
      const esperado = e === 'ativo'
      expect(estaAberto(e), `estaAberto(${e})`).toBe(esperado)
      expect(podeRevogar(e), `podeRevogar(${e})`).toBe(esperado)
    }
  })
})

describe('CARE-003 · CATRACA — nenhum rótulo afirma que um link morto abre', () => {
  it('só o link ativo é descrito como aberto', () => {
    expect(rotuloDoCompartilhamento(link(), AGORA, fmt)).toMatch(/aberto até/i)
  })

  it.each([
    ['expirado', link({ expiraEm: dia(-1) })],
    ['revogado', link({ revogado: true })],
  ])('o link %s diz explicitamente que NÃO abre mais', (_nome, c) => {
    const r = rotuloDoCompartilhamento(c, AGORA, fmt)
    expect(r).toMatch(/não abre mais/i)
    expect(r, `"${r}" sugere que o link ainda funciona`).not.toMatch(/aberto até/i)
  })

  it('o rótulo do link ativo traz o prazo — é o que muda a decisão dela', () => {
    expect(rotuloDoCompartilhamento(link({ expiraEm: dia(25) }), AGORA, fmt)).toContain(fmt(dia(25)))
  })

  it('o link revogado atribui o encerramento a ELA, e não a um processo anônimo', () => {
    expect(rotuloDoCompartilhamento(link({ revogado: true }), AGORA, fmt)).toMatch(/você encerrou/i)
  })
})

describe('CARE-003 · CATRACA — a lista nunca mostra identificador interno', () => {
  it('nenhuma seção do Relatório está sem rótulo legível', () => {
    // Se uma seção nova entrar no Relatório sem nome, esta catraca acusa antes de a chave crua chegar à tela.
    expect(secoesSemNome()).toEqual([])
  })

  it('as chaves viram nomes que a pessoa reconhece', () => {
    expect(resumoDoConteudo(['exames'])).toBe('Exames')
    expect(resumoDoConteudo(['histexames'])).toBe('Histórico de Exames')
  })

  it('chave desconhecida é OMITIDA, nunca exibida crua', () => {
    // Link antigo com seção que saiu do produto. Mostrar `secao_que_nao_existe` não responderia nada.
    const r = resumoDoConteudo(['exames', 'secao_que_nao_existe'])
    expect(r).toBe('Exames')
    expect(r).not.toContain('secao_que_nao_existe')
  })

  it('sem seção nenhuma, o link mostra o relatório inteiro — e o texto diz isso', () => {
    expect(resumoDoConteudo([])).toBe('Relatório inteiro')
    expect(resumoDoConteudo(['so_chaves_invalidas'])).toBe('Relatório inteiro')
  })

  it('lista longa é resumida, sem esconder quantas ficaram de fora', () => {
    const todas = REPORT_GROUPS.flatMap(g => g.items.map(i => i.key))
    const r = resumoDoConteudo(todas, 3)
    expect(r).toMatch(/e mais \d+$/)
    expect(r).toContain(`e mais ${todas.length - 3}`)
  })

  it('nenhum resumo devolve uma chave crua do relatório', () => {
    const todas = REPORT_GROUPS.flatMap(g => g.items.map(i => i.key))
    for (const k of todas) {
      const r = resumoDoConteudo([k])
      expect(r, `a chave "${k}" vazou para a tela`).not.toBe(k)
    }
  })
})

describe('CARE-003 · o endereço público', () => {
  it('monta a rota /r/<token>', () => {
    expect(urlDoCompartilhamento('abc', 'https://sinteramais.com.br')).toBe('https://sinteramais.com.br/r/abc')
  })

  it('barra sobrando na origem não vira barra dupla', () => {
    expect(urlDoCompartilhamento('abc', 'https://sinteramais.com.br/')).toBe('https://sinteramais.com.br/r/abc')
    expect(urlDoCompartilhamento('abc', 'https://sinteramais.com.br///')).toBe('https://sinteramais.com.br/r/abc')
  })
})

describe('CARE-003 · como a tela se organiza', () => {
  it('links abertos vêm primeiro — é o que ainda expõe dado e o que ela pode desfazer', () => {
    const s = secoesDeCompartilhamentos([link({ id: 'v', expiraEm: dia(-1) }), link({ id: 'a' })], AGORA)
    expect(s.map(x => x.chave)).toEqual(['abertos', 'encerrados'])
  })

  it('vencidos e revogados ficam juntos em Encerrados, e NÃO somem', () => {
    const s = secoesDeCompartilhamentos([
      link({ id: 'v', expiraEm: dia(-1) }),
      link({ id: 'r', revogado: true }),
    ], AGORA)
    expect(s).toHaveLength(1)
    expect(s[0].chave).toBe('encerrados')
    expect(s[0].itens.map(i => i.id).sort()).toEqual(['r', 'v'])
  })

  it('seção vazia não aparece — título sem conteúdo é ruído', () => {
    expect(secoesDeCompartilhamentos([link()], AGORA).map(s => s.chave)).toEqual(['abertos'])
    expect(secoesDeCompartilhamentos([], AGORA)).toEqual([])
  })

  it('nenhum item se perde entre as seções', () => {
    const itens = [link({ id: '1' }), link({ id: '2', expiraEm: dia(-1) }), link({ id: '3', revogado: true })]
    const total = secoesDeCompartilhamentos(itens, AGORA).flatMap(s => s.itens)
    expect(total.map(i => i.id).sort()).toEqual(['1', '2', '3'])
  })

  it('vazio é vazio — e não "só encerrados"', () => {
    expect(compartilhamentosVazio([])).toBe(true)
    expect(compartilhamentosVazio([link({ revogado: true })]), 'histórico ainda é conteúdo').toBe(false)
  })
})
