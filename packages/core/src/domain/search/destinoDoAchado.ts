// @sintera/core — PARA ONDE A BUSCA LEVA quando a pessoa toca num achado.
//
// O DEFEITO (homologação de 31/08). A fundadora buscou "hemograma". A plataforma ACHOU o exame certo — o do
// Hermes Pardini, de 01/04/2025, que tem a palavra no laudo. Ela tocou no resultado, e a tela de Exames abriu
// dizendo **"Nenhum resultado para os filtros atuais"**.
//
// A causa: a navegação usava só `hit.section` e DESCARTAVA `hit.id`. Levava à seção, não ao registro. E a
// lista de Exames filtra por TIPO — "hemograma" está dentro do laudo, não no nome do exame —, então a tela de
// destino negava justamente o que a busca tinha acabado de encontrar.
//
// É a pior forma desse defeito: não é a plataforma não achar. É achar, mostrar, e depois desdizer. Isso não
// frustra — ensina a não confiar na busca.
//
// E o `id` sempre esteve lá. O comentário em `SearchHit` dizia, literalmente, "para a tela abrir exatamente
// ele QUANDO SOUBER COMO". Mais um caso de especificado e nunca ligado, com a lacuna documentada no próprio
// código e nunca fechada.
//
// POR QUE A DECISÃO MORA NO NÚCLEO: qual registro abrir é a mesma pergunta nas duas pontas. A ROTA é de cada
// plataforma — `ExamDetail` no aplicativo, `/dashboard/exams/[id]` na Web —, mas "este achado abre o exame de
// id X" não pode divergir. Decidido em dois lugares, um deles esqueceria um tipo.
import type { SearchHit } from './globalSearch'
import type { SectionId } from '../navigation/sections'

/**
 * O registro que este achado abre, quando a plataforma sabe abrir um.
 *
 * `chave` é o que identifica o registro na rota de detalhe — nem sempre um id: a página longitudinal de um
 * indicador é endereçada pelo NOME do marcador, porque ela reúne todas as medições dele ao longo do tempo, e
 * não uma linha específica.
 */
export interface RegistroAlvo {
  readonly tipo: 'exame' | 'indicador' | 'painel-omico'
  readonly chave: string
}

export interface DestinoDoAchado {
  /** Sempre presente — é o destino mínimo, e o que vale quando não há tela de detalhe. */
  readonly section: SectionId
  /** Presente quando a plataforma sabe abrir o REGISTRO. `null` = leva à seção, como antes. */
  readonly registro: RegistroAlvo | null
}

/**
 * Para onde levar.
 *
 * DEGRADA PARA A SEÇÃO, nunca para lugar nenhum: um tipo de achado sem tela de detalhe continua levando à
 * seção onde o registro vive, que é o comportamento que já existia. Acrescentar uma tela de detalhe depois é
 * acrescentar um caso aqui — nada quebra enquanto isso.
 *
 * Os três tipos com destino próprio são os que TÊM tela de detalhe nas duas pontas hoje. Medicamento,
 * documento e condição vivem em listas, e abrir a lista é o melhor que existe para eles — até existir a tela.
 */
export function destinoDoAchado(hit: SearchHit): DestinoDoAchado {
  switch (hit.kind) {
    case 'exame':
      return { section: hit.section, registro: { tipo: 'exame', chave: hit.id } }
    case 'indicador':
      // Pelo NOME, e não pelo id da medição: a página do indicador é a série inteira dele no tempo. Abrir uma
      // medição isolada devolveria menos do que a busca já mostrou.
      return { section: hit.section, registro: { tipo: 'indicador', chave: hit.title } }
    default:
      return { section: hit.section, registro: null }
  }
}

/**
 * O achado leva direto ao registro?
 *
 * Existe para a tela poder DIZER isso à pessoa antes do toque — um resultado que abre o exame e um que abre
 * uma lista são promessas diferentes, e confundi-las é o que produziu o defeito de 31/08.
 */
export function abreORegistro(hit: SearchHit): boolean {
  return destinoDoAchado(hit).registro !== null
}
