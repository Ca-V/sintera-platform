// @sintera/core — BOD-001: a ORDEM da tela de Composição Corporal e por onde se adicionam dados.
//
// ============================================================================================
// POR QUE ISTO EXISTE
// ============================================================================================
// Em 28/09/2026 eu trouxe o TEXTO desta tela para o core e declarei a paridade resolvida. A fundadora
// comparou de novo, seção por seção, e mostrou que não estava:
//
//   Web:  Última medição → Progresso → Evolução (marcos dentro) → Comparação → Registros
//   App:  Progresso → Última medição → Evolução → Comparação → Marcos (bloco solto) → Registros
//
// As palavras passaram a bater e a ORDEM continuou divergindo — porque ordem também é decisão, e eu tinha
// corrigido só metade. Duas telas com as mesmas seções em sequências diferentes não são o mesmo produto: a
// pessoa que usa as duas reaprende a tela cada vez que troca de aparelho.
//
// Havia ainda um bloco só do aplicativo ("Escanear laudo de bioimpedância") e um só da Web (um retângulo
// explicando o que é bioimpedância). Os dois saíram: o primeiro virou uma das formas do botão único; o
// segundo a fundadora dispensou.

export type SecaoDaComposicao =
  | 'ultima-medicao'
  | 'progresso'
  | 'evolucao'
  | 'comparacao'
  | 'registros'

/**
 * A ordem da tela, nas duas pontas.
 *
 * A sequência não é arbitrária — ela vai do mais concreto ao mais interpretativo, e é a ordem em que a
 * pergunta de quem abre a tela normalmente se desdobra:
 *
 *  1. "quanto eu estou?"           → última medição de cada indicador
 *  2. "estou indo para onde?"      → a jornada de peso
 *  3. "como cheguei aqui?"         → a evolução no tempo, com os marcos que podem explicá-la
 *  4. "o que mudou entre dois?"    → a comparação A × B
 *  5. "o que exatamente eu tenho?" → os registros crus
 *
 * OS MARCOS NÃO SÃO SEÇÃO. Eles vivem DENTRO da evolução, porque só fazem sentido ao lado da curva que
 * ajudam a explicar. Num bloco separado — como estavam no aplicativo — viram uma lista de datas sem pergunta.
 */
export const SECOES_COMPOSICAO: readonly SecaoDaComposicao[] = [
  'ultima-medicao',
  'progresso',
  'evolucao',
  'comparacao',
  'registros',
]

/** A posição de uma seção. `-1` para o que não é seção — os marcos, por exemplo. */
export function posicaoDaSecao(s: string): number {
  return SECOES_COMPOSICAO.indexOf(s as SecaoDaComposicao)
}

// ------------------------------------------------------------------------------------------------------
// O botão único
// ------------------------------------------------------------------------------------------------------

/**
 * TODA forma de acrescentar dado de composição corporal entra por um lugar só.
 *
 * DECISÃO DA FUNDADORA (28/09/2026): "ao invés de adicionar medida, seria importante que tivesse uma opção
 * que engloba todas as opções de adicionar dados referentes à composição corporal — seja laudo de
 * bioimpedância, seja medida, seja dados da balança, ou dados de qualquer outro equipamento".
 *
 * É a aplicação, aqui, do princípio permanente de ENTRADA DOCUMENTAL ÚNICA: todo ponto de entrada oferece
 * todos os métodos, num componente só, e nenhuma tela reimplementa o seu.
 *
 * O que isso corrige na prática: o aplicativo tinha "Escanear laudo de bioimpedância" como botão separado —
 * uma forma privilegiada, visível, ao lado de outra que não a mencionava. Quem não reconhecesse a palavra
 * "bioimpedância" não descobriria que dava para fotografar o laudo.
 */
export type FormaDeAdicionar = 'documento' | 'manual' | 'dispositivo'

export interface OpcaoDeAdicionar {
  readonly forma: FormaDeAdicionar
  readonly label: string
  /** O que acontece ao escolher — dito antes, para a escolha não ser às cegas. */
  readonly descricao: string
}

export const FORMAS_DE_ADICIONAR: readonly OpcaoDeAdicionar[] = [
  {
    forma: 'documento',
    label: 'Enviar laudo ou foto',
    descricao: 'Bioimpedância, DEXA ou qualquer laudo. A SINTERA lê e preenche as medidas para você conferir.',
  },
  {
    forma: 'manual',
    label: 'Digitar uma medida',
    descricao: 'Peso, gordura, massa muscular e outros — um valor por vez.',
  },
  {
    forma: 'dispositivo',
    label: 'Conectar uma balança',
    descricao: 'Balanças e aparelhos compatíveis passam a enviar as medidas sozinhos.',
  },
]

/** O rótulo do botão único. Genérico de propósito: ele não pode sugerir só uma das formas. */
export const ROTULO_ADICIONAR = 'Adicionar dados'

/**
 * A forma continua na lista quando a plataforma não a suporta? SIM — ela aparece e explica.
 *
 * Sumir com a opção faria a pessoa procurar num lugar onde nunca esteve. Aparecer com o motivo é o que o
 * princípio de disponibilidade universal pede: o recurso que não cabe ali se declara indisponível, não some.
 */
export function formasDisponiveis(): readonly OpcaoDeAdicionar[] {
  return FORMAS_DE_ADICIONAR
}
