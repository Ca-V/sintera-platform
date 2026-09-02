// @sintera/core — QUÃO ATUAL É O "ESTADO ATUAL"?
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A OBSERVAÇÃO DA FUNDADORA (homologação de 31/08/2026): "Nesta página da composição corporal, está escrito
// estado atual. Na verdade, não é a melhor expressão aqui, porque os dados [...] são dados de uma
// bioimpedância de dois mil e vinte e três. Então, precisa rever esta frase, e rever os dados que são
// informados."
//
// Ela está certa, e o problema é maior do que a palavra. `currentSummary` devolve, para CADA indicador, o
// ponto mais recente DAQUELE indicador — de propósito, e corretamente: o peso dela é de dias atrás, a gordura
// corporal é de 2023, e não existe motivo para esconder a gordura só porque é antiga.
//
// O erro está no CABEÇALHO, que promete uma coisa que a lista não entrega:
//     Aplicativo: "Estado atual"
//     Web:        "Como você está hoje?"   ← pior ainda: afirma HOJE sobre um dado de três anos
//
// Um número de 2023 sob o título "como você está hoje" não é um detalhe de redação. É a plataforma afirmando
// algo falso sobre a saúde de alguém, num painel que vai ao médico.
//
// A CORREÇÃO NÃO É ESCONDER O DADO ANTIGO — é parar de chamá-lo de atual, e dizer de quando ele é.
// A plataforma organiza e preserva; não decide que um exame de 2023 deixou de valer (ADR-000 / RDC 657).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { bodyMetricLabel } from './metrics'

/** O mínimo que este módulo precisa saber de cada indicador exibido. */
export interface IndicadorExibido {
  readonly metric: string
  /** ISO 'YYYY-MM-DD' da medição. */
  readonly date?: string | null
}

export interface AtualidadeDoResumo {
  /** O cabeçalho HONESTO da seção. */
  readonly titulo: string
  /** A frase que explica o que a lista é. */
  readonly explicacao: string
  /**
   * O intervalo, nomeado, quando os dados estão distantes entre si. `null` quando tudo é do mesmo período —
   * aí a frase seria ruído.
   */
  readonly intervalo: string | null
  /** Há dado com mais de um ano? A tela pode destacar; a decisão de destacar é dela, não daqui. */
  readonly temDadoAntigo: boolean
}

/** A partir de quantos dias de distância entre a medição mais nova e a mais velha vale nomear o intervalo. */
export const DIAS_PARA_NOMEAR_INTERVALO = 180
const DIAS_PARA_ANTIGO = 365

function dias(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00Z`).getTime()
  const b = new Date(`${bISO}T00:00:00Z`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.abs(a - b) / 86_400_000
}

function br(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/**
 * O cabeçalho honesto para a lista de indicadores. PURA — recebe `hoje`, não consulta o relógio.
 *
 * Nunca afirma que os números são de hoje, porque em geral não são. Diz o que a lista É: a última medição de
 * cada indicador, cada uma com a sua própria data.
 */
export function atualidadeDoResumo(
  indicadores: readonly IndicadorExibido[],
  hoje: Date,
): AtualidadeDoResumo {
  const comData = indicadores.filter(i => !!i.date).map(i => ({ metric: i.metric, date: i.date as string }))

  const base: AtualidadeDoResumo = {
    titulo: 'Última medição de cada indicador',
    explicacao: 'Cada número é o registro mais recente daquele indicador — e as datas podem ser diferentes entre si.',
    intervalo: null,
    temDadoAntigo: false,
  }
  if (comData.length === 0) return base

  // DESEMPATE PELO NOME DO INDICADOR, e não é detalhe: gordura corporal e massa muscular vêm da MESMA
  // bioimpedância, na mesma data. Sem desempate, qual delas seria nomeada como "a mais antiga" dependia da
  // ordem em que a lista chegou — o mesmo painel exibindo dois rótulos diferentes entre uma abertura e outra.
  // Número que muda sozinho numa tela de saúde destrói a confiança em tudo o que está ao lado dele.
  const ordenados = [...comData].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.metric.localeCompare(b.metric),
  )
  const maisNovo = ordenados[0]
  const maisAntigo = ordenados[ordenados.length - 1]

  const hojeISO = hoje.toISOString().slice(0, 10)
  const temDadoAntigo = dias(hojeISO, maisAntigo.date) > DIAS_PARA_ANTIGO

  // Um indicador só, ou tudo do mesmo período: nomear o intervalo seria ruído.
  if (maisNovo.date === maisAntigo.date || dias(maisNovo.date, maisAntigo.date) < DIAS_PARA_NOMEAR_INTERVALO) {
    return { ...base, temDadoAntigo }
  }

  return {
    ...base,
    temDadoAntigo,
    intervalo: `Do mais recente (${bodyMetricLabel(maisNovo.metric)}, ${br(maisNovo.date)}) ao mais antigo (${bodyMetricLabel(maisAntigo.metric)}, ${br(maisAntigo.date)}).`,
  }
}
