// FUNC · BOD-001 ② — a geometria do gráfico de evolução.
//
// ============================================================================================
// POR QUE ESTE ARQUIVO EXISTE
// ============================================================================================
// Homologação da fundadora, 28/09/2026: "as páginas de composição corporal não estão iguais em web e mobile".
//
// A medição mostrou que as REGRAS já eram compartilhadas — jornada, marcos, comparação. Faltava o desenho: a
// Web desenhava e o aplicativo não. E a resposta certa não era copiar o desenho para o aplicativo: onde cada
// ponto cai e o que aparece no eixo são DECISÕES, e duas implementações da mesma decisão divergem em
// silêncio.
//
// A CATRACA DAQUI: a geometria é determinística e mora num lugar só. O mesmo dado produz o mesmo desenho nas
// duas pontas, porque as duas chamam esta função.

import { describe, it, expect } from 'vitest'
import {
  planoDoGraficoDeEvolucao, planoDaSparkline, dataCurta, numeroDoTexto,
  GRAFICO, GRAFICO_SEM_DADOS, GLIFO_DA_ORIGEM, LEGENDA_DAS_ORIGENS, SOURCE_MARKER, markerFor,
  type EvoPoint,
} from '@sintera/core'

const p = (date: string, value: number, source: string | null = null, key = `${date}-${value}`): EvoPoint =>
  ({ key, date, value, source, examId: null, createdAt: null })

const SERIE: EvoPoint[] = [
  p('2026-01-01', 80, 'balanca'),
  p('2026-02-01', 78, 'bioimpedancia'),
  p('2026-03-01', 76, 'dexa'),
]

describe('BOD-001 ② · a moldura e o vazio', () => {
  it('sem ponto nenhum o plano é VAZIO — e a tela diz isso em vez de mostrar moldura em branco', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: [], unidade: 'kg', selecionado: null })
    expect(plano.vazio).toBe(true)
    expect(plano.pontos).toEqual([])
    expect(plano.caminho).toBeNull()
    expect(GRAFICO_SEM_DADOS).toMatch(/sem dados/i)
  })

  it('ponto com valor ou data inválidos é descartado, não derruba o gráfico', () => {
    const plano = planoDoGraficoDeEvolucao({
      pontos: [p('2026-01-01', 80), p('data-ruim', 70), p('2026-02-01', Number.NaN)],
      unidade: 'kg', selecionado: null,
    })
    expect(plano.vazio).toBe(false)
    expect(plano.pontos).toHaveLength(1)
  })

  it('a moldura é fixa — é o que torna os dois desenhos comparáveis', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.largura).toBe(GRAFICO.largura)
    expect(plano.altura).toBe(GRAFICO.altura)
  })
})

describe('BOD-001 ② · CATRACA — a geometria é determinística', () => {
  it('a mesma entrada produz o mesmo plano, sempre', () => {
    const a = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    const b = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(a).toEqual(b)
  })

  it('nenhum ponto escapa da área útil do desenho', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    for (const c of plano.pontos) {
      expect(c.x, `x de ${c.key}`).toBeGreaterThanOrEqual(plano.eixoX)
      expect(c.x).toBeLessThanOrEqual(plano.bordaDireita)
      expect(c.y, `y de ${c.key}`).toBeGreaterThanOrEqual(plano.topoDoDesenho)
      expect(c.y).toBeLessThanOrEqual(plano.baseDoDesenho)
    }
  })

  it('o maior valor fica ACIMA do menor — o eixo vertical é invertido em SVG, e errar isso espelha o gráfico', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    const maior = plano.pontos[0]  // 80 kg
    const menor = plano.pontos[2]  // 76 kg
    expect(maior.y).toBeLessThan(menor.y)
  })

  it('o tempo anda para a DIREITA', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.pontos[0].x).toBeLessThan(plano.pontos[1].x)
    expect(plano.pontos[1].x).toBeLessThan(plano.pontos[2].x)
  })

  it('série constante NÃO achata a linha contra a borda', () => {
    // Achatada, ela sugeriria que o valor bateu num limite. Abrir um ponto para cada lado mostra o que é.
    const plano = planoDoGraficoDeEvolucao({
      pontos: [p('2026-01-01', 70, null, 'a'), p('2026-02-01', 70, null, 'b')],
      unidade: 'kg', selecionado: null,
    })
    const meio = (plano.topoDoDesenho + plano.baseDoDesenho) / 2
    for (const c of plano.pontos) expect(Math.abs(c.y - meio)).toBeLessThan(1)
  })

  it('um ponto só não ganha linha — ligar um ponto a nada sugeriria série', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: [p('2026-01-01', 80)], unidade: 'kg', selecionado: null })
    expect(plano.caminho).toBeNull()
    expect(plano.dataFinal, 'com um ponto só, não há "até quando"').toBeNull()
  })

  it('o caminho começa em M e tem um L por ponto seguinte', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.caminho).toMatch(/^M /)
    expect((plano.caminho!.match(/L /g) ?? []).length).toBe(SERIE.length - 1)
  })
})

