// @sintera/core — POR QUE ESTE DADO NÃO APARECE AQUI.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// PEDIDO DA FUNDADORA (01/09/2026), e ele generaliza um princípio que esta plataforma já pagou caro para
// aprender: "caso algum dado não apareça na web, que na página respectiva apareça uma mensagem informando,
// informando também o porquê."
//
// A seção vazia que simplesmente SOME é a forma mais cara de silêncio. Foi assim que ela abriu Conexões no
// navegador e viu uma página em branco — e concluiu que a plataforma não fazia integração. Foi assim que
// "nada novo desde a última vez" respondeu por cinco situações diferentes no aplicativo. E foi assim que dez
// exames marcados "processado" não tinham uma palavra pesquisável dentro.
//
// AUSÊNCIA É INFORMAÇÃO. Quando ela vem sem explicação, a pessoa preenche a lacuna com a pior hipótese
// disponível: "perdi meu dado" ou "isto não funciona".
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// A REGRA DE FATO, que estas frases traduzem:
//
//   1. O APARELHO É CONDUTO, NUNCA ARMAZENAMENTO. O que o celular lê sobe para a nuvem na MESMA
//      sincronização — então a Web lê exatamente os mesmos dados. Não existe dado "preso no celular".
//   2. A AUTORIZAÇÃO acontece no celular, e não é escolha nossa: Google (Health Connect) e Apple (Saúde) não
//      oferecem caminho por navegador. Prometer um botão de conectar aqui seria mentir.
//   3. Logo, seção vazia na Web tem TRÊS causas possíveis, e a pessoa precisa saber qual verificar.

export type SecaoDeDados = 'sinais' | 'passos' | 'atividade' | 'composicao'

export interface AusenciaExplicada {
  /** O que falta, dito de frente. */
  readonly titulo: string
  /** Por que pode estar faltando — em ordem do mais provável ao menos. */
  readonly motivos: readonly string[]
  /** O que fazer, e ONDE. Nunca aponta um botão que não existe nesta tela. */
  readonly oQueFazer: string
}

/** O que cada seção recebe automaticamente. Escrito uma vez; as duas pontas leem daqui. */
const O_QUE_CHEGA: Record<SecaoDeDados, string> = {
  sinais: 'Frequência cardíaca, pressão, glicemia, saturação e temperatura',
  passos: 'Os passos contados pelo celular ou pela pulseira',
  atividade: 'As atividades registradas por aplicativos como Strava, Google Fit e Samsung Health',
  composicao: 'Peso e composição corporal de balanças conectadas',
}

/**
 * A explicação para uma seção vazia na Web.
 *
 * `houveSincronizacao` distingue os dois casos que a pessoa precisa separar: nunca chegou nada de aparelho
 * nenhum (o caminho automático não foi ligado), ou já chegou coisa antes e ESTA seção segue vazia (a fonte
 * não fornece este tipo de dado, ou não foi autorizada para ele).
 *
 * Sem essa distinção, quem já sincronizou leria "conecte um aparelho" e concluiria, errado, que perdeu o que
 * tinha — que é exatamente o susto que a tela deve evitar.
 */
export function ausenciaExplicada(
  secao: SecaoDeDados,
  params: { readonly houveSincronizacao: boolean },
): AusenciaExplicada {
  const chega = O_QUE_CHEGA[secao]

  if (!params.houveSincronizacao) {
    return {
      titulo: 'Nada foi registrado aqui ainda.',
      motivos: [
        `${chega} entram sozinhos quando você conecta uma fonte de dados.`,
        'A autorização é feita no aplicativo, no celular — Google e Apple não permitem conectar pelo navegador.',
        'Depois de autorizar uma vez, o que for lido no celular aparece aqui automaticamente.',
      ],
      oQueFazer: 'Você também pode registrar manualmente, em Adicionar.',
    }
  }

  return {
    titulo: 'Você já recebe dados de aparelho, mas nada chegou nesta seção.',
    motivos: [
      `A fonte conectada pode não fornecer este tipo de dado: ${chega.toLowerCase()}.`,
      'A permissão pode ter sido concedida para alguns tipos e não para este — a autorização é por tipo de dado.',
      'Pode não haver registro no período: a sincronização traz o que existe na fonte, e não inventa o que falta.',
    ],
    oQueFazer: 'Confira as permissões na tela de Conexões, no aplicativo, e o que entrou em Dados recebidos.',
  }
}
