// @sintera/core — BOD-001 área ②: a GEOMETRIA do gráfico de evolução.
//
// ============================================================================================
// POR QUE ISTO SAIU DA WEB
// ============================================================================================
// Homologação da fundadora, 28/09/2026: "as páginas de composição corporal não estão iguais em web e mobile".
//
// A medição mostrou que a divergência NÃO era de regra — `computeWeightJourney`, `buildSnapshots`,
// `compareSnapshots` e `buildMilestones` já moravam aqui e as duas pontas usavam as mesmas. A divergência era
// de apresentação: a Web desenhava o gráfico e o aplicativo não desenhava nada.
//
// Mas a resposta certa não é "copiar o desenho para o aplicativo". Onde cada ponto cai, quais linhas de grade
// existem, que forma marca cada origem e quais datas aparecem nas pontas são DECISÕES — e duas implementações
// da mesma decisão divergem em silêncio, que é exatamente o que o princípio de BASE ÚNICA existe para impedir.
//
// Então a geometria vem para cá, calculada uma vez. O MECANISMO diverge e é legítimo: a Web desenha com SVG
// do DOM, o aplicativo com `react-native-svg`. Os dois recebem os mesmos números.
//
// ============================================================================================
// O QUE ESTE MÓDULO NÃO FAZ
// ============================================================================================
// Não interpreta. Não classifica valor como bom ou ruim, não traça tendência, não projeta. Ele posiciona no
// tempo o que a pessoa registrou (RDC 657). Cor, espessura e fonte são do tema de cada ponta — aqui só há
// posição, forma e texto.

import { markerFor, type EvoPoint, type MarkerShape } from './evolution'

// ------------------------------------------------------------------------------------------------------
// A moldura
// ------------------------------------------------------------------------------------------------------

/**
 * O sistema de coordenadas é FIXO e as duas pontas escalam a moldura inteira para o espaço que têm. É o que
 * torna os dois desenhos comparáveis: o mesmo dado produz o mesmo desenho, só que maior ou menor.
 *
 * Os números vieram da Web, que já estava em produção — mudá-los agora alteraria um gráfico que a pessoa já
 * conhece, sem nenhum ganho.
 */
export const GRAFICO = {
  largura: 700,
  altura: 220,
  padEsq: 40,
  padDir: 14,
  padTopo: 16,
  padBase: 26,
} as const

const INTERNA_L = GRAFICO.largura - GRAFICO.padEsq - GRAFICO.padDir
const INTERNA_A = GRAFICO.altura - GRAFICO.padTopo - GRAFICO.padBase

// ------------------------------------------------------------------------------------------------------
// O plano
// ------------------------------------------------------------------------------------------------------

export interface PontoDoGrafico {
  readonly key: string
  readonly x: number
  readonly y: number
  readonly forma: MarkerShape
  readonly selecionado: boolean
  /** O ponto de origem, para a tela abrir o exame sem precisar procurá-lo de novo. */
  readonly ponto: EvoPoint
}

export interface LinhaDeGrade {
  readonly y: number
  readonly rotulo: string
}

export interface MarcoNoGrafico {
  readonly x: number
  readonly cor: string
}

export interface PlanoDoGrafico {
  readonly largura: number
  readonly altura: number
  /** Sem ponto nenhum não há o que desenhar — e a tela diz isso em vez de mostrar uma moldura vazia. */
  readonly vazio: boolean
  /** `null` com menos de dois pontos: uma linha ligando um ponto a nada sugeriria uma série que não existe. */
  readonly caminho: string | null
  readonly pontos: readonly PontoDoGrafico[]
  readonly grade: readonly LinhaDeGrade[]
  readonly marcos: readonly MarcoNoGrafico[]
  /** A unidade, uma vez, no topo do eixo. Repetir em cada marca polui e não acrescenta. */
  readonly unidade: string | null
  readonly dataInicial: string | null
  readonly dataFinal: string | null
  /** Onde a unidade e os rótulos do eixo ficam. Poupa as duas pontas de recalcular a mesma margem. */
  readonly eixoX: number
  readonly topoDoDesenho: number
  readonly baseDoDesenho: number
  readonly bordaDireita: number
}

