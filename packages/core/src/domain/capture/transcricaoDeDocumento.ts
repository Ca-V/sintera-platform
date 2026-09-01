// @sintera/core — A TRANSCRIÇÃO DE UM DOCUMENTO: o que se aceita como lido, e o que não.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// DECISÃO DA FUNDADORA (01/09/2026): "todos os documentos que são adicionados precisam ser lidos e
// transcritos. [...] de dezenove precisa ler dezenove."
//
// Antes disso, o texto de um documento só existia quando o arquivo trazia camada de texto. Foto de laudo, PDF
// escaneado e receita fotografada entravam, eram marcados "processado", e ficavam sem uma palavra
// pesquisável — indistinguíveis de um documento lido por inteiro.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// TRANSCREVER NÃO É INTERPRETAR, e essa fronteira é a razão de este módulo poder existir (ADR-000 / RDC
// 657/2022). Copiar o que está escrito num papel é ato factual, do mesmo tipo que "este documento é uma
// receita". Dizer o que o resultado significa é ato clínico, e não acontece aqui nem em lugar nenhum da
// plataforma.
//
// A regra que sustenta isso na prática: o que não se consegue ler é MARCADO como ilegível, nunca completado.
// Um modelo que "adivinha" a palavra borrada produz um laudo plausível e falso — e um número inventado num
// documento de saúde é o pior defeito que esta plataforma pode ter.

/** De onde veio o texto. Cópia dos bytes do arquivo e leitura de pixels NÃO são a mesma coisa. */
export type OrigemDoTexto = 'pdf_nativo' | 'transcricao_visao' | 'recuperado_de_marcadores' | 'digitado'

/**
 * Como terminou a leitura.
 *
 * As quatro são distintas de propósito, e cada confusão entre elas já custou um ciclo de homologação:
 *   ok        — leu o documento inteiro
 *   parcial   — leu, e há trechos que o próprio modelo marcou como ilegíveis
 *   ilegivel  — leu e NADA estava legível (foto escura, documento borrado)
 *   falhou    — NÃO CONSEGUIU LER (rede, cota, erro do provedor)
 *
 * "falhou" nunca pode aparecer como "não havia nada": um é problema nosso, o outro é fato sobre o documento,
 * e só o primeiro se resolve tentando de novo.
 */
export type StatusDaTranscricao = 'ok' | 'parcial' | 'ilegivel' | 'falhou'

/** O que o modelo escreve onde não conseguiu ler. Fica NO TEXTO, visível a quem for conferir. */
export const MARCADOR_ILEGIVEL = '[ilegível]'

export interface Transcricao {
  readonly texto: string | null
  readonly status: StatusDaTranscricao
  /** Quantos trechos o modelo marcou como ilegíveis. */
  readonly trechosIlegiveis: number
}

/** O que o modelo devolve, ainda sem confiança nenhuma. Tudo é `unknown` porque vem de fora. */
export interface RespostaBruta {
  readonly texto?: unknown
  readonly status?: unknown
  readonly trechos_ilegiveis?: unknown
}

const textoLimpo = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t : null
}

/**
 * Converte a resposta do modelo numa transcrição em que se pode confiar — ou declara que não deu.
 *
 * DEFENSIVA POR PRINCÍPIO: o formato vem de fora e pode mudar sem aviso. Qualquer coisa fora do esperado vira
 * 'falhou', nunca 'ok'. Errar para o lado de "não li" é recuperável; errar para o lado de "li" grava um vazio
 * com aparência de leitura completa, e ninguém descobre depois.
 */
export function avaliarTranscricao(bruta: RespostaBruta | null | undefined): Transcricao {
  if (!bruta || typeof bruta !== 'object') {
    return { texto: null, status: 'falhou', trechosIlegiveis: 0 }
  }

  const texto = textoLimpo(bruta.texto)
  const declarado = typeof bruta.status === 'string' ? bruta.status.trim().toLowerCase() : ''

  // CONTA-SE NO TEXTO, não se acredita no número declarado. O modelo pode dizer "0 ilegíveis" e ter escrito
  // três marcadores; o texto é a evidência, e é ele que manda.
  const trechosIlegiveis = texto ? contarMarcadores(texto) : 0

  // Sem texto, não há transcrição. Se o modelo mesmo disse 'ilegivel', é fato sobre o documento; senão, a
  // resposta veio quebrada e isso é falha nossa — e as duas coisas se resolvem de maneiras diferentes.
  if (!texto) {
    return { texto: null, status: declarado === 'ilegivel' ? 'ilegivel' : 'falhou', trechosIlegiveis: 0 }
  }

  // O TEXTO É SÓ MARCADOR: leu-se a página e nada estava legível.
  if (semConteudoAlemDosMarcadores(texto)) {
    return { texto, status: 'ilegivel', trechosIlegiveis }
  }

  // Há trecho ilegível → é PARCIAL, ainda que o modelo tenha dito 'ok'. A evidência vence a declaração.
  if (trechosIlegiveis > 0) return { texto, status: 'parcial', trechosIlegiveis }

  return { texto, status: 'ok', trechosIlegiveis: 0 }
}