describe('BOD-001 ② · o que o eixo diz', () => {
  it('a grade tem três linhas: máximo, meio e mínimo', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.grade).toHaveLength(3)
    expect(plano.grade[0].rotulo).toBe('80')
    expect(plano.grade[2].rotulo).toBe('76')
  })

  it('a unidade atravessa o plano — sem ela "72" e "23,4" não dizem do que se trata', () => {
    expect(planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg/m²', selecionado: null }).unidade).toBe('kg/m²')
    expect(planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: null, selecionado: null }).unidade).toBeNull()
  })

  it('a data curta é determinística — não depende do idioma do aparelho', () => {
    // `toLocaleDateString` devolveria "Sep 28" num celular e "28 set" noutro; o mesmo gráfico deixaria de ser
    // o mesmo gráfico. DATE-001: determinístico, em UTC.
    expect(dataCurta('2026-09-28')).toBe('28 set')
    expect(dataCurta('2026-01-05')).toBe('05 jan')
    expect(dataCurta('nao-e-data')).toBe('')
  })
})

describe('BOD-001 ② · origem e seleção', () => {
  it('cada origem tem a forma que a Web já usava', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.pontos.map(c => c.forma)).toEqual(['diamond', 'circle', 'triangle'])
  })

  it('origem desconhecida degrada para círculo, não quebra (Modelo Aberto)', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: [p('2026-01-01', 80, 'aparelho_do_futuro')], unidade: 'kg', selecionado: null })
    expect(plano.pontos[0].forma).toBe('circle')
  })

  it('CATRACA — toda forma tem glifo e rótulo na legenda', () => {
    // Quatro marcadores diferentes sem legenda viram enfeite em vez de informação.
    for (const forma of Object.values(SOURCE_MARKER)) {
      expect(GLIFO_DA_ORIGEM[forma], `forma "${forma}" sem glifo`).toBeTruthy()
      expect(LEGENDA_DAS_ORIGENS.some(l => l.forma === forma), `forma "${forma}" fora da legenda`).toBe(true)
    }
    expect(markerFor(null)).toBe('circle')
  })

  it('só o ponto selecionado é marcado como selecionado', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: SERIE[1].key })
    expect(plano.pontos.filter(c => c.selecionado).map(c => c.key)).toEqual([SERIE[1].key])
  })

  it('o ponto de origem viaja no plano — a tela abre o exame sem procurá-lo de novo', () => {
    const plano = planoDoGraficoDeEvolucao({ pontos: SERIE, unidade: 'kg', selecionado: null })
    expect(plano.pontos[0].ponto).toBe(SERIE[0])
  })
})

describe('BOD-001 ⑤ · marcos no gráfico', () => {
  it('marco dentro da janela entra, com a cor recebida', () => {
    const plano = planoDoGraficoDeEvolucao({
      pontos: SERIE, unidade: 'kg', selecionado: null,
      marcos: [{ date: '2026-02-01', color: '#abc' }],
    })
    expect(plano.marcos).toHaveLength(1)
    expect(plano.marcos[0].cor).toBe('#abc')
    expect(plano.marcos[0].x).toBeCloseTo(plano.pontos[1].x, 0)
  })

  it('CATRACA — marco FORA da janela não entra', () => {
    // Uma linha vertical encostada na borda sugeriria um evento naquele dia, e não houve.
    const plano = planoDoGraficoDeEvolucao({
      pontos: SERIE, unidade: 'kg', selecionado: null,
      marcos: [{ date: '2025-01-01', color: '#a' }, { date: '2030-01-01', color: '#b' }, { date: 'ruim', color: '#c' }],
    })
    expect(plano.marcos).toEqual([])
  })
})

describe('BOD-001 · a sparkline', () => {
  it('menos de dois valores não desenha nada', () => {
    expect(planoDaSparkline([])).toBeNull()
    expect(planoDaSparkline([70])).toBeNull()
    expect(planoDaSparkline([70, Number.NaN])).toBeNull()
  })

  it('o último ponto fica na ponta direita', () => {
    const plano = planoDaSparkline([70, 72, 74], 88, 24)!
    expect(plano.ultimoX).toBe(88)
    expect(plano.pontos.split(' ')).toHaveLength(3)
  })

  it('é determinística e cabe na moldura', () => {
    const a = planoDaSparkline([70, 75, 72])!
    const b = planoDaSparkline([70, 75, 72])!
    expect(a).toEqual(b)
    for (const par of a.pontos.split(' ')) {
      const [x, y] = par.split(',').map(Number)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(a.largura)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(a.altura)
    }
  })

  it('valor constante não estoura a divisão por zero', () => {
    const plano = planoDaSparkline([70, 70, 70])
    expect(plano).not.toBeNull()
    for (const par of plano!.pontos.split(' ')) {
      expect(Number.isFinite(Number(par.split(',')[1])), `y de "${par}" não é finito`).toBe(true)
    }
  })
})

describe('numeroDoTexto', () => {
  it.each([
    ['72,5', 72.5], ['72.5 kg', 72.5], ['-3', -3], ['peso: 80', 80],
  ])('"%s" → %s', (texto, esperado) => {
    expect(numeroDoTexto(texto as string)).toBe(esperado)
  })

  it.each([[''], [null], [undefined], ['sem número']])('"%s" → null', (v) => {
    expect(numeroDoTexto(v as string | null | undefined)).toBeNull()
  })
})