export interface EntradaDoGrafico {
  /** Já ordenados por data (asc) — a ordenação é de quem consulta, não deste módulo. */
  readonly pontos: readonly EvoPoint[]
  readonly unidade: string | null
  readonly selecionado: string | null
  readonly marcos?: readonly { date: string; color: string }[]
}

const PLANO_VAZIO: PlanoDoGrafico = {
  largura: GRAFICO.largura,
  altura: GRAFICO.altura,
  vazio: true,
  caminho: null,
  pontos: [],
  grade: [],
  marcos: [],
  unidade: null,
  dataInicial: null,
  dataFinal: null,
  eixoX: GRAFICO.padEsq,
  topoDoDesenho: GRAFICO.padTopo,
  baseDoDesenho: GRAFICO.altura - GRAFICO.padBase,
  bordaDireita: GRAFICO.largura - GRAFICO.padDir,
}

/** Milissegundos de uma data ISO, em UTC. `NaN` quando não é data — quem chama filtra. */
function instante(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime()
}

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * "28 set" — a data curta das pontas do eixo.
 *
 * Montada à mão, e não com `toLocaleDateString`: o resultado do `Intl` varia com o locale do aparelho, e um
 * gráfico que escreve "Sep 28" num celular e "28 set" noutro não é o mesmo gráfico. Determinístico em UTC,
 * como manda o DATE-001.
 */
