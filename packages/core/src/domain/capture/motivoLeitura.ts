// @sintera/core — POR QUE A LEITURA DO DOCUMENTO NÃO ACONTECEU.
//
// O DEFEITO QUE ISTO CORRIGE. `classifyDocument` devolvia `null` em CINCO situações completamente diferentes,
// todas caladas: a ponte com a Web não configurada, arquivo ausente, sessão ausente, o servidor recusando, e
// exceção de rede. Do lado de fora era sempre a mesma coisa — a pessoa fotografa a receita, os campos não se
// preenchem, e nada explica.
//
// E a primeira dessas cinco é justamente a que custou DOIS CICLOS de homologação: `EXPO_PUBLIC_WEB_URL` nunca
// esteve definida em nenhum build, então oito módulos do cliente devolviam `null` sem um sinal sequer. Corrigi
// a variável e NÃO corrigi o silêncio — o mesmo defeito voltaria na próxima configuração ausente, e voltaria
// igualmente invisível.
//
// A REGRA QUE ESTA SEMANA INTEIRA ENSINOU: degradar é certo; degradar calado não. Quando a leitura não roda, a
// pessoa precisa saber que ela NÃO RODOU — senão preenche à mão achando que a plataforma não sabe ler, e passa
// a não confiar num recurso que funciona.
//
// A distinção que mais importa aqui é entre "não consegui ler" e "li e não reconheci". A segunda é resposta
// legítima e não precisa de aviso; a primeira é um problema que tem dono e tem conserto.

export type MotivoLeituraFalha =
  /** A ponte com a Web não está configurada neste aplicativo. Problema NOSSO, de build. */
  | 'sem-ponte'
  /** O arquivo não pôde ser preparado para envio (conversão ou leitura local falhou). */
  | 'sem-arquivo'
  /** Sem sessão válida — a leitura acontece autenticada, como todo o resto. */
  | 'sem-sessao'
  /** O servidor respondeu, e recusou. */
  | 'servidor'
  /** Não houve resposta: rede indisponível, tempo esgotado. */
  | 'rede'

/**
 * O que a pessoa lê quando a leitura não rodou.
 *
 * Cada frase diz o que aconteceu E o que fazer — inclusive quando o que fazer é "nada, siga preenchendo". Um
 * aviso sem saída é só uma preocupação a mais.
 *
 * Nenhuma delas culpa a pessoa nem sugere que o documento está ruim: em todos os cinco casos o problema é da
 * plataforma ou do ambiente, e dizer o contrário faria ela fotografar de novo à toa.
 */
const MOTIVOS: Record<MotivoLeituraFalha, string> = {
  'sem-ponte':
    'A leitura automática não está disponível nesta versão do aplicativo. Preencha os campos à mão — nada se ' +
    'perde, e a próxima atualização corrige.',
  'sem-arquivo':
    'Não foi possível preparar este arquivo para a leitura automática. Preencha os campos à mão; o documento ' +
    'foi anexado normalmente.',
  'sem-sessao':
    'A leitura automática precisa da sua sessão, e ela expirou. Entre de novo para usá-la — ou preencha à mão ' +
    'agora, que o documento é salvo do mesmo jeito.',
  servidor:
    'A leitura automática não respondeu desta vez. Preencha os campos à mão; o documento foi anexado normalmente.',
  rede:
    'Sem conexão para a leitura automática. Preencha os campos à mão — o documento foi anexado e nada se perde.',
}

export function motivoLeituraLabel(m: MotivoLeituraFalha): string {
  return MOTIVOS[m]
}

/**
 * O resultado da leitura, com o motivo quando ela não aconteceu.
 *
 * `resultado` presente e `motivo` nulo = leu. Os dois nulos = leu e não reconheceu nada, que é resposta
 * legítima e silenciosa. `motivo` presente = NÃO rodou, e a tela diz por quê.
 */
export interface LeituraTentativa<T> {
  readonly resultado: T | null
  readonly motivo: MotivoLeituraFalha | null
}
