// BUSCA NA TELA INICIAL — a pessoa digita a palavra DELA e chega no lugar certo.
//
// PEDIDO DA FUNDADORA (28/08): "que na página inicial tenha a opção de buscar, em que o usuário pode digitar
// qualquer coisa — exame, atividade física, monitoramento, enfim, qualquer palavra — e a plataforma direciona
// pro acesso que ele solicitou."
//
// O QUE ESTES TESTES GUARDAM: que a busca funcione com o vocabulário de quem usa, não com o do produto. Quem
// quer registrar a pressão digita "pressão", não "Monitoramento"; quem procura o remédio digita "remédio". Uma
// busca que só encontra pelo nome da seção obriga a pessoa a já saber o nome — e aí ela não precisaria buscar.
import { describe, it, expect } from 'vitest'
import { searchSections, allSections } from '@sintera/core'

const primeiro = (q: string) => searchSections(q)[0]?.section.id ?? null
const ids = (q: string) => searchSections(q).map(m => m.section.id)

describe('busca por seção', () => {
  it('encontra pelo nome, mesmo digitando só o começo', () => {
    expect(primeiro('monitor')).toBe('monitoramento')
    expect(primeiro('exame')).toBe('exames')
    expect(primeiro('despesa')).toBe('despesas')
  })

  it('encontra pela palavra que a PESSOA usa, não pela do produto', () => {
    expect(primeiro('pressão')).toBe('monitoramento')
    expect(primeiro('glicemia')).toBe('monitoramento')
    expect(primeiro('remédio')).toBe('medicamentos')
    expect(primeiro('menstruação')).toBe('ciclo')
    expect(primeiro('óculos')).toBe('recursos')
    expect(primeiro('gasto')).toBe('despesas')
    expect(primeiro('compartilhar')).toBe('rede')
  })

  it('ignora acento e caixa — quem digita no celular tem pressa', () => {
    expect(primeiro('pressao')).toBe('monitoramento')
    expect(primeiro('PRESSÃO')).toBe('monitoramento')
    expect(primeiro('menstruacao')).toBe('ciclo')
    expect(primeiro('Oculos')).toBe('recursos')
  })

  it('atividade física cai em Monitoramento — é onde ela mora (HIP-014)', () => {
    expect(primeiro('atividade física')).toBe('monitoramento')
    expect(primeiro('corrida')).toBe('monitoramento')
    expect(primeiro('strava')).toBe('monitoramento')
  })

  it('nome exato da seção vem ANTES de quem só a cita no resumo', () => {
    // "Exames" é seção; "Histórico de Exames" e "Pedidos de exame" também casam. A que se chama assim vem antes.
    expect(ids('exames')[0]).toBe('exames')
    expect(ids('agenda')[0]).toBe('agenda')
  })

  it('busca vazia ou curta demais devolve NADA — não é o mesmo que devolver tudo', () => {
    // A tela mostra o menu inteiro quando não há busca. Se a função devolvesse tudo, "não achei" e "não
    // busquei" ficariam indistinguíveis para quem chama.
    expect(searchSections('')).toEqual([])
    expect(searchSections('  ')).toEqual([])
    expect(searchSections('a')).toEqual([])
  })

  it('palavra que não existe em lugar nenhum devolve lista vazia', () => {
    expect(searchSections('xilofone')).toEqual([])
  })

  it('a mesma busca devolve sempre a mesma ordem', () => {
    expect(ids('exame')).toEqual(ids('exame'))
  })

  it('toda seção tem termos de busca — nenhuma depende só do próprio nome', () => {
    for (const s of allSections()) {
      expect(s.keywords.length, `${s.id} sem termos de busca`).toBeGreaterThan(0)
      for (const k of s.keywords) {
        expect(k, `${s.id}: termo com espaço nas bordas`).toBe(k.trim())
        expect(k, `${s.id}: termo em caixa alta`).toBe(k.toLowerCase())
      }
    }
  })

  it('toda seção é alcançável por pelo menos um termo próprio', () => {
    for (const s of allSections()) {
      const achou = searchSections(s.keywords[0]).some(m => m.section.id === s.id)
      expect(achou, `${s.id} não é encontrada pelo próprio termo "${s.keywords[0]}"`).toBe(true)
    }
  })
})