function contarMarcadores(texto: string): number {
  // Aceita variações de acento e caixa, porque é texto gerado: [ilegível], [ILEGIVEL], [ilegivel].
  const re = /\[\s*ileg[íi]vel\s*\]/gi
  return (texto.match(re) ?? []).length
}

function semConteudoAlemDosMarcadores(texto: string): boolean {
  const semMarcador = texto.replace(/\[\s*ileg[íi]vel\s*\]/gi, ' ')
  // Sobra alguma letra ou algum dígito? Pontuação e espaço não são conteúdo.
  return !/[\p{L}\p{N}]/u.test(semMarcador)
}

/** A transcrição serve para a busca alcançar o documento? */
export function buscavel(status: StatusDaTranscricao): boolean {
  return status === 'ok' || status === 'parcial'
}

/**
 * Junta as transcrições das PÁGINAS de um documento numa só.
 *
 * Receitas e atestados são fotografados página a página, e a fundadora fotografa na ordem em que quer ler.
 * A ordem do array É a ordem do documento; este módulo não reordena nada.
 *
 * O ESTADO DO CONJUNTO É O DA PIOR PÁGINA, e essa é a decisão que importa: um documento de três páginas em
 * que a segunda não foi lida NÃO está lido. Chamá-lo de 'ok' porque duas páginas deram certo é a mesma
 * mentira que "processado" contava — só que dividida em pedaços.
 */
export function combinarTranscricoes(paginas: readonly Transcricao[]): Transcricao {
  if (paginas.length === 0) return { texto: null, status: 'falhou', trechosIlegiveis: 0 }
  if (paginas.length === 1) return paginas[0]

  const comTexto = paginas.filter(p => p.texto)
  const trechosIlegiveis = paginas.reduce((s, p) => s + p.trechosIlegiveis, 0)
  const algumaFalhou = paginas.some(p => p.status === 'falhou')

  // Nenhuma página produziu texto. 'falhou' vence 'ilegivel' porque só ele se resolve tentando de novo, e
  // oferecer "tentar de novo" para um documento genuinamente ilegível seria mandar a pessoa repetir em vão.
  if (comTexto.length === 0) {
    return { texto: null, status: algumaFalhou ? 'falhou' : 'ilegivel', trechosIlegiveis: 0 }
  }

  const texto = paginas
    .map((p, i) => {
      const cabecalho = `--- página ${i + 1} de ${paginas.length} ---`
      // A página que não foi lida É DECLARADA no corpo do texto, no lugar dela. Omiti-la faria o documento
      // parecer completo para quem lesse a transcrição — e é a transcrição que vai ao médico.
      const corpo = p.texto ?? (p.status === 'falhou'
        ? '(não foi possível ler esta página)'
        : `(nada legível nesta página) ${MARCADOR_ILEGIVEL}`)
      return `${cabecalho}\n${corpo}`
    })
    .join('\n\n')

  const completo = comTexto.length === paginas.length && trechosIlegiveis === 0 && !algumaFalhou
  return { texto, status: completo ? 'ok' : 'parcial', trechosIlegiveis }
}

const ORIGEM_LABEL: Record<OrigemDoTexto, string> = {
  pdf_nativo: 'Texto do próprio arquivo',
  transcricao_visao: 'Transcrito da imagem pela leitura assistida',
  recuperado_de_marcadores: 'Recomposto do que já havia sido extraído',
  digitado: 'Digitado por você',
}
export function origemLabel(o: string | null | undefined): string | null {
  return ORIGEM_LABEL[(o ?? '') as OrigemDoTexto] ?? null
}

/**
 * A frase que a pessoa lê sobre o estado da leitura deste documento.
 *
 * Factual e específica. "Não foi possível processar" — que responde por tudo e não ajuda em nada — é
 * exatamente o que estas quatro frases existem para substituir.
 */
export function statusFrase(status: StatusDaTranscricao, trechosIlegiveis = 0): string {
  switch (status) {
    case 'ok':
      return 'Documento lido por inteiro — a busca alcança o conteúdo.'
    case 'parcial':
      return trechosIlegiveis === 1
        ? 'Documento lido, com 1 trecho ilegível marcado no texto.'
        : `Documento lido, com ${trechosIlegiveis} trechos ilegíveis marcados no texto.`
    case 'ilegivel':
      return 'O documento foi lido, mas nada nele estava legível. O arquivo continua guardado; uma foto mais nítida costuma resolver.'
    case 'falhou':
      // A distinção que importa: isto é problema NOSSO, e tentar de novo faz sentido.
      return 'Não foi possível ler este documento agora — a leitura falhou, e não porque o documento esteja vazio. Você pode tentar novamente.'
  }
}