export function dataCurta(iso: string): string {
  const t = instante(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MES[d.getUTCMonth()]}`
}

/**
 * Onde cada coisa fica.
 *
 * Toda a aritmética do gráfico mora aqui: escalas, caminho, grade, marcos e rótulos. As duas pontas só
 * traduzem isto em elementos de desenho.
 */
export function planoDoGraficoDeEvolucao(entrada: EntradaDoGrafico): PlanoDoGrafico {
  const pontos = entrada.pontos.filter(p => Number.isFinite(p.value) && Number.isFinite(instante(p.date)))
  if (pontos.length === 0) return { ...PLANO_VAZIO, unidade: entrada.unidade ?? null }

  const valores = pontos.map(p => p.value)
  let vmin = Math.min(...valores)
  let vmax = Math.max(...valores)
  // Série constante achataria a linha contra a borda e sugeriria que o valor bateu num limite. Abrir um ponto
  // para cada lado mostra o que é: uma reta no meio.
  if (vmin === vmax) { vmin -= 1; vmax += 1 }

  const tempos = pontos.map(p => instante(p.date))
  const tmin = Math.min(...tempos)
  const tmax = Math.max(...tempos)

  const xDe = (t: number) =>
    tmax === tmin ? GRAFICO.padEsq + INTERNA_L / 2 : GRAFICO.padEsq + INTERNA_L * ((t - tmin) / (tmax - tmin))
  const yDe = (v: number) => GRAFICO.padTopo + INTERNA_A * (1 - (v - vmin) / (vmax - vmin))

  const coords: PontoDoGrafico[] = pontos.map((p, i) => ({
    key: p.key,
    x: Number(xDe(tempos[i]).toFixed(1)),
    y: Number(yDe(p.value).toFixed(1)),
    forma: markerFor(p.source),
    selecionado: p.key === entrada.selecionado,
    ponto: p,
  }))

  const caminho = coords.length > 1
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
    : null

  const grade: LinhaDeGrade[] = [vmax, (vmin + vmax) / 2, vmin].map(v => ({
    y: Number(yDe(v).toFixed(1)),
    rotulo: String(Number(v.toFixed(1))),
  }))

  // Marco fora da janela não entra: uma linha vertical na borda sugeriria um evento naquele dia.
  const marcos: MarcoNoGrafico[] = tmax === tmin ? [] : (entrada.marcos ?? [])
    .map(m => ({ t: instante(m.date), cor: m.color }))
    .filter(m => Number.isFinite(m.t) && m.t >= tmin && m.t <= tmax)
    .map(m => ({ x: Number(xDe(m.t).toFixed(1)), cor: m.cor }))

  return {
    largura: GRAFICO.largura,
    altura: GRAFICO.altura,
    vazio: false,
    caminho,
    pontos: coords,
    grade,
    marcos,
    unidade: entrada.unidade ?? null,
    dataInicial: dataCurta(pontos[0].date),
    dataFinal: pontos.length > 1 ? dataCurta(pontos[pontos.length - 1].date) : null,
    eixoX: GRAFICO.padEsq,
    topoDoDesenho: GRAFICO.padTopo,
    baseDoDesenho: GRAFICO.altura - GRAFICO.padBase,
    bordaDireita: GRAFICO.largura - GRAFICO.padDir,
  }
}

/** O que a tela diz quando o período escolhido não tem nada. Mora aqui porque é texto, e texto é decisão. */
export const GRAFICO_SEM_DADOS = 'Sem dados para o período selecionado.'

/**
 * O glifo de cada forma, para a legenda em texto.
 *
 * Estava digitado dentro da página da Web (`EVO_GLYPH`) e não existia no aplicativo — então a Web explicava
 * os marcadores e o aplicativo não teria como explicar os mesmos. Legenda é decisão: se as duas pontas
 * escolherem símbolos diferentes, o mesmo gráfico passa a significar coisas diferentes.
 */
export const GLIFO_DA_ORIGEM: Readonly<Record<MarkerShape, string>> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
}

/** A legenda de formas. Sem ela, quatro marcadores diferentes viram enfeite em vez de informação. */
export const LEGENDA_DAS_ORIGENS: readonly { forma: MarkerShape; label: string }[] = [
  { forma: 'circle', label: 'Bioimpedância' },
  { forma: 'square', label: 'Manual' },
  { forma: 'triangle', label: 'DEXA' },
  { forma: 'diamond', label: 'Balança' },
]

// ------------------------------------------------------------------------------------------------------
// A sparkline
// ------------------------------------------------------------------------------------------------------

export interface PlanoDaSparkline {
  readonly largura: number
  readonly altura: number
  /** Pontos do polígono, no formato "x,y x,y". */
  readonly pontos: string
  readonly ultimoX: number
  readonly ultimoY: number
}

/**
 * A miniatura ao lado de cada indicador.
 *
 * `null` com menos de dois valores — e isso é decisão, não detalhe: um ponto só não tem evolução, e desenhar
 * uma bolinha sozinha sugere série onde há um registro.
 */
export function planoDaSparkline(valores: readonly number[], largura = 88, altura = 24): PlanoDaSparkline | null {
  const v = valores.filter(n => Number.isFinite(n))
  if (v.length < 2) return null

  const min = Math.min(...v)
  const max = Math.max(...v)
  const faixa = max - min || 1
  const passo = largura / (v.length - 1)
  const pad = 2
  const h = altura - pad * 2

  const yDe = (n: number) => Number((pad + h - ((n - min) / faixa) * h).toFixed(1))
  const pontos = v.map((n, i) => `${Number((i * passo).toFixed(1))},${yDe(n)}`).join(' ')

  return {
    largura,
    altura,
    pontos,
    ultimoX: Number(((v.length - 1) * passo).toFixed(1)),
    ultimoY: yDe(v[v.length - 1]),
  }
}

/** O primeiro número de um texto, aceitando vírgula decimal. `null` quando não há. */
export function numeroDoTexto(texto: string | null | undefined): number | null {
  if (!texto) return null
  const m = texto.replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}
