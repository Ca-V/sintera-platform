// FUNC · CARE-003 §8 etapa 5 — o que a Rede de Cuidado mostra.
//
// BASE ÚNICA: o menu e as seções eram decididos duas vezes, uma na Web e outra no aplicativo, com as mesmas
// linhas digitadas nos dois lugares. Iguais até o dia em que uma mudasse. Este teste guarda a decisão única.
//
// As três regras de tela que importam, e o motivo de cada uma:
//  · só vínculo ATIVO aparece como "acompanhando" — convidado não concede nada, e mostrá-lo junto sugeriria
//    acesso que não existe;
//  · convite vencido aparece como vencido, nunca como pendente — pendência que nunca resolve vira ruído, e
//    ruído faz a pessoa parar de ler os avisos que importam;
//  · encerrados NÃO somem — é o histórico de quem já teve acesso aos dados dela.

import { describe, it, expect } from 'vitest'
import {
  MENU_REDE, secoesDaRedeDeCuidado, redeEstaVazia, descricaoDoProfissional, resumoDoEscopo,
  SCREEN_COPY, type VinculoNaLista, type ConviteNaLista, type StatusVinculo,
} from '@sintera/core'

const AGORA = new Date('2026-09-25T12:00:00Z')
const emDias = (d: number) => new Date(AGORA.getTime() + d * 86400000)

const vinculo = (status: StatusVinculo, id = status): VinculoNaLista => ({
  id, nomeProfissional: 'Ana Souza', profissao: 'nutricionista',
  status, escopo: ['exames', 'medidas'],
})
const convite = (status: ConviteNaLista['status'], dias: number, id = `${status}${dias}`): ConviteNaLista => ({
  id, paraContato: 'ana@exemplo.com', status, criadoEm: emDias(-5), expiraEm: emDias(dias),
})

describe('CARE-003 · o menu é decidido uma vez só', () => {
  it('tem as três linhas, nesta ordem', () => {
    expect(MENU_REDE.map(l => l.destino)).toEqual(['relatorio', 'profissionais', 'compartilhamentos'])
  })

  it('Profissionais está disponível; Compartilhamentos ainda não', () => {
    const por = Object.fromEntries(MENU_REDE.map(l => [l.destino, l.disponivel]))
    expect(por.relatorio).toBe(true)
    expect(por.profissionais).toBe(true)
    expect(por.compartilhamentos, 'depende do Care Space, que é fase posterior').toBe(false)
  })

  it('o indisponível vem com motivo — prometer o que não existe é o que corrói a confiança', () => {
    expect(SCREEN_COPY.rede.soonReason.length).toBeGreaterThan(20)
  })
})

describe('CARE-003 · seções da tela', () => {
  it('sem nada, não há seção nenhuma e a tela está vazia', () => {
    expect(secoesDaRedeDeCuidado([], [], AGORA)).toEqual([])
    expect(redeEstaVazia([], [], AGORA)).toBe(true)
  })

  it('só o ATIVO aparece em "Acompanhando você"', () => {
    const s = secoesDaRedeDeCuidado([vinculo('ativo'), vinculo('convidado')], [], AGORA)
    const acompanhando = s.find(x => x.chave === 'acompanhando')
    expect(acompanhando?.vinculos.map(v => v.status)).toEqual(['ativo'])
  })

  it('convidado não aparece em lugar nenhum — ainda não concede nada', () => {
    const s = secoesDaRedeDeCuidado([vinculo('convidado')], [], AGORA)
    expect(s.flatMap(x => x.vinculos).map(v => v.status)).not.toContain('convidado')
  })

  it('convite dentro do prazo é pendente; vencido cai em encerrados', () => {
    const s = secoesDaRedeDeCuidado([], [convite('enviado', 10, 'vivo'), convite('enviado', -1, 'vencido')], AGORA)
    expect(s.find(x => x.chave === 'convites')?.convites.map(c => c.id)).toEqual(['vivo'])
    expect(s.find(x => x.chave === 'encerrados')?.convites.map(c => c.id)).toEqual(['vencido'])
  })

  it('revogado e encerrado NÃO somem — é o histórico de quem teve acesso', () => {
    const s = secoesDaRedeDeCuidado([vinculo('revogado'), vinculo('encerrado')], [], AGORA)
    const enc = s.find(x => x.chave === 'encerrados')
    expect(enc?.vinculos.map(v => v.status).sort()).toEqual(['encerrado', 'revogado'])
    expect(redeEstaVazia([vinculo('revogado')], [], AGORA), 'histórico não é tela vazia').toBe(false)
  })

  it('seção sem conteúdo não é criada — nada de cabeçalho solto', () => {
    const s = secoesDaRedeDeCuidado([vinculo('ativo')], [], AGORA)
    expect(s.map(x => x.chave)).toEqual(['acompanhando'])
  })

  it('a ordem das seções é estável: ativos, convites, encerrados', () => {
    const s = secoesDaRedeDeCuidado(
      [vinculo('ativo'), vinculo('revogado')],
      [convite('enviado', 5), convite('recusado', 5)],
      AGORA,
    )
    expect(s.map(x => x.chave)).toEqual(['acompanhando', 'convites', 'encerrados'])
  })
})

describe('CARE-003 · como o profissional e o acesso são descritos', () => {
  it('a profissão aparece legível, nunca como identificador cru', () => {
    expect(descricaoDoProfissional({ profissao: 'educador_fisico' })).toBe('Profissional de educação física')
    expect(descricaoDoProfissional({ profissao: 'medico', especialidade: 'Endocrinologia' }))
      .toBe('Médico · Endocrinologia')
  })

  it('especialidade em branco não deixa separador órfão', () => {
    expect(descricaoDoProfissional({ profissao: 'medico', especialidade: '   ' })).toBe('Médico')
  })

  it('o escopo é resumido em número — a lista inteira em cada cartão vira parede de texto', () => {
    expect(resumoDoEscopo([])).toMatch(/nenhuma área/i)
    expect(resumoDoEscopo(['exames'])).toBe('Acesso a 1 área')
    expect(resumoDoEscopo(['exames', 'medidas', 'documentos'])).toBe('Acesso a 3 áreas')
  })
})

describe('CARE-003 · o texto da tela', () => {
  it('o convite avisa que não leva dado de saúde', () => {
    expect(SCREEN_COPY.profissionais.contactHint).toMatch(/não leva nenhum dado de saúde/i)
  })

  it('o estado vazio diz que nada fica visível antes do aceite', () => {
    expect(SCREEN_COPY.profissionais.emptyMessage).toMatch(/depois que você autorizar/i)
    expect(SCREEN_COPY.profissionais.scopeHint).toMatch(/antes do seu aceite/i)
  })

  it('encerrar avisa que é imediato e que o registro fica', () => {
    expect(SCREEN_COPY.profissionais.revokeHint).toMatch(/na hora/i)
    expect(SCREEN_COPY.profissionais.revokeHint).toMatch(/hist[óo]rico/i)
  })

  it('nenhum texto da tela promete interpretação clínica (RDC 657)', () => {
    const textos = [...Object.values(SCREEN_COPY.rede), ...Object.values(SCREEN_COPY.profissionais)]
    for (const t of textos) {
      expect(t, `texto sugere interpretação: ${t}`).not.toMatch(/diagn[óo]stic|interpret|avali(a|ar) sua saúde|recomend/i)
    }
  })
})
