// CATRACA — ATIVIDADE FÍSICA TEM UM ENDEREÇO SÓ, E A DECLARAÇÃO REENCONTRA O FATO.
//
// A decisão (fundadora, 31/08/2026): "Estou de acordo com atividade física ficar só em monitoramento, e ter a
// opção de incluir a atividade física somente em monitoramento também. em que ali ela pode definir meta,
// rotina."
//
// O defeito que a motivou: atividade física existia em Hábitos (a intenção, sem data) e em Monitoramento (o
// fato, com data e calorias). Duas telas, a mesma palavra, e nenhuma ligação — a plataforma tinha as duas
// metades do dossiê e nunca as encostava.
//
// Os números daqui são os DADOS REAIS dela em agosto de 2026.
import { describe, it, expect } from 'vitest'
import {
  confrontarRotinas, sessaoCorrespondeARotina, fraseDaRotina, rotinaLinha, normalizarAtividade,
  JANELA_ROTINA_DIAS, HABIT_CATEGORIES, HABIT_CATEGORIES_ALL, habitCategoryLabel,
  HABIT_CATEGORY_MOVED_TO_MONITORING,
} from '@sintera/core'

const AGORA = new Date('2026-08-31T12:00:00Z')

/** Constrói N sessões de um tipo, uma por dia, terminando no dia anterior a `AGORA`. */
function sessoes(tipo: string, n: number, primeiroDia = 30) {
  return Array.from({ length: n }, (_, i) => ({
    activity_type: tipo,
    started_at: new Date(AGORA.getTime() - (primeiroDia - i) * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

describe('a rotina declarada encontra as sessões observadas', () => {
  it('O CASO DELA: "Musculação, diário" ao lado de 26 sessões', () => {
    const r = confrontarRotinas(
      [{ id: 'h1', descricao: 'Musculação', frequencia: 'Diário' }],
      sessoes('musculacao', 26),
      AGORA,
    )
    expect(r[0].sessoes).toBe(26)
    expect(r[0].frase).toBe('26 sessões registradas nos últimos 30 dias')
    // A frequência sai COMO ELA ESCREVEU — é a declaração dela, não um texto nosso reescrito por cima.
    expect(rotinaLinha(r[0])).toBe('Musculação · declarado: Diário')
  })

  it('O CASO DELA: "Tênis, 1x por semana" — NENHUMA sessão, e a plataforma diz isso', () => {
    // Este é o valor inteiro da tela: a ausência é informação, e some quando as duas metades ficam separadas.
    const r = confrontarRotinas(
      [{ id: 'h3', descricao: 'Tênis', frequencia: '1 x semana' }],
      sessoes('musculacao', 26),
      AGORA,
    )
    expect(r[0].sessoes).toBe(0)
    expect(r[0].frase).toBe('Nenhuma sessão registrada nos últimos 30 dias')
  })

  it('cada rotina conta as SUAS sessões — musculação não vira corrida', () => {
    const r = confrontarRotinas(
      [
        { id: 'h1', descricao: 'Musculação', frequencia: 'Diário' },
        { id: 'h2', descricao: 'Corrida', frequencia: '2 vezes por semana' },
      ],
      [...sessoes('musculacao', 26), ...sessoes('corrida', 4)],
      AGORA,
    )
    expect(r.map(x => x.sessoes)).toEqual([26, 4])
  })
})

describe('a correspondência entre o que ela escreveu e o que o aparelho mandou', () => {
  it('acento e maiúscula não separam: "Musculação" é o tipo "musculacao"', () => {
    expect(sessaoCorrespondeARotina({ activity_type: 'musculacao' }, 'Musculação')).toBe(true)
    expect(normalizarAtividade('Natação')).toBe('natacao')
  })

  it('o RÓTULO do tipo também vale: "Outra atividade" ↔ tipo "outro"', () => {
    expect(sessaoCorrespondeARotina({ activity_type: 'outro' }, 'Outra atividade')).toBe(true)
  })

  it('o título da sessão conta quando o tipo não diz: "Tênis com a Ana"', () => {
    expect(sessaoCorrespondeARotina({ activity_type: 'outro', title: 'Tênis com a Ana' }, 'Tênis')).toBe(true)
  })

  it('NÃO INVENTA CORRESPONDÊNCIA. Contar uma sessão que não houve é pior que não contar', () => {
    expect(sessaoCorrespondeARotina({ activity_type: 'musculacao' }, 'Corrida')).toBe(false)
    expect(sessaoCorrespondeARotina({ activity_type: 'corrida' }, '')).toBe(false)
    expect(sessaoCorrespondeARotina({}, 'Corrida')).toBe(false)
  })
})

describe('a janela', () => {
  it('o que é mais antigo que a janela não entra na conta', () => {
    const antiga = [{ activity_type: 'corrida', started_at: '2026-06-01T10:00:00Z' }]
    const r = confrontarRotinas([{ id: 'h', descricao: 'Corrida', frequencia: null }], antiga, AGORA)
    expect(r[0].sessoes).toBe(0)
  })

  it('instante ilegível é IGNORADO, nunca contado como hoje', () => {
    const ruins = [
      { activity_type: 'corrida', started_at: 'não é data' },
      { activity_type: 'corrida', started_at: null },
      { activity_type: 'corrida' },
    ]
    const r = confrontarRotinas([{ id: 'h', descricao: 'Corrida', frequencia: null }], ruins, AGORA)
    expect(r[0].sessoes).toBe(0)
  })

  it('a janela é a MESMA nas duas plataformas — vem daqui, não da tela', () => {
    expect(JANELA_ROTINA_DIAS).toBe(30)
  })
})

describe('A PLATAFORMA NÃO INTERPRETA (ADR-000 / RDC 657)', () => {
  it('a frase conta sessões e não avalia ninguém', () => {
    // "2x por semana" é texto livre. Transformar frequência declarada em nota de desempenho seria interpretar.
    const proibido = /meta atingida|cumpr|abaixo|acima do esperado|parabéns|precisa|deveria|ruim|bom desempenho/i
    for (const n of [0, 1, 7, 26]) expect(fraseDaRotina(n, 30)).not.toMatch(proibido)
    expect(fraseDaRotina(1, 30)).toBe('1 sessão registrada nos últimos 30 dias')
  })

  it('sem frequência declarada, a linha não inventa uma', () => {
    expect(rotinaLinha({ descricao: 'Corrida', frequencia: null })).toBe('Corrida')
    expect(rotinaLinha({ descricao: 'Corrida', frequencia: '   ' })).toBe('Corrida')
  })
})

describe('atividade física saiu do seletor de Hábitos — sem apagar o passado', () => {
  it('NÃO é mais oferecida em Hábitos', () => {
    expect(HABIT_CATEGORIES.map(c => c.value)).not.toContain('atividade_fisica')
    expect(HABIT_CATEGORIES).toHaveLength(6)
  })

  it('mas o RÓTULO continua existindo: registro já guardado não pode virar "Outro"', () => {
    // Apagar a categoria faria os três registros dela aparecerem como "Outro" no dossiê. Perda silenciosa.
    expect(habitCategoryLabel('atividade_fisica')).toBe('Atividade física')
    expect(HABIT_CATEGORIES_ALL.map(c => c.value)).toContain('atividade_fisica')
  })

  it('a categoria que mudou de endereço é NOMEADA — as telas apontam o caminho novo a partir daqui', () => {
    expect(HABIT_CATEGORY_MOVED_TO_MONITORING).toBe('atividade_fisica')
    expect(HABIT_CATEGORIES.some(c => c.value === HABIT_CATEGORY_MOVED_TO_MONITORING)).toBe(false)
  })
})
