// BUSCA NOS REGISTROS — "vitamina D" tem que achar o suplemento E o indicador do exame.
//
// PEDIDO DA FUNDADORA (28/08), depois de testar a primeira versão da busca: "qualquer palavra que estiver dentro
// da plataforma precisa ser encontrada. Quando eu digito 'vitamina D', devem aparecer todos os lugares que têm
// vitamina D — pode ser suplemento, pode ser resultado de exame — para eu escolher em qual quero entrar."
//
// A primeira versão buscava só as SEÇÕES, e devolvia "nada encontrado" para um dado que existe. "Nada
// encontrado" sobre algo que está lá é pior do que não ter busca: ensina a não confiar nela.
import { describe, it, expect } from 'vitest'
import { rankHits, groupHits, hitKindLabel, shouldQuery, SEARCH_MIN_CHARS, type SearchHit } from '@sintera/core'

const hit = (kind: SearchHit['kind'], title: string, id = title): SearchHit => ({
  kind, id, title, subtitle: null,
  section: kind === 'suplemento' ? 'suplementos' : kind === 'indicador' ? 'historico-exames' : 'exames',
})

describe('ordenação dos achados', () => {
  it('o caso da fundadora: "vitamina D" devolve o suplemento E o indicador, os dois', () => {
    const achados = [hit('indicador', 'Vitamina D (25-OH)'), hit('suplemento', 'Vitamina D3')]
    const r = rankHits(achados, 'vitamina d')
    expect(r).toHaveLength(2)
    expect(r.map(h => h.kind)).toContain('suplemento')
    expect(r.map(h => h.kind)).toContain('indicador')
  })

  it('o que a pessoa TOMA vem antes do que ela recebeu', () => {
    // Digitar "vitamina D" é quase sempre procurar o suplemento; o indicador do laudo é a segunda pergunta.
    const r = rankHits([hit('indicador', 'Vitamina D'), hit('suplemento', 'Vitamina D')], 'vitamina')
    expect(r[0].kind).toBe('suplemento')
  })

  it('acerto no COMEÇO do nome vence o peso da natureza', () => {
    // "Vitamina D" começa com o termo; "Complexo com vitamina D" só o contém. O direto vem antes, mesmo sendo
    // de uma natureza de peso maior — senão a busca ordenaria por categoria em vez de por relevância.
    const r = rankHits([hit('suplemento', 'Complexo com vitamina D'), hit('indicador', 'Vitamina D')], 'vitamina')
    expect(r[0].title).toBe('Vitamina D')
  })

  it('ignora acento e caixa', () => {
    expect(rankHits([hit('condicao', 'Hipertensão')], 'hipertensao')).toHaveLength(1)
    expect(rankHits([hit('condicao', 'Hipertensão')], 'HIPERTENSÃO')).toHaveLength(1)
  })

  it('limita a lista — cinquenta achados não ajudam a escolher num celular', () => {
    const muitos = Array.from({ length: 60 }, (_, i) => hit('exame', `Exame ${i}`, String(i)))
    expect(rankHits(muitos, 'exame')).toHaveLength(20)
    expect(rankHits(muitos, 'exame', 5)).toHaveLength(5)
  })

  it('a mesma busca devolve sempre a mesma ordem', () => {
    const achados = [hit('exame', 'Sangue', 'a'), hit('exame', 'Sangue', 'b'), hit('exame', 'Sangue', 'c')]
    expect(rankHits(achados, 'sangue').map(h => h.id)).toEqual(rankHits(achados, 'sangue').map(h => h.id))
  })

  it('busca vazia devolve nada, e não tudo', () => {
    expect(rankHits([hit('exame', 'Sangue')], '')).toEqual([])
    expect(rankHits([hit('exame', 'Sangue')], '   ')).toEqual([])
  })
})

describe('agrupamento por natureza', () => {
  it('separa o suplemento do indicador — é o que permite escolher em qual entrar', () => {
    const r = groupHits(rankHits([hit('indicador', 'Vitamina D'), hit('suplemento', 'Vitamina D3')], 'vitamina'))
    expect(r.map(g => g.kind)).toEqual(['suplemento', 'indicador'])
    expect(r[0].label).toBe('Suplemento')
    expect(r[1].label).toBe('Indicador de exame')
  })

  it('preserva a ordem já decidida — agrupar não reordena', () => {
    const ordenados = rankHits(
      [hit('exame', 'Vitamina'), hit('suplemento', 'Vitamina'), hit('indicador', 'Vitamina')],
      'vitamina',
    )
    const grupos = groupHits(ordenados)
    expect(grupos.flatMap(g => g.hits).map(h => h.kind)).toEqual(ordenados.map(h => h.kind))
  })

  it('dois achados da mesma natureza ficam no mesmo grupo', () => {
    const r = groupHits(rankHits([hit('suplemento', 'Vitamina D', '1'), hit('suplemento', 'Vitamina C', '2')], 'vitamina'))
    expect(r).toHaveLength(1)
    expect(r[0].hits).toHaveLength(2)
  })

  it('toda natureza tem rótulo — a pessoa precisa saber por que aquele achado apareceu', () => {
    const naturezas: SearchHit['kind'][] = [
      'medicamento', 'suplemento', 'recurso', 'indicador', 'exame',
      'documento', 'condicao', 'habito', 'evento', 'atividade', 'sinal',
    ]
    for (const k of naturezas) {
      expect(hitKindLabel(k), `${k} sem rótulo`).not.toBe('Registro')
      expect(hitKindLabel(k).trim()).not.toBe('')
    }
  })
})

describe('quando vale ir ao banco', () => {
  it('uma letra não vale — casaria com quase tudo', () => {
    expect(shouldQuery('v')).toBe(false)
    expect(shouldQuery('')).toBe(false)
    expect(shouldQuery('  ')).toBe(false)
  })

  it('a partir do mínimo, vale', () => {
    expect(SEARCH_MIN_CHARS).toBe(2)
    expect(shouldQuery('vi')).toBe(true)
    expect(shouldQuery('vitamina d')).toBe(true)
  })

  it('espaço nas bordas não conta como caractere', () => {
    expect(shouldQuery(' v ')).toBe(false)
    expect(shouldQuery(' vi ')).toBe(true)
  })
})
