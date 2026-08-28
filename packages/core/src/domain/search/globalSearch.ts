// @sintera/core — BUSCA GLOBAL: o que a pessoa digita encontra o que ela REGISTROU, não só onde as coisas ficam.
//
// PEDIDO DA FUNDADORA (28/08), depois de testar a primeira versão: "qualquer palavra que estiver dentro da
// plataforma precisa ser encontrada. Quando eu digito 'vitamina D', devem aparecer todos os lugares que têm
// vitamina D — pode ser suplemento, pode ser resultado de exame — para eu escolher em qual quero entrar."
//
// O QUE EU TINHA FEITO ERRADO. A primeira busca procurava apenas nas SEÇÕES da plataforma (Exames, Medicamentos,
// Monitoramento…). "Vitamina D" não é seção: é um suplemento que ela cadastrou e um indicador dentro de um laudo.
// Buscar só o mapa e não o conteúdo devolve "nada encontrado" para exatamente a palavra que ela tinha em mente —
// e "nada encontrado" sobre um dado que EXISTE é pior do que não ter busca: ensina a não confiar nela.
//
// AS DUAS BUSCAS CONVIVEM, e são coisas diferentes:
//   • SEÇÕES (`searchSections`) — "onde eu registro pressão?" → Monitoramento. Navegação.
//   • REGISTROS (este arquivo)  — "onde está minha vitamina D?" → o suplemento X e o indicador do exame de 12/08.
// A tela mostra as duas, com os registros primeiro: quem digita o nome de uma coisa sua quer a coisa, não o mapa.
//
// ESTE ARQUIVO É PURO. Não consulta banco: recebe o que veio, decide ORDEM, RÓTULO e AGRUPAMENTO. As consultas
// vivem no api-client, uma só vez, servindo as duas pontas.

import type { SectionId } from '../navigation/sections'

/** De que natureza é o achado. Determina o rótulo e para onde o toque leva. */
export type HitKind =
  | 'medicamento' | 'suplemento' | 'recurso'
  | 'indicador' | 'exame' | 'documento'
  | 'condicao' | 'habito' | 'evento' | 'atividade' | 'sinal'

export interface SearchHit {
  readonly kind: HitKind
  /** Identificador do REGISTRO, para a tela abrir exatamente ele quando souber como. */
  readonly id: string
  /** O que casou com a busca, como a pessoa escreveu. Ex.: "Vitamina D3". */
  readonly title: string
  /** Contexto que distingue dois achados de mesmo nome. Ex.: "Exame de 12/08/2026". */
  readonly subtitle?: string | null
  /** Seção onde este registro vive — é para lá que a navegação leva. */
  readonly section: SectionId
}

/** Como cada natureza se chama na tela. A pessoa precisa saber POR QUE aquele achado apareceu. */
const ROTULO: Record<HitKind, string> = {
  medicamento: 'Medicamento',
  suplemento: 'Suplemento',
  recurso: 'Recurso de saúde',
  indicador: 'Indicador de exame',
  exame: 'Exame',
  documento: 'Documento',
  condicao: 'Condição de saúde',
  habito: 'Hábito',
  evento: 'Agenda',
  atividade: 'Atividade física',
  sinal: 'Sinal vital',
}

export function hitKindLabel(kind: HitKind): string {
  return ROTULO[kind] ?? 'Registro'
}

/**
 * Ordem das naturezas quando a busca acha coisas de tipos diferentes.
 *
 * Critério: o que a pessoa MANTÉM vem antes do que ela recebeu. Digitar "vitamina D" é quase sempre procurar o
 * suplemento que se toma; o indicador do laudo é a segunda pergunta, não a primeira. Exames e documentos vêm
 * depois porque se procuram pela data e pelo emissor, não pelo nome do analito.
 */
const PESO: Record<HitKind, number> = {
  suplemento: 0, medicamento: 1, recurso: 2,
  condicao: 3, habito: 4,
  indicador: 5, exame: 6, documento: 7,
  sinal: 8, atividade: 9, evento: 10,
}

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Ordena e limita os achados vindos das consultas.
 *
 * A ordem final combina três critérios, nesta precedência:
 *   1. quão direto foi o acerto (o título COMEÇA com o que se digitou vem antes de conter no meio);
 *   2. o peso da natureza (ver PESO);
 *   3. a ordem em que chegou — para a mesma busca devolver sempre a mesma lista.
 *
 * `limite` existe porque a tela é um celular: cinquenta achados não ajudam ninguém a escolher. Quem não achou
 * nos primeiros refina a palavra, que é mais rápido do que rolar.
 */
export function rankHits(hits: readonly SearchHit[], query: string, limite = 20): SearchHit[] {
  const q = normalizar(query)
  if (!q) return []

  return hits
    .map((hit, ordemDeChegada) => {
      const t = normalizar(hit.title)
      const direto = t.startsWith(q) ? 0 : t.includes(q) ? 1 : 2
      return { hit, direto, peso: PESO[hit.kind] ?? 99, ordemDeChegada }
    })
    .sort((a, b) => a.direto - b.direto || a.peso - b.peso || a.ordemDeChegada - b.ordemDeChegada)
    .slice(0, limite)
    .map(x => x.hit)
}

/**
 * Agrupa por natureza, preservando a ordem já decidida por `rankHits`.
 *
 * A tela mostra "SUPLEMENTO" e abaixo os suplementos, depois "INDICADOR DE EXAME" e abaixo os indicadores. Sem
 * o agrupamento, dois achados com o mesmo nome — o suplemento Vitamina D e o indicador Vitamina D — ficariam
 * indistinguíveis um embaixo do outro, e a escolha que a fundadora pediu ("para eu escolher em qual quero
 * entrar") não existiria.
 */
export function groupHits(hits: readonly SearchHit[]): { kind: HitKind; label: string; hits: SearchHit[] }[] {
  const grupos: { kind: HitKind; label: string; hits: SearchHit[] }[] = []
  for (const h of hits) {
    let g = grupos.find(x => x.kind === h.kind)
    if (!g) { g = { kind: h.kind, label: hitKindLabel(h.kind), hits: [] }; grupos.push(g) }
    g.hits.push(h)
  }
  return grupos
}

/** Quantos caracteres antes de valer a pena consultar o banco. Menos que isto casa com quase tudo. */
export const SEARCH_MIN_CHARS = 2

/** A busca deve ir ao banco? Guarda ÚNICA — as duas pontas param no mesmo ponto. */
export function shouldQuery(query: string): boolean {
  return normalizar(query ?? '').length >= SEARCH_MIN_CHARS
}
